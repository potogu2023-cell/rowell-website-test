import { Request, Response } from "express";
import { getDb, getPool } from "./db";
import { products } from "../drizzle/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export const BASE_URL = "https://www.rowellhplc.com";
export const STANDARD_VOLUME_SIZE = 5000;
export const STANDARDS_SITEMAP_TARGET = 17303;
const XMLNS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const IMAGE_XMLNS = "http://www.google.com/schemas/sitemap-image/1.1";

export type SitemapPage = {
  path: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly";
};

export const STATIC_PAGES: SitemapPage[] = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/products", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/c18-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/guard-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/gc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/kinetex-pfp-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/chiral-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/hilic-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/c8-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/phenyl-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/kinetex-hplc-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/agilent-poroshell-columns", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/spe-cartridges", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/vials", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/caps-septa", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/chromatography-syringes", priority: 0.8, changefreq: "weekly" },
  { path: "/categories/hplc-fittings-tubing", priority: 0.8, changefreq: "weekly" },
  { path: "/about", priority: 0.8, changefreq: "weekly" },
  { path: "/resources", priority: 0.8, changefreq: "weekly" },
  { path: "/usp-standards", priority: 0.8, changefreq: "weekly" },
  { path: "/usp/l1", priority: 0.8, changefreq: "weekly" },
  { path: "/usp/l7", priority: 0.8, changefreq: "weekly" },
  { path: "/usp/l11", priority: 0.8, changefreq: "weekly" },
  { path: "/usp/l43", priority: 0.8, changefreq: "weekly" },
  { path: "/usp/l60", priority: 0.8, changefreq: "weekly" },
  { path: "/applications", priority: 0.8, changefreq: "weekly" },
  { path: "/contact", priority: 0.8, changefreq: "weekly" },
];

const VOLUMES = [
  { path: "/sitemaps/columns.xml", kind: "columns" as const },
  { path: "/sitemaps/standards-1.xml", kind: "standards" as const, volume: 1 },
  { path: "/sitemaps/standards-2.xml", kind: "standards" as const, volume: 2 },
  { path: "/sitemaps/standards-3.xml", kind: "standards" as const, volume: 3 },
  { path: "/sitemaps/standards-4.xml", kind: "standards" as const, volume: 4 },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function isoDate(value: unknown, fallback: Date): string {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : fallback;
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
}

function urlEntry(
  loc: string,
  lastmod: string,
  options: { image?: string } = {},
): string {
  const image = options.image
    ? `\n    <image:image>\n      <image:loc>${xmlEscape(options.image)}</image:loc>\n    </image:image>`
    : "";
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${xmlEscape(lastmod)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>${image}\n  </url>\n`;
}

export function renderUrlset(entries: string[], withImages = false): string {
  const namespace = withImages ? ` xmlns:image="${IMAGE_XMLNS}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${XMLNS}"${namespace}>\n${entries.join("")}</urlset>\n`;
}

export function renderSitemapIndex(lastmod: string): string {
  const entries = VOLUMES.map((volume) =>
    `  <sitemap>\n    <loc>${BASE_URL}${volume.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>\n`,
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${XMLNS}">\n${entries}</sitemapindex>\n`;
}

function sendXml(res: Response, xml: string): void {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=300");
  res.send(xml);
}

function normalizedImageUrl(imageUrl: string | null): string | undefined {
  if (!imageUrl) return undefined;
  return imageUrl.startsWith("http")
    ? imageUrl
    : `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

async function getActiveStandardCount(pool: any): Promise<number> {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM standards_products WHERE status = 'active' AND slug IS NOT NULL AND slug <> ''",
  );
  return Number(rows[0]?.total || 0);
}

async function getStandardVolume(pool: any, offset: number): Promise<Array<{ slug: string }>> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const [rows] = await pool.query(
    `SELECT slug FROM standards_products
     WHERE status = 'active' AND slug IS NOT NULL AND slug <> ''
     ORDER BY id ASC, slug ASC
     LIMIT ${STANDARD_VOLUME_SIZE} OFFSET ${safeOffset}`,
  );
  return rows as Array<{ slug: string }>;
}

export async function generateSitemapIndex(_req: Request, res: Response): Promise<void> {
  sendXml(res, renderSitemapIndex(new Date().toISOString()));
}

export async function generateColumnsSitemap(_req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return void res.status(500).send("Database not available");
    const generatedAt = new Date();
    const lastmod = generatedAt.toISOString();
    const entries = STATIC_PAGES.map((page) => urlEntry(`${BASE_URL}${page.path}`, lastmod));

    const activeProducts = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt, imageUrl: products.imageUrl })
      .from(products)
      .where(and(eq(products.status, "active"), isNotNull(products.slug)));
    for (const product of activeProducts) {
      if (!product.slug) continue;
      entries.push(urlEntry(
        `${BASE_URL}/products/${encodeURIComponent(product.slug)}`,
        isoDate(product.updatedAt, generatedAt),
        { image: normalizedImageUrl(product.imageUrl) },
      ));
    }

    sendXml(res, renderUrlset(entries, true));
    console.log(`[Sitemap] columns volume generated entries=${entries.length} activeProducts=${activeProducts.length}`);
  } catch (error) {
    console.error("[Sitemap] columns volume failed:", error);
    res.status(500).send("Error generating columns sitemap");
  }
}

export async function generateStandardsSitemap(req: Request, res: Response): Promise<void> {
  try {
    const volume = Number(req.params.volume);
    if (!Number.isInteger(volume) || volume < 1 || volume > 4) return void res.status(404).send("Not found");
    const pool = await getPool();
    if (!pool) return void res.status(500).send("Database not available");
    const generatedAt = new Date();
    const total = await getActiveStandardCount(pool);
    const offset = (volume - 1) * STANDARD_VOLUME_SIZE;
    const rows = await getStandardVolume(pool, offset);
    const entries = rows.map((row) => urlEntry(
      `${BASE_URL}/standards/product/${encodeURIComponent(row.slug)}`,
      generatedAt.toISOString(),
    ));
    sendXml(res, renderUrlset(entries));
    console.log(`[Sitemap] standards volume generated volume=${volume} offset=${offset} entries=${entries.length} activeTotal=${total}`);
  } catch (error) {
    console.error("[Sitemap] standards volume failed:", error);
    res.status(500).send("Error generating standards sitemap");
  }
}

// Backwards-compatible alias: existing crawlers using /sitemap.xml receive the index.
export const generateSitemap = generateSitemapIndex;

export const sitemapVolumePaths = VOLUMES.map((volume) => volume.path);
