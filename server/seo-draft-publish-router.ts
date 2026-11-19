import { adminProcedure, router } from "./_core/trpc";
import { z } from "zod";

const experimentPartNumbers = new Set([
  "00D-4723-E0",
  "0008541",
  "00D-4476-AN",
  "186003117",
]);
const experimentSlugs = new Set([
  "kinetex-pfp-columns",
  "c18-columns",
  "chiral-hplc-columns",
  "hilic-hplc-columns",
  "gc-columns",
  "spe-cartridges",
  "guard-columns",
  "c8-hplc-columns",
  "phenyl-hplc-columns",
  "kinetex-hplc-columns",
]);

const itemSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(128),
  brand: z.string().min(1).max(64),
  partNumber: z.string().min(1).max(128),
  sourceQuery: z.string().min(1).max(512),
  impressions: z.number().nonnegative(),
  clicks: z.number().nonnegative(),
  ctr: z.number().nonnegative(),
  position: z.number().nonnegative(),
  currentMetaTitle: z.string().max(70).nullable(),
  currentMetaDescription: z.string().max(160).nullable(),
  draftMetaTitle: z.string().min(1).max(70),
  draftMetaDescription: z.string().min(1).max(160),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
const batchSchema = z.object({
  batchId: z.string().min(1).max(120),
  items: z.array(itemSchema).min(1).max(10),
});

function assertSafeItem(item: z.infer<typeof itemSchema>) {
  if (experimentPartNumbers.has(item.partNumber.toUpperCase()) || experimentSlugs.has(item.slug)) {
    throw new Error(`SEO experiment exclusion: ${item.partNumber}`);
  }
  const combined = `${item.draftMetaTitle}\n${item.draftMetaDescription}`;
  if (/\b(price|in stock|availability|available|ships|shipping|delivery|authorized|official distributor|equivalent|replacement|compatible|cross-reference|offer)\b/i.test(combined)) {
    throw new Error(`Commercial or equivalence claim rejected: ${item.partNumber}`);
  }
}

