import { and, eq, inArray } from "drizzle-orm";
import { products, seoDraftRuns, seoMetadataDrafts } from "../../drizzle/schema";
import { getDb } from "../db";
import { generateGeminiProductMetadataDraft, queryFinalGscPageQueryRows, type GscQueryRow } from "./clients";
import { validateEditorialDraft } from "./policy";

const CANONICAL_ORIGIN = "https://www.rowellhplc.com";
const ACTIVE_BRANDS = new Set([
  "Agilent", "Thermo Fisher", "Daicel", "Phenomenex", "Waters", "Restek", "Shimadzu",
  "Merck", "ACE", "Avantor", "Develosil", "Tosoh", "YMC",
]);

// The full current experiment register is protected. Only product URLs can reach this worker,
// but declaring all routes here prevents accidental scope expansion in future revisions.
const EXPERIMENT_PROTECTED_PATHS = new Set([
  "/products/00d-4723-e0",
  "/products/0008541",
  "/products/00d-4476-an",
  "/products/186003117",
  "/categories/kinetex-pfp-columns",
  "/categories/c18-columns",
  "/categories/chiral-hplc-columns",
  "/categories/hilic-hplc-columns",
  "/categories/gc-columns",
  "/categories/spe-cartridges",
  "/categories/guard-columns",
  "/categories/c8-hplc-columns",
  "/categories/phenyl-hplc-columns",
  "/categories/kinetex-hplc-columns",
]);

type PipelineConfig = {
  enabled: boolean;
  maxCandidates: number;
  minImpressions: number;
  maxClicks: number;
  gscRowLimit: number;
};

type CandidateMetric = GscQueryRow & { slug: string };

function getIntegerEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`invalid_${name.toLowerCase()}`);
  return value;
}

function getConfig(): PipelineConfig {
  return {
    enabled: process.env.SEO_DRAFT_PIPELINE_ENABLED === "true",
    maxCandidates: getIntegerEnv("SEO_DRAFT_MAX_CANDIDATES", 5, 1, 10),
    minImpressions: getIntegerEnv("SEO_DRAFT_MIN_IMPRESSIONS", 50, 1, 1_000_000),
    maxClicks: getIntegerEnv("SEO_DRAFT_MAX_CLICKS", 0, 0, 100_000),
    gscRowLimit: getIntegerEnv("SEO_DRAFT_GSC_ROW_LIMIT", 5_000, 1, 25_000),
  };
}

function mysqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastFinalWindow(): { startDate: string; endDate: string } {
  // Search Console dates are evaluated in Pacific Time. Holding back the latest three
  // calendar days avoids using incomplete rows while retaining a reproducible 28-day window.
  const end = addUtcDays(new Date(), -3);
  const start = addUtcDays(end, -27);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function canonicalUrlForSlug(slug: string): string {
  return `${CANONICAL_ORIGIN}/products/${encodeURIComponent(slug)}`;
}

function normalizeProductPage(value: string): CandidateMetric["slug"] | null {
  try {
    const url = new URL(value);
    if (url.origin !== CANONICAL_ORIGIN || url.search || url.hash) return null;
    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
    if (EXPERIMENT_PROTECTED_PATHS.has(normalizedPath.toLowerCase())) return null;
    const match = normalizedPath.match(/^\/products\/([A-Za-z0-9-]+)$/);
    if (!match?.[1]) return null;
    return match[1].toLowerCase();
  } catch {
    return null;
  }
}

function boundedErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown";
  const safe = message.replace(/[^a-z0-9_]/gi, "_").toLowerCase().slice(0, 64);
  return safe || "unknown";
}

function toDecimal(value: number, scale: number): string {
  return value.toFixed(scale);
}

export type SeoDraftRunResult = {
  status: "disabled" | "completed" | "blocked" | "failed";
  runId?: number;
  scannedRows: number;
  candidates: number;
  drafts: number;
  rejected: number;
  reason?: string;
};

