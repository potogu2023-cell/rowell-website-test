import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { getDb } from "../db";
import { apiKeys } from "../../drizzle/schema";

/**
 * Verify API Key from Authorization header
 * Format: "Bearer rowell_xxx..."
 */
export async function verifyAPIKey(authHeader: string | undefined): Promise<{
  keyId: number;
  createdBy: number;
  permissions: string[];
} | null> {
  if (!authHeader) {
    return null;
  }

  // Extract token from "Bearer TOKEN" format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const apiKey = parts[1];

  // API keys must start with "rowell_"
  if (!apiKey.startsWith("rowell_")) {
    return null;
  }

  // Hash the API key to compare with database
  const keyHash = hashAPIKey(apiKey);

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Look up API key in database
  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const key = result[0];

  // Check if key is active
  if (!key.isActive) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "API key is inactive",
    });
  }

  // Check if key has expired
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "API key has expired",
    });
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .execute()
    .catch((err) => console.error("[API Key] Failed to update lastUsedAt:", err));

  // Parse permissions
  const permissions = key.permissions.split(",").map((p) => p.trim());

  return {
    keyId: key.id,
    createdBy: key.createdBy,
    permissions,
  };
}

/**
 * Hash API key using SHA-256
 */
export function hashAPIKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate a new API key
 * Format: rowell_{32_random_hex_chars}
 */
export function generateAPIKey(): string {
  const randomBytes = crypto.randomBytes(16);
  const randomHex = randomBytes.toString("hex");
  return `rowell_${randomHex}`;
}

/**
 * Get key prefix for display (first 8 chars + "...")
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 15) + "...";
}

/**
 * Check if API key has specific permission
 */
export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) || permissions.includes("*");
}
