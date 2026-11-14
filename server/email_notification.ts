import nodemailer, { type SentMessageInfo, type Transporter } from "nodemailer";

interface AdminEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

// Administrator access emails and inquiry operations notifications use one
// explicitly configured sender. Marketing email functionality is intentionally
// not part of this service.
const PRIMARY_INQUIRY_RECIPIENT =
  process.env.INQUIRY_NOTIFICATION_PRIMARY?.trim() || "oscar@rowellhplc.com";
const BACKUP_INQUIRY_RECIPIENT =
  process.env.INQUIRY_NOTIFICATION_BACKUP?.trim() || "sofia@rowellhplc.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getAdminEmailConfig(): AdminEmailConfig | null {
  const host = process.env.ADMIN_SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.ADMIN_SMTP_PORT || "", 10);
  const user = process.env.ADMIN_SMTP_USER?.trim();
  const pass = process.env.ADMIN_SMTP_PASS;
  const from = process.env.ADMIN_SMTP_FROM?.trim() || user;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !pass || !from) {
    console.error(
      "[Email] Administrator SMTP is not configured; required keys are ADMIN_SMTP_HOST, ADMIN_SMTP_PORT, ADMIN_SMTP_USER, ADMIN_SMTP_PASS, and ADMIN_SMTP_FROM/ADMIN_SMTP_USER",
    );
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    user,
    pass,
    from,
  };
}

function createAdminTransporter(): { transporter: Transporter; config: AdminEmailConfig } | null {
  const config = getAdminEmailConfig();
  if (!config) return null;

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      tls: { minVersion: "TLSv1.2" },
    });
    return { transporter, config };
  } catch {
    console.error("[Email] Failed to create administrator SMTP transporter");
    return null;
  }
}

function adminSenderAddress(config: AdminEmailConfig): string {
  return `"ROWELL Website" <${config.from}>`;
}

function expectedOperationsRecipients(): string[] {
  return Array.from(
    new Set([PRIMARY_INQUIRY_RECIPIENT, BACKUP_INQUIRY_RECIPIENT].filter(Boolean)),
  );
}

function acceptedAllRecipients(
  info: SentMessageInfo,
  recipients: string[],
): boolean {
  const accepted = new Set(
    (info.accepted || []).map((value: unknown) => String(value).toLowerCase()),
  );
  return recipients.every((recipient) => accepted.has(recipient.toLowerCase()));
}

