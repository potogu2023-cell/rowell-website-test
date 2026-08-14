/**
 * SEO Meta Tag Injection Middleware
 * Dynamically injects meta tags for article pages and product pages to improve SEO
 * This solves the "Soft 404" problem for React SPA pages by injecting full meta content
 * server-side before Google crawlers see the page.
 */
import { Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { resources, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const SITE_TITLE = "ROWELL";
const SITE_URL = "https://www.rowellhplc.com";
const SITE_LOGO = "https://www.rowellhplc.com/logo.png";

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
 * Extract slug from resource URL
 * /resources/article-slug-here -> article-slug-here
 */
function extractResourceSlug(path: string): string | null {
  const match = path.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Extract slug from product URL
 * /products/695775-742 -> 695775-742
 */
function extractProductSlug(path: string): string | null {
  const match = path.match(/^\/products\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Generate meta tags HTML for article pages
 */
function generateArticleMetaTags(article: any, fullUrl: string): string {
  const title = article.title || SITE_TITLE;
  const description = article.metaDescription || article.excerpt || "";
  const image = article.coverImage || SITE_LOGO;
  const fullTitle = title.includes(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;

  return `
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${image}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    
    <!-- Article metadata -->
    <meta property="article:published_time" content="${article.publishedAt?.toISOString() || ''}" />
    <meta property="article:author" content="${article.authorName || 'ROWELL Team'}" />
  `.trim();
}

/**
 * Generate meta tags HTML for product pages
 * Solves the Soft 404 problem by providing full content to Google crawlers
 */
function generateProductMetaTags(product: any, fullUrl: string): string {
  // Use database metaTitle/metaDescription if available, otherwise generate from product data
  const title = product.metaTitle ||
    `${product.brand || ''} ${product.name || ''} ${product.partNumber || ''} | ${SITE_TITLE}`.trim();
  const description = product.metaDescription ||
    `${product.brand || ''} ${product.name || ''} (${product.partNumber || ''}). Review catalog specifications and submit an inquiry to confirm product details for your application.`.trim();

  // Build product image URL
  const brandFolder = (product.brand || '').replace(/\s+/g, '');
  const imageUrl = product.imageUrl ||
    `${SITE_URL}/product-images/${brandFolder}/${product.partNumber}.jpg`;

  // Build JSON-LD structured data for Google Merchant Listings
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name || product.partNumber,
    "description": product.description || description,
    "sku": product.partNumber,
    "mpn": product.partNumber,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "ROWELL"
    },
    "image": imageUrl,
    "url": fullUrl
    // This is a request-for-quote catalog. No Offer is emitted because current
    // availability, price, shipping, and return terms must be confirmed per inquiry.
  };

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="${SITE_TITLE}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Product specific -->
    <meta property="product:brand" content="${escapeHtml(product.brand || '')}" />
    <meta property="product:condition" content="new" />
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  `.trim();
}

/**
 * Inject meta tags into HTML string
 */
function injectMetaTagsIntoHtml(html: string, metaTags: string): string {
  // Remove existing title tag
  let result = html.replace(/<title>[\s\S]*?<\/title>/, '');

  // Inject after charset meta tag
  const injected = result.replace(
    /(<meta charset="UTF-8" \/>)/,
    `$1\n    ${metaTags}`
  );

  // Fallback: inject before </head> if charset replacement didn't work
  if (injected === result) {
    return result.replace('</head>', `    ${metaTags}\n  </head>`);
  }

  return injected;
}

/**
 * SEO Meta Injection Middleware
 * Intercepts HTML responses and injects meta tags for:
 * 1. Product pages (/products/:slug) - solves Soft 404 problem for 1,182 pages
 * 2. Article pages (/resources/:slug)
 */
export async function seoMetaInjectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only process GET requests
  if (req.method !== "GET") {
    return next();
  }

  const path = req.path;

  // ── 1. Product pages (/products/:slug) ──────────────────────────────────
  const productSlug = extractProductSlug(path);
  if (productSlug) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[SEO] Database not available, skipping product meta injection");
        return next();
      }

      // Query product by slug field
      const result = await db
        .select()
        .from(products)
        .where(eq(products.slug, productSlug))
        .limit(1);

      if (result.length === 0) {
        // Product not found, continue normally
        return next();
      }

      const product = result[0];

      // Intercept response to inject meta tags
      const originalSend = res.send.bind(res);
      res.send = function (data: any): Response {
        const contentType = res.getHeader("Content-Type");
        if (
          typeof contentType === "string" &&
          contentType.includes("text/html") &&
          typeof data === "string"
        ) {
      // Always use HTTPS for canonical URLs to ensure consistent indexing
      const host = req.get("host") || "www.rowellhplc.com";
      const fullUrl = `https://${host}${req.originalUrl}`;
      const metaTags = generateProductMetaTags(product, fullUrl);
          data = injectMetaTagsIntoHtml(data, metaTags);
          console.log(`[SEO] Injected product meta tags: ${product.partNumber}`);
        }
        return originalSend(data);
      };

      return next();
    } catch (error) {
      console.error("[SEO] Error in product meta injection:", error);
      return next();
    }
  }

  // ── 2. Article pages (/resources/:slug) ─────────────────────────────────
  const resourceSlug = extractResourceSlug(path);
  if (resourceSlug) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[SEO] Database not available, skipping article meta injection");
        return next();
      }

      const articles = await db
        .select()
        .from(resources)
        .where(eq(resources.slug, resourceSlug))
        .limit(1);

      if (articles.length === 0) {
        return next();
      }

      const article = articles[0];
      if (article.status !== "published") {
        return next();
      }

      // Always use HTTPS for canonical URLs to ensure consistent indexing
      const host = req.get("host") || "www.rowellhplc.com";
      const fullUrl = `https://${host}${req.originalUrl}`;
      const metaTags = generateArticleMetaTags(article, fullUrl);

      // Intercept res.send (used when needsMetaInjection=true in serveStatic)
      const originalSend = res.send.bind(res);
      res.send = function (data: any): Response {
        const contentType = res.getHeader("Content-Type");
        if (
          typeof contentType === "string" &&
          contentType.includes("text/html") &&
          typeof data === "string"
        ) {
          data = injectMetaTagsIntoHtml(data, metaTags);
          console.log(`[SEO] Injected article meta tags (via send): ${article.title}`);
        }
        return originalSend(data);
      };

      // Also intercept res.sendFile (used when needsMetaInjection=false in serveStatic)
      // This ensures injection works even if serveStatic falls back to sendFile
      const originalSendFile = (res as any).sendFile.bind(res);
      (res as any).sendFile = function (filePath: string, ...args: any[]) {
        fs.readFile(filePath, "utf-8", (err, data) => {
          if (err) {
            console.error(`[SEO] Error reading file for article injection: ${err.message}`);
            return originalSendFile(filePath, ...args);
          }
          const injected = injectMetaTagsIntoHtml(data, metaTags);
          console.log(`[SEO] Injected article meta tags (via sendFile): ${article.title}`);
          res.status(200).set({ "Content-Type": "text/html" }).send(injected);
        });
      };

      return next();
    } catch (error) {
      console.error("[SEO] Error in article meta injection:", error);
      return next();
    }
  }

  // Not a product or article page, continue normally
  return next();
}
