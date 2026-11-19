import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";

const lookupInput = z.object({
  partNumbers: z.array(z.string().trim().min(1).max(128)).min(1).max(20),
});

/**
 * Read-only product identity lookup for the authenticated administrator.
 * Deliberately returns only the minimum fields needed to prepare guarded SEO drafts.
 */
export const adminProductLookupRouter = router({
  byPartNumbers: adminProcedure
    .input((raw: unknown) => lookupInput.parse(raw))
    .query(async ({ input }) => {
      const partNumbers = Array.from(new Set(input.partNumbers.map((value) => value.trim()).filter(Boolean)));
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select({
          id: products.id,
          partNumber: products.partNumber,
          brand: products.brand,
          status: products.status,
        })
        .from(products)
        .where(inArray(products.partNumber, partNumbers));

      const foundByPartNumber = new Map(rows.map((row) => [row.partNumber, row]));
      return {
        requested: partNumbers,
        found: partNumbers.flatMap((partNumber) => {
          const row = foundByPartNumber.get(partNumber);
          return row ? [row] : [];
        }),
        missing: partNumbers.filter((partNumber) => !foundByPartNumber.has(partNumber)),
      };
    }),
});