/** Sends a short-lived administrator sign-in link only to a configured allowlisted address. */
export async function sendAdminAccessLink(data: {
  email: string;
  loginUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailer = createAdminTransporter();
  if (!mailer) {
    return { success: false, error: "Administrator email service is not configured" };
  }

  const safeUrl = escapeHtml(data.loginUrl);
  try {
    const info = await mailer.transporter.sendMail({
      from: adminSenderAddress(mailer.config),
      to: data.email,
      subject: "ROWELL administrator sign-in link",
      text: `Use this one-time link to sign in to the ROWELL inquiry dashboard. It expires in 15 minutes: ${data.loginUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2>ROWELL administrator access</h2>
          <p>Use the following one-time link to access the protected inquiry dashboard. The link expires in 15 minutes.</p>
          <p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:4px">Open inquiry dashboard</a></p>
          <p style="color:#6b7280;font-size:12px">If you did not request this link, you can safely ignore this email.</p>
        </div>`,
    });
    return { success: true, messageId: info.messageId };
  } catch {
    console.error("[Email] Failed to send administrator access link");
    return { success: false, error: "Email delivery failed" };
  }
}

export async function sendCustomerMessageNotification(data: {
  type: "inquiry" | "message" | "quote_request";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  productId?: string;
  productName?: string;
  productPartNumber?: string;
}) {
  // Inquiry notifications are operational emails. They are independent from
  // any outbound marketing system and are queued outside the customer request.
  const mailer = createAdminTransporter();
  if (!mailer) {
    console.error("[Email] Inquiry notification is not configured");
    return { success: false, error: "Email service is not configured" };
  }

  const typeLabels = {
    inquiry: "Product Inquiry",
    message: "Customer Message",
    quote_request: "Quote Request",
  };
  const typeLabel = typeLabels[data.type] || "Customer Message";
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = data.phone ? escapeHtml(data.phone) : "";
  const safeCompany = data.company ? escapeHtml(data.company) : "";
  const safeMessage = escapeHtml(data.message);
  const safeProductId = data.productId ? escapeHtml(data.productId) : "";
  const safeProductName = data.productName ? escapeHtml(data.productName) : "";
  const safePartNumber = data.productPartNumber ? escapeHtml(data.productPartNumber) : "";

  const subject = `[ROWELL Website] New ${typeLabel} – ${data.name}`;
  const productBlock = data.productId || data.productName || data.productPartNumber
    ? `
      <div style="background:#eff6ff;padding:15px;border-radius:5px;margin:20px 0;border-left:4px solid #2563eb">
        <h3 style="margin-top:0;color:#1e40af">Product</h3>
        ${data.productId ? `<p><strong>ID:</strong> ${safeProductId}</p>` : ""}
        ${data.productPartNumber ? `<p><strong>Part number:</strong> ${safePartNumber}</p>` : ""}
        ${data.productName ? `<p><strong>Name:</strong> ${safeProductName}</p>` : ""}
      </div>`
    : "";

  try {
    const recipients = expectedOperationsRecipients();
    const info = await mailer.transporter.sendMail({
      from: adminSenderAddress(mailer.config),
      to: PRIMARY_INQUIRY_RECIPIENT,
      cc:
        BACKUP_INQUIRY_RECIPIENT && BACKUP_INQUIRY_RECIPIENT !== PRIMARY_INQUIRY_RECIPIENT
          ? BACKUP_INQUIRY_RECIPIENT
          : undefined,
      replyTo: { name: data.name, address: data.email },
      subject,
      text: `New ${typeLabel}\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || ""}\nPhone: ${data.phone || ""}\nProduct: ${data.productPartNumber || data.productName || data.productId || ""}\nMessage: ${data.message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb">New ${typeLabel}</h2>
          <div style="background:#f3f4f6;padding:15px;border-radius:5px;margin:20px 0">
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            ${data.phone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ""}
            ${data.company ? `<p><strong>Company:</strong> ${safeCompany}</p>` : ""}
          </div>
          ${productBlock}
          <div style="background:#fff;padding:15px;border:1px solid #e5e7eb;border-radius:5px;margin:20px 0">
            <h3 style="margin-top:0">Customer request</h3>
            <p style="white-space:pre-wrap;line-height:1.6">${safeMessage}</p>
          </div>
          <p style="color:#6b7280;font-size:12px">This notification is sent by the ROWELL website. Reply using the customer email address above.</p>
        </div>`,
    });

    if (!acceptedAllRecipients(info, recipients)) {
      console.error("[Email] Inquiry notification was not accepted for every configured operations recipient");
      return { success: false, error: "Email delivery was rejected for one or more operations recipients" };
    }

    console.log("[Email] Inquiry notification accepted by SMTP for all configured operations recipients");
    return { success: true, messageId: info.messageId };
  } catch {
    console.error("[Email] Failed to send inquiry notification");
    return { success: false, error: "Email delivery failed" };
  }
}

/** Sends operational counts only; customer contact details and message content are never included. */
export async function sendInquiryOperationsSummary(data: {
  kind: "daily_summary" | "sla24" | "sla48";
  newCount?: number;
  overdueCount?: number;
}): Promise<{ success: boolean; error?: string }> {
  const mailer = createAdminTransporter();
  if (!mailer) {
    console.error("[Email] Inquiry operations notification is not configured");
    return { success: false, error: "Email service is not configured" };
  }

  const labels = {
    daily_summary: "Daily inquiry summary",
    sla24: "24-hour inquiry SLA alert",
    sla48: "48-hour inquiry SLA escalation",
  } as const;
  const label = labels[data.kind];
  const countLine = data.kind === "daily_summary"
    ? `New inquiries today: ${data.newCount || 0}`
    : `Open inquiries beyond the SLA threshold: ${data.overdueCount || 0}`;

  try {
    const recipients = expectedOperationsRecipients();
    const info = await mailer.transporter.sendMail({
      from: adminSenderAddress(mailer.config),
      to: PRIMARY_INQUIRY_RECIPIENT,
      cc:
        BACKUP_INQUIRY_RECIPIENT && BACKUP_INQUIRY_RECIPIENT !== PRIMARY_INQUIRY_RECIPIENT
          ? BACKUP_INQUIRY_RECIPIENT
          : undefined,
      subject: `[ROWELL Website] ${label}`,
      text: `${label}\n${countLine}\n\nOpen the protected administrator dashboard to review customer details. This operations alert intentionally contains no customer contact details or message content.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e40af">${label}</h2>
          <p><strong>${escapeHtml(countLine)}</strong></p>
          <p>This operations alert intentionally contains no customer contact details or message content.</p>
          <p><a href="https://www.rowellhplc.com/admin/messages" style="display:inline-block;padding:10px 14px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:4px">Open protected dashboard</a></p>
        </div>`,
    });

    if (!acceptedAllRecipients(info, recipients)) {
      console.error("[Email] Inquiry operations notification was not accepted for every configured operations recipient");
      return { success: false, error: "Email delivery was rejected for one or more operations recipients" };
    }

    console.log("[Email] Inquiry operations notification accepted by SMTP for all configured operations recipients");
    return { success: true };
  } catch {
    console.error("[Email] Failed to send inquiry operations notification");
    return { success: false, error: "Email delivery failed" };
  }
}

/** Sends a technical availability alert without customer data, URLs, credentials, or search metrics. */
export async function sendSeoTechnicalHealthAlert(data: {
  failedTargetCodes: string[];
  targetCount: number;
  healthyCount: number;
}): Promise<{ success: boolean; error?: string }> {
  const mailer = createAdminTransporter();
  if (!mailer) {
    console.error("[Email] SEO technical monitoring notification is not configured");
    return { success: false, error: "Email service is not configured" };
  }

  const safeCodes = data.failedTargetCodes.map(escapeHtml).join(", ");
  const subject = "[ROWELL Website] SEO technical health alert";
  try {
    const recipients = expectedOperationsRecipients();
    const info = await mailer.transporter.sendMail({
      from: adminSenderAddress(mailer.config),
      to: PRIMARY_INQUIRY_RECIPIENT,
      cc:
        BACKUP_INQUIRY_RECIPIENT && BACKUP_INQUIRY_RECIPIENT !== PRIMARY_INQUIRY_RECIPIENT
          ? BACKUP_INQUIRY_RECIPIENT
          : undefined,
      subject,
      text: `A monitored public SEO technical check has failed in consecutive runs. Healthy targets: ${data.healthyCount}/${data.targetCount}. Affected check codes: ${data.failedTargetCodes.join(", ")}. Open the internal SEO monitoring report for the exact public URLs and diagnostic context. This alert contains no customer data, credentials, or search-performance metrics.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#b91c1c">SEO technical health alert</h2>
          <p>A monitored public technical check has failed in consecutive runs.</p>
          <p><strong>Healthy targets:</strong> ${data.healthyCount}/${data.targetCount}</p>
          <p><strong>Affected check codes:</strong> ${safeCodes}</p>
          <p style="color:#6b7280;font-size:12px">This alert contains no customer data, credentials, page content, or search-performance metrics. Review the internal SEO monitoring report before making any change.</p>
        </div>`,
    });

    if (!acceptedAllRecipients(info, recipients)) {
      console.error("[Email] SEO technical monitoring notification was not accepted for every configured operations recipient");
      return { success: false, error: "Email delivery was rejected for one or more operations recipients" };
    }

    console.log("[Email] SEO technical monitoring notification accepted by SMTP for all configured operations recipients");
    return { success: true };
  } catch {
    console.error("[Email] Failed to send SEO technical monitoring notification");
    return { success: false, error: "Email delivery failed" };
  }
}
