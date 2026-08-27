import { and, desc, eq } from "drizzle-orm";
import { seoMonitoringRuns, seoMonitoringUrlResults } from "../drizzle/schema";
import { getDb } from "./db";
import { sendSeoTechnicalHealthAlert } from "./email_notification";
import { SEO_MONITORING_CONFIG, type SeoMonitorTarget } from "./seo-monitoring-config";

const REQUEST_TIMEOUT_MS = 20_000;
let workerTimer: NodeJS.Timeout | undefined;
let workerRunning = false;

function toMysqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function normalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

function htmlTextLength(html: string): number {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

function canonicalMatches(html: string, targetUrl: string): boolean {
  const match = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i);
  if (!match?.[1]) return false;
  try {
    return normalizeUrl(new URL(match[1], targetUrl).toString()) === normalizeUrl(targetUrl);
  } catch {
    return false;
  }
}

function isIndexable(headers: Headers, html: string): boolean {
  const headerDirectives = headers.get("x-robots-tag") || "";
  const robotsMatch = html.match(/<meta\b[^>]*(?:name=["']robots["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']robots["'])[^>]*>/i);
  const directives = `${headerDirectives},${robotsMatch?.[1] || robotsMatch?.[2] || ""}`.toLowerCase();
  return !/(^|[,\s])(noindex|none)([,\s]|$)/.test(directives);
}

function hasExpectedSchema(html: string, expectedType: SeoMonitorTarget["expectedSchema"]): boolean {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  return scripts.some((script) => {
    const jsonText = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const value = JSON.parse(jsonText);
      const candidates = Array.isArray(value)
        ? value
        : Array.isArray(value?.["@graph"])
          ? value["@graph"]
          : [value];
      return candidates.some((candidate) => {
        const type = candidate?.["@type"];
        return Array.isArray(type) ? type.includes(expectedType) : type === expectedType;
      });
    } catch {
      return false;
    }
  });
}

function firstProductImage(html: string): string | undefined {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const jsonText = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const value = JSON.parse(jsonText);
      const candidates = Array.isArray(value)
        ? value
        : Array.isArray(value?.["@graph"])
          ? value["@graph"]
          : [value];
      const product = candidates.find((candidate) => {
        const type = candidate?.["@type"];
        return Array.isArray(type) ? type.includes("Product") : type === "Product";
      });
      const image = product?.image;
      if (typeof image === "string") return image;
      if (Array.isArray(image) && typeof image[0] === "string") return image[0];
    } catch {
      // An invalid JSON-LD block is captured by the structured-data health check.
    }
  }
  return undefined;
}

