import { Request, Response } from "express";
import { getDb } from "./db";
import { resources } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

/**
 * Generate sitemap.xml dynamically
 * Includes all static pages and dynamic resource articles
 */

// Base URL from environment or default
const BASE_URL = ENV.viteAppTitle?.includes("ROWELL")
  ? "https://www.rowellhplc.com"
  : "https://rowell-website-test.manus.space";

// Static pages configuration
const STATIC_PAGES = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/products", priority: 0.9, changefreq: "weekly" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/resources", priority: 0.9, changefreq: "daily" },
  { path: "/usp-standards", priority: 0.7, changefreq: "monthly" },
  { path: "/applications", priority: 0.7, changefreq: "monthly" },
  { path: "/contact", priority: 0.6, changefreq: "monthly" },
];

/**
 * Format date to W3C datetime format (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
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

    // Fetch all published articles
    const articles = await db
      .select({
        slug: resources.slug,
        updatedAt: resources.updatedAt,
      })
      .from(resources)
      .where(eq(resources.status, "published"));

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    for (const page of STATIC_PAGES) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}${page.path}</loc>\n`;
      xml += `    <lastmod>${formatDate(new Date())}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    }

    // Add resource articles
    for (const article of articles) {
      xml += "  <url>\n";
      xml += `    <loc>${BASE_URL}/resources/${article.slug}</loc>\n`;
      xml += `    <lastmod>${formatDate(article.updatedAt)}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    // Set headers
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    // Send XML
    res.send(xml);

    console.log(`[Sitemap] Generated sitemap with ${STATIC_PAGES.length} static pages and ${articles.length} articles`);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
}
