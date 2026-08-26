import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { customerMessages, inquiryNotificationEvents } from "../drizzle/schema";
import { getDb } from "./db";
import {
  sendCustomerMessageNotification,
  sendInquiryOperationsSummary,
} from "./email_notification";

const WORKER_INTERVAL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MINUTES = [5, 30];

let workerRunning = false;
let workerTimer: NodeJS.Timeout | undefined;

function toDbTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextRetryAt(attemptCount: number, now: Date): string | null {
  const delayMinutes = RETRY_DELAYS_MINUTES[attemptCount - 1];
  if (delayMinutes === undefined) return null;
  return toDbTimestamp(new Date(now.getTime() + delayMinutes * 60 * 1000));
}

async function enqueueEvent(input: {
  eventType: "new_message" | "daily_summary" | "sla24" | "sla48";
  dedupeKey: string;
  messageId?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(inquiryNotificationEvents).values({
      eventType: input.eventType,
      dedupeKey: input.dedupeKey,
      messageId: input.messageId,
      status: "pending",
      attemptCount: 0,
      nextAttemptAt: toDbTimestamp(new Date()),
    });
  } catch {
    // The table's unique dedupe key makes re-enqueue safe across restarts.
  }
}

/** Queue a newly stored inquiry without making customer submission depend on SMTP. */
export async function enqueueInquiryNotification(messageId: number): Promise<void> {
  await enqueueEvent({
    eventType: "new_message",
    messageId,
    dedupeKey: `new-message-${messageId}`,
  });
  void processInquiryNotificationEvents();
}

async function enqueueOperationalEvents(now: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const dayKey = utcDateKey(now);
  const todayStart = `${dayKey} 00:00:00`;
  const newTodayRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerMessages)
    .where(gte(customerMessages.createdAt, todayStart));
  const newToday = Number(newTodayRows[0]?.count || 0);

  // Produce one privacy-preserving daily summary after 08:00 UTC whenever there
  // were new messages. The event dedupe key prevents repeats after process restarts.
  if (now.getUTCHours() >= 8 && newToday > 0) {
    await enqueueEvent({ eventType: "daily_summary", dedupeKey: `daily-summary-${dayKey}` });
  }

  for (const hours of [24, 48] as const) {
    const cutoff = toDbTimestamp(new Date(now.getTime() - hours * 60 * 60 * 1000));
    const overdueRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerMessages)
      .where(and(eq(customerMessages.status, "new"), lte(customerMessages.createdAt, cutoff)));
    if (Number(overdueRows[0]?.count || 0) > 0) {
      await enqueueEvent({
        eventType: hours === 24 ? "sla24" : "sla48",
        dedupeKey: `sla-${hours}-${dayKey}`,
      });
    }
  }
}

async function countNewMessages(from?: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const condition = from
    ? and(eq(customerMessages.status, "new"), gte(customerMessages.createdAt, from))
    : eq(customerMessages.status, "new");
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(customerMessages)
    .where(condition);
  return Number(rows[0]?.count || 0);
}

async function deliverEvent(event: typeof inquiryNotificationEvents.$inferSelect): Promise<boolean> {
  if (event.eventType === "new_message") {
    if (!event.messageId) return false;
    const db = await getDb();
    if (!db) return false;
    const messageRows = await db
      .select()
      .from(customerMessages)
      .where(eq(customerMessages.id, event.messageId))
      .limit(1);
    const message = messageRows[0];
    if (!message) return false;
    const result = await sendCustomerMessageNotification({
      type: message.type,
      name: message.name,
      email: message.email,
      company: message.company || undefined,
      phone: message.phone || undefined,
      message: message.message,
      productId: message.productId || undefined,
      productName: message.productName || undefined,
      productPartNumber: message.productPartNumber || undefined,
    });
    return result.success;
  }

  const now = new Date();
  if (event.eventType === "daily_summary") {
    const todayStart = `${utcDateKey(now)} 00:00:00`;
    return (await sendInquiryOperationsSummary({
      kind: "daily_summary",
      newCount: await countNewMessages(todayStart),
    })).success;
  }

  const hours = event.eventType === "sla24" ? 24 : 48;
  const cutoff = toDbTimestamp(new Date(now.getTime() - hours * 60 * 60 * 1000));
  const overdueRows = await (await getDb())
    ?.select({ count: sql<number>`count(*)` })
    .from(customerMessages)
    .where(and(eq(customerMessages.status, "new"), lte(customerMessages.createdAt, cutoff)));
  const overdueCount = Number(overdueRows?.[0]?.count || 0);
  if (overdueCount === 0) return true;

  return (await sendInquiryOperationsSummary({
    kind: event.eventType,
    overdueCount,
  })).success;
}

async function markDeliveryResult(
  event: typeof inquiryNotificationEvents.$inferSelect,
  success: boolean,
  now: Date,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const attemptCount = event.attemptCount + 1;

  if (success) {
    await db
      .update(inquiryNotificationEvents)
      .set({
        status: "sent",
        attemptCount,
        sentAt: toDbTimestamp(now),
        nextAttemptAt: toDbTimestamp(now),
        lastErrorCode: null,
      })
      .where(eq(inquiryNotificationEvents.id, event.id));
    console.log("[InquiryNotifications] Delivery event sent");
    return;
  }

  const retryAt = nextRetryAt(attemptCount, now);
  await db
    .update(inquiryNotificationEvents)
    .set({
      status: retryAt ? "retry" : "failed",
      attemptCount,
      nextAttemptAt: retryAt || toDbTimestamp(now),
      lastErrorCode: "delivery_failed",
    })
    .where(eq(inquiryNotificationEvents.id, event.id));
  console.warn(retryAt
    ? "[InquiryNotifications] Delivery deferred for bounded retry"
    : "[InquiryNotifications] Delivery failed after bounded retries");
}

/** Process due events. Safe to invoke at startup, on submission, and on an interval. */
export async function processInquiryNotificationEvents(): Promise<void> {
  if (workerRunning) return;
  workerRunning = true;
  try {
    const db = await getDb();
    if (!db) return;
    const now = new Date();
    await enqueueOperationalEvents(now);

    const dueEvents = await db
      .select()
      .from(inquiryNotificationEvents)
      .where(and(
        inArray(inquiryNotificationEvents.status, ["pending", "retry"]),
        lte(inquiryNotificationEvents.nextAttemptAt, toDbTimestamp(now)),
      ))
      .limit(25);

    for (const event of dueEvents) {
      let success = false;
      try {
        success = await deliverEvent(event);
      } catch {
        success = false;
      }
      await markDeliveryResult(event, success, now);
    }
  } catch {
    console.error("[InquiryNotifications] Worker cycle failed");
  } finally {
    workerRunning = false;
  }
}

/** Start a lightweight in-process worker. Persisted due events survive restarts. */
export function startInquiryNotificationWorker(): void {
  if (workerTimer) return;
  void processInquiryNotificationEvents();
  workerTimer = setInterval(() => {
    void processInquiryNotificationEvents();
  }, WORKER_INTERVAL_MS);
  workerTimer.unref?.();
  console.log("[InquiryNotifications] Persistent delivery worker started");
}