export const seoDraftPublishRouter = router({
  registerManualBatch: adminProcedure
    .input(batchSchema)
    .mutation(async ({ input }) => {
      input.items.forEach(assertSafeItem);
      const ids = input.items.map((item) => item.id);
      if (new Set(ids).size !== ids.length) throw new Error("Duplicate product id");

      const { getPool } = await import("./db");
      const pool = await getPool();
      if (!pool) throw new Error("Database pool not available");
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const [runResult] = await connection.execute(
          `INSERT INTO seo_draft_runs
            (status, window_start, window_end, scanned_row_count, candidate_count, draft_count, rejected_count, blocked_reason_code, started_at, completed_at)
           VALUES ('completed', NULL, NULL, ?, ?, ?, 0, NULL, NOW(), NOW())`,
          [input.items.length, input.items.length, input.items.length],
        ) as any;
        const runId = Number(runResult.insertId);
        const draftIds: number[] = [];

        for (const item of input.items) {
          const [rows] = await connection.execute(
            `SELECT id, slug, brand, partNumber, status, metaTitle, metaDescription
             FROM products WHERE id = ? LIMIT 1`,
            [item.id],
          ) as any;
          const product = rows[0];
          if (!product || product.id !== item.id || product.slug !== item.slug || product.brand !== item.brand ||
              product.partNumber !== item.partNumber || product.status !== "active" ||
              product.metaTitle !== item.currentMetaTitle || product.metaDescription !== item.currentMetaDescription) {
            throw new Error(`Product precondition mismatch: ${item.partNumber}`);
          }
          const [existing] = await connection.execute(
            `SELECT id FROM seo_metadata_drafts
             WHERE product_id = ? AND status IN ('pending_review','approved')
             ORDER BY id DESC LIMIT 1`,
            [item.id],
          ) as any;
          if (existing[0]) throw new Error(`Existing pending SEO draft: ${item.partNumber}`);
          const canonicalUrl = `https://www.rowellhplc.com/products/${item.slug}`;
          const [draftResult] = await connection.execute(
            `INSERT INTO seo_metadata_drafts
              (run_id, product_id, status, canonical_url, slug, brand, part_number, product_type,
               source_query, gsc_clicks, gsc_impressions, gsc_ctr, gsc_position,
               current_meta_title, current_meta_description, draft_meta_title, draft_meta_description,
               evidence_json, qa_json, model_name)
             SELECT ?, id, 'pending_review', ?, slug, brand, partNumber, productType,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual-reviewed-gsc-draft'
             FROM products WHERE id = ?`,
            [runId, canonicalUrl, item.sourceQuery, item.clicks, item.impressions, item.ctr, item.position,
             item.currentMetaTitle, item.currentMetaDescription, item.draftMetaTitle, item.draftMetaDescription,
             JSON.stringify(item.evidence ?? {}), JSON.stringify({ manualApproved: true, onlyMetaFields: true }), item.id],
          ) as any;
          draftIds.push(Number(draftResult.insertId));
        }
        await connection.commit();
        return { success: true, runId, draftIds, status: "pending_review" as const };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }),

  publishApprovedBatch: adminProcedure
    .input(z.object({
      draftIds: z.array(z.number().int().positive()).min(1).max(10),
      items: z.array(itemSchema).min(1).max(10),
    }))
    .mutation(async ({ input }) => {
      if (input.draftIds.length !== input.items.length) throw new Error("Draft/item count mismatch");
      input.items.forEach(assertSafeItem);
      const { getPool } = await import("./db");
      const pool = await getPool();
      if (!pool) throw new Error("Database pool not available");
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const published: Array<{ id: number; partNumber: string }> = [];
        for (let i = 0; i < input.items.length; i += 1) {
          const item = input.items[i];
          const draftId = input.draftIds[i];
          const [rows] = await connection.execute(
            `SELECT d.id AS draftId, d.status AS draftStatus, d.product_id AS productId,
                    d.slug, d.brand, d.part_number AS partNumber,
                    d.current_meta_title AS currentMetaTitle, d.current_meta_description AS currentMetaDescription,
                    d.draft_meta_title AS draftMetaTitle, d.draft_meta_description AS draftMetaDescription,
                    p.status AS productStatus, p.metaTitle, p.metaDescription
             FROM seo_metadata_drafts d JOIN products p ON p.id = d.product_id
             WHERE d.id = ? FOR UPDATE`,
            [draftId],
          ) as any;
          const row = rows[0];
          if (!row || row.draftStatus !== "pending_review" || row.productId !== item.id ||
              row.slug !== item.slug || row.brand !== item.brand || row.partNumber !== item.partNumber ||
              row.productStatus !== "active" || row.currentMetaTitle !== item.currentMetaTitle ||
              row.currentMetaDescription !== item.currentMetaDescription || row.metaTitle !== item.currentMetaTitle ||
              row.metaDescription !== item.currentMetaDescription || row.draftMetaTitle !== item.draftMetaTitle ||
              row.draftMetaDescription !== item.draftMetaDescription) {
            throw new Error(`SEO draft/product precondition mismatch: ${item.partNumber}`);
          }
          await connection.execute(
            `UPDATE products SET metaTitle = ?, metaDescription = ?, updatedAt = NOW() WHERE id = ?`,
            [item.draftMetaTitle, item.draftMetaDescription, item.id],
          );
          await connection.execute(
            `UPDATE seo_metadata_drafts SET status = 'published', reviewed_at = NOW(), published_at = NOW(), updated_at = NOW() WHERE id = ?`,
            [draftId],
          );
          published.push({ id: item.id, partNumber: item.partNumber });
        }
        await connection.commit();
        return { success: true, published, updatedFields: ["metaTitle", "metaDescription"] as const };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }),
});
