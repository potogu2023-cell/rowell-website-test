/**
 * SEO Meta Tag Injection Middleware
 * Dynamically injects meta tags for article pages to improve SEO
 */

import { Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { resources } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

/**
 * Extract slug from resource URL
 * /resources/article-slug-here -> article-slug-here
 */
function extractSlugFromPath(path: string): string | null {
  const match = path.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Generate meta tags HTML
 */
function generateMetaTags(article: any, fullUrl: string): string {
  const title = article.title || ENV.appTitle;
  const description = article.metaDescription || article.excerpt || "";
  const image = article.coverImage || ENV.appLogo;
  
  return `
    <title>${title} | ${ENV.appTitle}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${article.publishedAt?.toISOString() || ''}" />
    <meta property="article:author" content="${article.authorName || 'ROWELL Team'}" />
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * SEO Meta Injection Middleware
 * Intercepts HTML responses and injects meta tags for article pages
 */
export async function seoMetaInjectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only process GET requests for HTML pages
  if (req.method !== "GET") {
    return next();
  }

  // Check if this is a resource article page
  const slug = extractSlugFromPath(req.path);
  if (!slug) {
    return next();
  }

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[SEO] Database not available, skipping meta injection");
      return next();
    }

    // Fetch article from database
    const articles = await db
      .select()
      .from(resources)
      .where(eq(resources.slug, slug))
      .limit(1);

    if (articles.length === 0) {
      // Article not found, continue to 404 handler
      return next();
    }

    const article = articles[0];

    // Only inject meta tags for published articles
    if (article.status !== "published") {
      return next();
    }

    // Intercept response
    const originalSend = res.send.bind(res);
    
    res.send = function (data: any): Response {
      // Only process HTML responses
      const contentType = res.getHeader("Content-Type");
      if (typeof contentType === "string" && contentType.includes("text/html") && typeof data === "string") {
        // Generate full URL
        const protocol = req.protocol;
        const host = req.get("host");
        const fullUrl = `${protocol}://${host}${req.originalUrl}`;

        // Generate meta tags
        const metaTags = generateMetaTags(article, fullUrl);

        // Inject meta tags into <head>
        // Replace default title and add meta tags after charset
        data = data.replace(
          /<title>.*?<\/title>/,
          ""
        );
        
        data = data.replace(
          /(<meta charset="UTF-8" \/>)/,
          `$1\n    ${metaTags}`
        );

        console.log(`[SEO] Injected meta tags for article: ${article.title}`);
      }

      return originalSend(data);
    };

    next();
  } catch (error) {
    console.error("[SEO] Error in meta injection middleware:", error);
    next();
  }
}
