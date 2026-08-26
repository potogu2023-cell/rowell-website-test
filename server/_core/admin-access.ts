import type { Express, Request, Response } from "express";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { adminAccessLoginTokens } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendAdminAccessLink } from "../email_notification";

const ADMIN_COOKIE_NAME = "rowell_admin_access";
const ADMIN_SESSION_AUDIENCE = "rowell-admin-session";
const LOGIN_LINK_TTL_SECONDS = 15 * 60;
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_PER_EMAIL = 3;
const LOGIN_RATE_LIMIT_PER_IP = 10;
const requestRateBuckets = new Map<string, number[]>();

export type AdminAccessSession = {
  email: string;
};

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function toMysqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_LOGIN_EMAILS ?? "")
      .split(",")
      .map(normalizedEmail)
      .filter(Boolean)
  );
}

function getSigningKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  return secret ? new TextEncoder().encode(secret) : null;
}

function requestOrigin(req: Request): string {
  if (process.env.NODE_ENV === "production") {
    return "https://www.rowellhplc.com";
  }
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || req.protocol || "http";
  return `${protocol}://${req.get("host")}`;
}

function isConfiguredAdmin(email: string): boolean {
  return configuredAdminEmails().has(normalizedEmail(email));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function requestIp(req: Request): string {
  return (
    req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown"
  );
}

function requestAllowed(bucket: string, limit: number, now: number): boolean {
  const kept = (requestRateBuckets.get(bucket) ?? []).filter(
    timestamp => timestamp > now - LOGIN_RATE_LIMIT_WINDOW_MS
  );
  if (kept.length >= limit) {
    requestRateBuckets.set(bucket, kept);
    return false;
  }
  kept.push(now);
  requestRateBuckets.set(bucket, kept);
  return true;
}

function loginRequestAllowed(req: Request, email: string): boolean {
  const now = Date.now();
  const emailAllowed = requestAllowed(
    `email:${sha256(email)}`,
    LOGIN_RATE_LIMIT_PER_EMAIL,
    now
  );
  const ipAllowed = requestAllowed(
    `ip:${sha256(requestIp(req))}`,
    LOGIN_RATE_LIMIT_PER_IP,
    now
  );
  return emailAllowed && ipAllowed;
}

async function createSessionToken(email: string): Promise<string> {
  const key = getSigningKey();
  if (!key) throw new Error("Administrator access is not configured");

  return new SignJWT({ email: normalizedEmail(email), role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("rowellhplc.com")
    .setAudience(ADMIN_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS
    )
    .sign(key);
}

async function verifySessionToken(
  token: string
): Promise<AdminAccessSession | null> {
  const key = getSigningKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: "rowellhplc.com",
      audience: ADMIN_SESSION_AUDIENCE,
    });
    const email =
      typeof payload.email === "string" ? normalizedEmail(payload.email) : "";
    if (payload.role !== "admin" || !email || !isConfiguredAdmin(email))
      return null;
    return { email };
  } catch {
    return null;
  }
}

async function createOneTimeLoginToken(email: string): Promise<string> {
  if (!getSigningKey()) {
    throw new Error("Administrator access is not configured");
  }
  const db = await getDb();
  if (!db) {
    throw new Error("Administrator access database is unavailable");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LOGIN_LINK_TTL_SECONDS * 1000);
  await db.insert(adminAccessLoginTokens).values({
    tokenHash: sha256(token),
    email: normalizedEmail(email),
    expiresAt: toMysqlTimestamp(expiresAt),
  });
  return token;
}

async function consumeOneTimeLoginToken(
  token: string
): Promise<AdminAccessSession | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const result = await db
    .update(adminAccessLoginTokens)
    .set({ usedAt: toMysqlTimestamp(now) })
    .where(
      and(
        eq(adminAccessLoginTokens.tokenHash, sha256(token)),
        isNull(adminAccessLoginTokens.usedAt),
        gt(adminAccessLoginTokens.expiresAt, toMysqlTimestamp(now))
      )
    );
  const affectedRows = Number(result[0]?.affectedRows ?? 0);
  if (affectedRows !== 1) return null;

  const matched = await db
    .select({ email: adminAccessLoginTokens.email })
    .from(adminAccessLoginTokens)
    .where(eq(adminAccessLoginTokens.tokenHash, sha256(token)))
    .limit(1);
  const email = matched[0]?.email ? normalizedEmail(matched[0].email) : "";
  return email && isConfiguredAdmin(email) ? { email } : null;
}

export async function getAdminAccessSession(
  req: Request
): Promise<AdminAccessSession | null> {
  const cookie = parseCookieHeader(req.headers.cookie ?? "")[ADMIN_COOKIE_NAME];
  return cookie ? verifySessionToken(cookie) : null;
}

function setNoStore(res: Response): void {
  res.setHeader(
    "Cache-Control",
    "no-store, private, max-age=0, must-revalidate"
  );
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Referrer-Policy", "no-referrer");
}

function setAdminSessionCookie(res: Response, token: string) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS * 1000,
  });
}

export function registerAdminAccessRoutes(app: Express) {
  app.post("/api/admin-access/request", async (req, res) => {
    setNoStore(res);
    const email =
      typeof req.body?.email === "string"
        ? normalizedEmail(req.body.email)
        : "";
    // Always return a neutral response to avoid exposing the administrator allowlist.
    const neutralResponse = {
      accepted: true,
      message: "If this email is authorized, a sign-in link will be sent.",
    };

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !isConfiguredAdmin(email)) {
      return res.status(202).json(neutralResponse);
    }
    if (!loginRequestAllowed(req, email)) {
      return res.status(202).json(neutralResponse);
    }

    try {
      const token = await createOneTimeLoginToken(email);
      const loginUrl = `${requestOrigin(req)}/api/admin-access/verify?token=${encodeURIComponent(token)}`;
      const delivered = await sendAdminAccessLink({ email, loginUrl });
      if (!delivered.success) {
        console.error(
          "[AdminAccess] Unable to send configured administrator sign-in link"
        );
      }
    } catch {
      // Do not log email addresses, link tokens, or SMTP implementation details.
      console.error("[AdminAccess] Unable to issue administrator sign-in link");
    }

    return res.status(202).json(neutralResponse);
  });

  app.get("/api/admin-access/verify", async (req, res) => {
    setNoStore(res);
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token || !getSigningKey()) {
      return res
        .status(403)
        .type("text/plain")
        .send("This administrator sign-in link is invalid or has expired.");
    }

    const session = await consumeOneTimeLoginToken(token);
    if (!session) {
      return res
        .status(403)
        .type("text/plain")
        .send(
          "This administrator sign-in link is invalid, already used, or has expired."
        );
    }

    const sessionToken = await createSessionToken(session.email);
    setAdminSessionCookie(res, sessionToken);
    return res.redirect(302, "/admin/messages");
  });

  app.post("/api/admin-access/logout", (_req, res) => {
    setNoStore(res);
    res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.status(204).send();
  });
}

export const ADMIN_ACCESS_COOKIE_NAME = ADMIN_COOKIE_NAME;
