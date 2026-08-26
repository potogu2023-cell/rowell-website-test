import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { sendAdminAccessLink } from "../email_notification";

const ADMIN_COOKIE_NAME = "rowell_admin_access";
const ADMIN_LOGIN_AUDIENCE = "rowell-admin-login";
const ADMIN_SESSION_AUDIENCE = "rowell-admin-session";
const LOGIN_LINK_TTL_SECONDS = 15 * 60;
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export type AdminAccessSession = {
  email: string;
};

function normalizedEmail(value: string): string {
  return value.trim().toLowerCase();
}

function configuredAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_LOGIN_EMAILS ?? "")
      .split(",")
      .map(normalizedEmail)
      .filter(Boolean),
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

async function createToken(
  email: string,
  audience: string,
  expiresInSeconds: number,
): Promise<string> {
  const key = getSigningKey();
  if (!key) throw new Error("Administrator access is not configured");

  return new SignJWT({ email: normalizedEmail(email), role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("rowellhplc.com")
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(key);
}

async function verifyToken(
  token: string,
  audience: string,
): Promise<AdminAccessSession | null> {
  const key = getSigningKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: "rowellhplc.com",
      audience,
    });
    const email = typeof payload.email === "string" ? normalizedEmail(payload.email) : "";
    if (payload.role !== "admin" || !email || !isConfiguredAdmin(email)) return null;
    return { email };
  } catch {
    return null;
  }
}

export async function getAdminAccessSession(req: Request): Promise<AdminAccessSession | null> {
  const cookie = parseCookieHeader(req.headers.cookie ?? "")[ADMIN_COOKIE_NAME];
  return cookie ? verifyToken(cookie, ADMIN_SESSION_AUDIENCE) : null;
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
    const email = typeof req.body?.email === "string" ? normalizedEmail(req.body.email) : "";
    // Always return a neutral response to avoid exposing the administrator allowlist.
    const neutralResponse = { accepted: true, message: "If this email is authorized, a sign-in link will be sent." };

    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !isConfiguredAdmin(email)) {
      return res.status(202).json(neutralResponse);
    }

    try {
      const token = await createToken(email, ADMIN_LOGIN_AUDIENCE, LOGIN_LINK_TTL_SECONDS);
      const loginUrl = `${requestOrigin(req)}/api/admin-access/verify?token=${encodeURIComponent(token)}`;
      const delivered = await sendAdminAccessLink({ email, loginUrl });
      if (!delivered.success) {
        console.error("[AdminAccess] Unable to send configured administrator sign-in link", delivered.error);
      }
    } catch (error) {
      console.error("[AdminAccess] Unable to create administrator sign-in link", error);
    }

    return res.status(202).json(neutralResponse);
  });

  app.get("/api/admin-access/verify", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const session = token ? await verifyToken(token, ADMIN_LOGIN_AUDIENCE) : null;
    if (!session) {
      return res.status(403).type("text/plain").send("This administrator sign-in link is invalid or has expired.");
    }

    const sessionToken = await createToken(session.email, ADMIN_SESSION_AUDIENCE, ADMIN_SESSION_TTL_SECONDS);
    setAdminSessionCookie(res, sessionToken);
    return res.redirect(302, "/admin/messages");
  });

  app.post("/api/admin-access/logout", (_req, res) => {
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
