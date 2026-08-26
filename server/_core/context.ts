import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAdminAccessSession, type AdminAccessSession } from "./admin-access";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminSession: AdminAccessSession | null;
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // OAuth authentication is optional for public procedures.
    user = null;
  }

  const adminSession = await getAdminAccessSession(opts.req);

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminSession,
  };
}