export async function runSeoMetadataDraftPipeline(): Promise<SeoDraftRunResult> {
  const config = getConfig();
  if (!config.enabled) {
    return { status: "disabled", scannedRows: 0, candidates: 0, drafts: 0, rejected: 0, reason: "pipeline_disabled" };
  }

  const db = await getDb();
  if (!db) throw new Error("database_unavailable");
  const window = lastFinalWindow();
  const created = await db.insert(seoDraftRuns).values({
    status: "running",
    windowStart: window.startDate,
    windowEnd: window.endDate,
    startedAt: mysqlTimestamp(new Date()),
  });
  const runId = Number(created[0].insertId);

  let scannedRows = 0;
  let candidateCount = 0;
  let draftCount = 0;
  let rejectedCount = 0;

  try {
    const gscRows = await queryFinalGscPageQueryRows({
      startDate: window.startDate,
      endDate: window.endDate,
      rowLimit: config.gscRowLimit,
    });
    scannedRows = gscRows.length;

    const bestCandidateBySlug = new Map<string, CandidateMetric>();
    for (const row of gscRows) {
      if (row.impressions < config.minImpressions || row.clicks > config.maxClicks) continue;
      const slug = normalizeProductPage(row.page);
      if (!slug) continue;
      const existing = bestCandidateBySlug.get(slug);
      if (!existing || row.impressions > existing.impressions || (row.impressions === existing.impressions && row.clicks < existing.clicks)) {
        bestCandidateBySlug.set(slug, { ...row, slug });
      }
    }

    const candidateMetrics: CandidateMetric[] = [];
    bestCandidateBySlug.forEach((metric) => candidateMetrics.push(metric));
    const orderedMetrics = candidateMetrics
      .sort((a, b) => b.impressions - a.impressions || a.clicks - b.clicks || a.position - b.position)
      .slice(0, config.maxCandidates);

    if (orderedMetrics.length === 0) {
      await db.update(seoDraftRuns).set({
        status: "completed",
        scannedRowCount: scannedRows,
        candidateCount: 0,
        draftCount: 0,
        rejectedCount: 0,
        completedAt: mysqlTimestamp(new Date()),
      }).where(eq(seoDraftRuns.id, runId));
      return { status: "completed", runId, scannedRows, candidates: 0, drafts: 0, rejected: 0 };
    }

    const candidateSlugs = orderedMetrics.map((metric) => metric.slug);
    const productRows = await db.select({
      id: products.id,
      slug: products.slug,
      status: products.status,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      productType: products.productType,
      category: products.category,
      usp: products.usp,
      phaseType: products.phaseType,
      specifications: products.specifications,
      metaTitle: products.metaTitle,
      metaDescription: products.metaDescription,
    }).from(products).where(and(eq(products.status, "active"), inArray(products.slug, candidateSlugs)));

    const productBySlug = new Map(productRows
      .filter((product) => Boolean(product.slug))
      .map((product) => [product.slug!.toLowerCase(), product]));

    const existingDraftRows = await db.select({ productId: seoMetadataDrafts.productId })
      .from(seoMetadataDrafts)
      .where(inArray(seoMetadataDrafts.productId, productRows.map((product) => product.id)));
    const alreadyQueuedProductIds = new Set(existingDraftRows.map((row) => row.productId));

    for (const metric of orderedMetrics) {
      const product = productBySlug.get(metric.slug);
      if (!product || !product.slug) continue;
      candidateCount += 1;

      const canonicalUrl = canonicalUrlForSlug(product.slug);
      if (alreadyQueuedProductIds.has(product.id)) {
        await db.insert(seoMetadataDrafts).values({
          runId,
          productId: product.id,
          status: "stale",
          canonicalUrl,
          slug: product.slug,
          brand: product.brand,
          partNumber: product.partNumber,
          productType: product.productType,
          sourceQuery: metric.query.slice(0, 512),
          gscClicks: toDecimal(metric.clicks, 3),
          gscImpressions: toDecimal(metric.impressions, 3),
          gscCtr: toDecimal(metric.ctr, 8),
          gscPosition: toDecimal(metric.position, 4),
          currentMetaTitle: product.metaTitle,
          currentMetaDescription: product.metaDescription,
          rejectionCode: "existing_draft_or_publication",
        });
        rejectedCount += 1;
        continue;
      }

      if (!ACTIVE_BRANDS.has(product.brand)) {
        await db.insert(seoMetadataDrafts).values({
          runId,
          productId: product.id,
          status: "blocked",
          canonicalUrl,
          slug: product.slug,
          brand: product.brand,
          partNumber: product.partNumber,
          productType: product.productType,
          sourceQuery: metric.query.slice(0, 512),
          gscClicks: toDecimal(metric.clicks, 3),
          gscImpressions: toDecimal(metric.impressions, 3),
          gscCtr: toDecimal(metric.ctr, 8),
          gscPosition: toDecimal(metric.position, 4),
          currentMetaTitle: product.metaTitle,
          currentMetaDescription: product.metaDescription,
          rejectionCode: "brand_requires_business_decision",
        });
        rejectedCount += 1;
        continue;
      }

      const taskId = `seo-draft-${runId}-${product.id}`;
      try {
        const generated = await generateGeminiProductMetadataDraft({
          taskId,
          canonicalUrl,
          product: {
            id: product.id,
            slug: product.slug,
            partNumber: product.partNumber,
            brand: product.brand,
            name: product.name,
            productType: product.productType,
            category: product.category,
            usp: product.usp,
            phaseType: product.phaseType,
            specifications: product.specifications,
            currentMetaTitle: product.metaTitle,
            currentMetaDescription: product.metaDescription,
          },
          searchPerformance: {
            query: metric.query,
            clicks: metric.clicks,
            impressions: metric.impressions,
            ctr: metric.ctr,
            position: metric.position,
            startDate: window.startDate,
            endDate: window.endDate,
          },
        });

        const validation = validateEditorialDraft(generated, {
          taskId,
          partNumber: product.partNumber,
          brand: product.brand,
        });
        const sameAsCurrent = generated.deliverables.title === product.metaTitle
          && generated.deliverables.meta_description === product.metaDescription;

        if (!validation.ok || sameAsCurrent) {
          const rejectionCode = sameAsCurrent
            ? "no_metadata_change"
            : validation.ok
              ? "unexpected_safe_output"
              : validation.code;
          await db.insert(seoMetadataDrafts).values({
            runId,
            productId: product.id,
            status: "blocked",
            canonicalUrl,
            slug: product.slug,
            brand: product.brand,
            partNumber: product.partNumber,
            productType: product.productType,
            sourceQuery: metric.query.slice(0, 512),
            gscClicks: toDecimal(metric.clicks, 3),
            gscImpressions: toDecimal(metric.impressions, 3),
            gscCtr: toDecimal(metric.ctr, 8),
            gscPosition: toDecimal(metric.position, 4),
            currentMetaTitle: product.metaTitle,
            currentMetaDescription: product.metaDescription,
            evidenceJson: generated.evidence_summary,
            qaJson: generated.qa,
            modelName: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
            rejectionCode,
          });
          rejectedCount += 1;
          continue;
        }

        await db.insert(seoMetadataDrafts).values({
          runId,
          productId: product.id,
          status: "pending_review",
          canonicalUrl,
          slug: product.slug,
          brand: product.brand,
          partNumber: product.partNumber,
          productType: product.productType,
          sourceQuery: metric.query.slice(0, 512),
          gscClicks: toDecimal(metric.clicks, 3),
          gscImpressions: toDecimal(metric.impressions, 3),
          gscCtr: toDecimal(metric.ctr, 8),
          gscPosition: toDecimal(metric.position, 4),
          currentMetaTitle: product.metaTitle,
          currentMetaDescription: product.metaDescription,
          draftMetaTitle: generated.deliverables.title,
          draftMetaDescription: generated.deliverables.meta_description,
          evidenceJson: generated.evidence_summary,
          qaJson: generated.qa,
          modelName: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        });
        draftCount += 1;
      } catch (error) {
        await db.insert(seoMetadataDrafts).values({
          runId,
          productId: product.id,
          status: "blocked",
          canonicalUrl,
          slug: product.slug,
          brand: product.brand,
          partNumber: product.partNumber,
          productType: product.productType,
          sourceQuery: metric.query.slice(0, 512),
          gscClicks: toDecimal(metric.clicks, 3),
          gscImpressions: toDecimal(metric.impressions, 3),
          gscCtr: toDecimal(metric.ctr, 8),
          gscPosition: toDecimal(metric.position, 4),
          currentMetaTitle: product.metaTitle,
          currentMetaDescription: product.metaDescription,
          rejectionCode: boundedErrorCode(error),
        });
        rejectedCount += 1;
      }
    }

    await db.update(seoDraftRuns).set({
      status: "completed",
      scannedRowCount: scannedRows,
      candidateCount,
      draftCount,
      rejectedCount,
      completedAt: mysqlTimestamp(new Date()),
    }).where(eq(seoDraftRuns.id, runId));
    console.log(`[SeoDraftPipeline] completed run=${runId} candidates=${candidateCount} drafts=${draftCount} rejected=${rejectedCount}`);
    return { status: "completed", runId, scannedRows, candidates: candidateCount, drafts: draftCount, rejected: rejectedCount };
  } catch (error) {
    const code = boundedErrorCode(error);
    const status = code.startsWith("missing_") || code.startsWith("invalid_gsc_") ? "blocked" : "failed";
    await db.update(seoDraftRuns).set({
      status,
      scannedRowCount: scannedRows,
      candidateCount,
      draftCount,
      rejectedCount,
      blockedReasonCode: code,
      completedAt: mysqlTimestamp(new Date()),
    }).where(eq(seoDraftRuns.id, runId));
    console.error(`[SeoDraftPipeline] ${status} run=${runId} code=${code}`);
    return { status, runId, scannedRows, candidates: candidateCount, drafts: draftCount, rejected: rejectedCount, reason: code };
  }
}