async function imageIsAccessible(imageUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: { Range: "bytes=0-0", "User-Agent": "ROWELL-SEO-technical-monitor/1.0" },
      signal: controller.signal,
    });
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function inspectTarget(target: SeoMonitorTarget) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(target.url, {
      headers: { "User-Agent": "ROWELL-SEO-technical-monitor/1.0", Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: controller.signal,
    });
    const html = await response.text();
    const httpStatus = response.status;
    const canonicalValid = httpStatus >= 200 && httpStatus < 300 && canonicalMatches(html, target.url);
    const robotsIndexable = httpStatus >= 200 && httpStatus < 300 && isIndexable(response.headers, html);
    const ssrContentPresent = httpStatus >= 200 && httpStatus < 300 && htmlTextLength(html) >= 300;
    const structuredDataValid = httpStatus >= 200 && httpStatus < 300 && hasExpectedSchema(html, target.expectedSchema);
    const sourceImage = target.requiresImage ? firstProductImage(html) : undefined;
    const imageAccessible = target.requiresImage
      ? sourceImage
        ? await imageIsAccessible(sourceImage)
        : false
      : null;
    const failureCode = httpStatus < 200 || httpStatus >= 300
      ? "http_status"
      : !canonicalValid
        ? "canonical"
        : !robotsIndexable
          ? "robots"
          : !ssrContentPresent
            ? "ssr_content"
            : !structuredDataValid
              ? "structured_data"
              : target.requiresImage && !imageAccessible
                ? "image"
                : null;
    return { httpStatus, canonicalValid, robotsIndexable, ssrContentPresent, structuredDataValid, imageAccessible, failureCode };
  } catch {
    return {
      httpStatus: null,
      canonicalValid: false,
      robotsIndexable: false,
      ssrContentPresent: false,
      structuredDataValid: false,
      imageAccessible: target.requiresImage ? false : null,
      failureCode: "request_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function isRunDue(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const latestRuns = await db
    .select({ completedAt: seoMonitoringRuns.completedAt })
    .from(seoMonitoringRuns)
    .where(eq(seoMonitoringRuns.status, "completed"))
    .orderBy(desc(seoMonitoringRuns.completedAt))
    .limit(1);
  const completedAt = latestRuns[0]?.completedAt;
  if (!completedAt) return true;
  const dueAfter = new Date(completedAt.replace(" ", "T") + "Z").getTime() + SEO_MONITORING_CONFIG.intervalHours * 60 * 60 * 1000;
  return Date.now() >= dueAfter;
}

async function hasConsecutiveFailure(targetKey: string, currentFailed: boolean): Promise<boolean> {
  if (!currentFailed) return false;
  const db = await getDb();
  if (!db) return false;
  const previous = await db
    .select({ failureCode: seoMonitoringUrlResults.failureCode })
    .from(seoMonitoringUrlResults)
    .where(eq(seoMonitoringUrlResults.targetKey, targetKey))
    .orderBy(desc(seoMonitoringUrlResults.createdAt))
    .limit(SEO_MONITORING_CONFIG.consecutiveFailureThreshold - 1);
  return previous.length === SEO_MONITORING_CONFIG.consecutiveFailureThreshold - 1
    && previous.every((row) => Boolean(row.failureCode));
}

export async function runSeoTechnicalHealthCheck(): Promise<void> {
  if (!SEO_MONITORING_CONFIG.enabled || workerRunning || !(await isRunDue())) return;
  workerRunning = true;
  let runId: number | undefined;
  try {
    const db = await getDb();
    if (!db) return;
    const now = new Date();
    const created = await db.insert(seoMonitoringRuns).values({
      status: "running",
      targetCount: SEO_MONITORING_CONFIG.targets.length,
      startedAt: toMysqlTimestamp(now),
    });
    runId = Number(created[0].insertId);

    let healthyCount = 0;
    const alertCodes: string[] = [];
    for (const target of SEO_MONITORING_CONFIG.targets) {
      const result = await inspectTarget(target);
      const needsAlert = await hasConsecutiveFailure(target.key, Boolean(result.failureCode));
      if (!result.failureCode) healthyCount += 1;
      if (needsAlert && result.failureCode) alertCodes.push(`${target.key}:${result.failureCode}`);
      await db.insert(seoMonitoringUrlResults).values({
        runId,
        targetKey: target.key,
        url: target.url,
        httpStatus: result.httpStatus,
        canonicalValid: result.canonicalValid ? 1 : 0,
        robotsIndexable: result.robotsIndexable ? 1 : 0,
        ssrContentPresent: result.ssrContentPresent ? 1 : 0,
        structuredDataValid: result.structuredDataValid ? 1 : 0,
        imageAccessible: result.imageAccessible === null ? null : result.imageAccessible ? 1 : 0,
        failureCode: result.failureCode,
      });
    }

    let alertSent = false;
    if (alertCodes.length > 0) {
      alertSent = (await sendSeoTechnicalHealthAlert({
        failedTargetCodes: alertCodes,
        targetCount: SEO_MONITORING_CONFIG.targets.length,
        healthyCount,
      })).success;
    }
    await db
      .update(seoMonitoringRuns)
      .set({
        status: "completed",
        healthyCount,
        unhealthyCount: SEO_MONITORING_CONFIG.targets.length - healthyCount,
        alertSent: alertSent ? 1 : 0,
        completedAt: toMysqlTimestamp(new Date()),
      })
      .where(eq(seoMonitoringRuns.id, runId));
    console.log("[SeoMonitoring] Public technical health check completed");
  } catch {
    if (runId) {
      const db = await getDb();
      await db?.update(seoMonitoringRuns).set({ status: "failed", completedAt: toMysqlTimestamp(new Date()) }).where(eq(seoMonitoringRuns.id, runId));
    }
    console.error("[SeoMonitoring] Public technical health check failed");
  } finally {
    workerRunning = false;
  }
}

/** Starts a low-frequency, persisted public technical health monitor. */
export function startSeoTechnicalMonitoringWorker(): void {
  if (workerTimer || !SEO_MONITORING_CONFIG.enabled) return;
  void runSeoTechnicalHealthCheck();
  workerTimer = setInterval(() => {
    void runSeoTechnicalHealthCheck();
  }, 60 * 60 * 1000);
  workerTimer.unref?.();
  console.log("[SeoMonitoring] Public technical monitoring worker started");
}
