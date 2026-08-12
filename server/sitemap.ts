import { Request, Response } from "express";
import { getDb } from "./db";
import { resources, products, articles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

/**
 * Generate sitemap.xml dynamically
 * Includes all static pages and dynamic resource articles
 */

// Base URL - always use production domain
const BASE_URL = "https://www.rowellhplc.com";

// Static pages configuration
const STATIC_PAGES = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/products", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/c18-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/guard-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/gc-columns", priority: 0.9, changefreq: "weekly" },
  { path: "/categories/spe-cartridges", priority: 0.9, changefreq: "weekly" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/resources", priority: 0.9, changefreq: "daily" },
  { path: "/usp-standards", priority: 0.7, changefreq: "monthly" },
  { path: "/applications", priority: 0.7, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "monthly" },
];

/**
 * Format date to W3C datetime format (YYYY-MM-DD)
 */
function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate sitemap XML
 */
export async function generateSitemap(req: Request, res: Response) {
  try {
    const db = await getDb();
    
    if (!db) {
      console.error("[Sitemap] Database not available");
      return res.status(500).send("Database not available");
    }

    // Fetch all published resource articles
    const resourceArticles = await db
      .select({
        slug: resources.slug,
        updatedAt: resources.updatedAt,
      })
      .from(resources)
      .where(eq(resources.status, "published"));

    // Only active products belong in the indexable sitemap.
    const allProducts = await db
      .select({
        slug: products.slug,
        updatedAt: products.updatedAt,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.status, "active"));

    // Fetch all literature articles
    const literatureArticles = await db
      .select({
        slug: articles.slug,
        publishedDate: articles.publishedDate,
      })
      .from(articles)
      .where(eq(articles.category, "literature-reviews"));

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Add static pages
    for (const page of STATIC_PAGES) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}${page.path}</loc>\n`;
      xml += `    <lastmod>${formatDate(new Date())}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    }

    // Add published resource articles.
    for (const article of resourceArticles) {
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(`${BASE_URL}/resources/${encodeURIComponent(article.slug)}`)}</loc>\n`;
      if (article.updatedAt) {
        xml += `    <lastmod>${formatDate(article.updatedAt)}</lastmod>\n`;
      }
      xml += "    <changefreq>monthly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    // Add only active, uniquely addressable product pages. Include product imagery
    // when available so image search can associate it with the product URL.
    for (const product of allProducts) {
      if (!product.slug) continue;
      const productUrl = `${BASE_URL}/products/${encodeURIComponent(product.slug)}`;
      xml += "  <url>\n";
      xml += `    <loc>${escapeXml(productUrl)}</loc>\n`;
      if (product.updatedAt) {
        xml += `    <lastmod>${formatDate(product.updatedAt)}</lastmod>\n`;
      }
      if (product.imageUrl) {
        const imageUrl = product.imageUrl.startsWith("http")
          ? product.imageUrl
          : `${BASE_URL}${product.imageUrl.startsWith("/") ? "" : "/"}${product.imageUrl}`;
        xml += "    <image:image>\n";
        xml += `      <image:loc>${escapeXml(imageUrl)}</image:loc>\n`;
        xml += "    </image:image>\n";
      }
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    // Add literature pages
    for (const article of literatureArticles) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}/learning/literature/${article.slug}</loc>\n`;
      if (article.publishedDate) {
        xml += `    <lastmod>${formatDate(article.publishedDate)}</lastmod>\n`;
      }
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    // Set headers
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    // Send XML
    res.send(xml);

    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length} static pages, ${resourceArticles.length} resources, ${allProducts.length} products, and ${literatureArticles.length} literature articles`);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}
