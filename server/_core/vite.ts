import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { resources, products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./env";

const SITE_URL = "https://www.rowellhplc.com";

/**
 * Extract slug from resource URL
 */
function extractSlugFromPath(urlPath: string): string | null {
  const match = urlPath.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Extract slug from product URL
 * /products/695775-742 -> 695775-742
 */
function extractProductSlugFromPath(urlPath: string): string | null {
  const match = urlPath.match(/^\/products\/([^\/\?]+)/);
  return match ? match[1] : null;
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
 * Inject SEO meta tags into HTML template for article pages
 */
async function injectArticleSeoMetaTags(template: string, req: any, overridePath?: string): Promise<string> {
  const slug = extractSlugFromPath(overridePath || req.path);
  if (!slug) {
    return template;
  }

  try {
    const db = await getDb();
    if (!db) {
      return template;
    }

    const articles = await db
      .select()
      .from(resources)
      .where(eq(resources.slug, slug))
      .limit(1);

    if (articles.length === 0 || articles[0].status !== "published") {
      return template;
    }

    const article = articles[0];
    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'www.rowellhplc.com';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const SITE_TITLE = "ROWELL";
    const SITE_LOGO = "https://www.rowellhplc.com/logo.png";
    const title = article.title || SITE_TITLE;
    const description = article.metaDescription || article.excerpt || "";
    const image = article.coverImage || SITE_LOGO;

    const metaTags = `
    <title>${escapeHtml(title)} | ${SITE_TITLE}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
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
    <meta property="article:published_time" content="${article.publishedAt || ''}" />
    <meta property="article:author" content="${article.author || 'ROWELL Team'}" />`;

    // Replace default title and inject meta tags
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );

    console.log(`[SEO] Injected article meta tags for: ${article.title}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting article meta tags:", error);
    return template;
  }
}

/**
 * Inject SEO meta tags into HTML template for product pages
 * This is the KEY fix for the Soft 404 problem affecting 1,182 product pages.
 * Google crawlers see empty <div id="root"></div> in SPA mode, which triggers soft 404.
 * By injecting full meta tags server-side, we give Google enough content to index properly.
 */
async function injectProductSeoMetaTags(template: string, req: any, overridePath?: string): Promise<string> {
  const slug = extractProductSlugFromPath(overridePath || req.path);
  if (!slug) {
    return template;
  }

  try {
    const db = await getDb();
    if (!db) {
      return template;
    }

    const result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return template;
    }

    const product = result[0];
    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'www.rowellhplc.com';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    // Use database metaTitle/metaDescription if available, otherwise generate
    const title = product.metaTitle ||
      `${product.brand || ''} ${product.name || ''} ${product.partNumber || ''} | ROWELL`.trim();
    const description = product.metaDescription ||
      `Buy ${product.brand || ''} ${product.name || ''} (${product.partNumber || ''}) at ROWELL. Global shipping available. Request a quote today.`.trim();

    // Build product image URL
    const brandFolder = (product.brand || '').replace(/\s+/g, '');
    const imageUrl = product.imageUrl ||
      `${SITE_URL}/product-images/${brandFolder}/${product.partNumber}.jpg`;

    // JSON-LD structured data for Google Merchant Listings
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
      "url": fullUrl,
      "offers": {
        "@type": "Offer",
        "url": fullUrl,
        "priceCurrency": "USD",
        "price": "1",
        "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "ROWELL"
        },
        "shippingDetails": {
          "@type": "OfferShippingDetails",
          "shippingRate": {
            "@type": "MonetaryAmount",
            "value": "0",
            "currency": "USD"
          },
          "shippingDestination": [
            { "@type": "DefinedRegion", "addressCountry": "US" },
            { "@type": "DefinedRegion", "addressCountry": "GB" },
            { "@type": "DefinedRegion", "addressCountry": "DE" },
            { "@type": "DefinedRegion", "addressCountry": "JP" },
            { "@type": "DefinedRegion", "addressCountry": "AU" },
            { "@type": "DefinedRegion", "addressCountry": "CA" },
            { "@type": "DefinedRegion", "addressCountry": "SG" },
            { "@type": "DefinedRegion", "addressCountry": "KR" },
            { "@type": "DefinedRegion", "addressCountry": "IN" }
          ],
          "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
              "@type": "QuantitativeValue",
              "minValue": 1,
              "maxValue": 3,
              "unitCode": "DAY"
            },
            "transitTime": {
              "@type": "QuantitativeValue",
              "minValue": 5,
              "maxValue": 14,
              "unitCode": "DAY"
            }
          }
        },
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": "US",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 30,
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/FreeReturn"
        }
      }
    };

    const metaTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${fullUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="ROWELL" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${fullUrl}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Product specific -->
    <meta property="product:brand" content="${escapeHtml(product.brand || '')}" />
    <meta property="product:availability" content="in stock" />
    <meta property="product:condition" content="new" />
    <meta property="product:price:amount" content="1" />
    <meta property="product:price:currency" content="USD" />
    
    <!-- JSON-LD Structured Data for Google Merchant Listings -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

    // Replace default title and inject meta tags
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );

    console.log(`[SEO] Injected product meta tags for: ${product.partNumber}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting product meta tags:", error);
    return template;
  }
}

/**
 * Unified SEO meta tag injection - handles both articles and products
 * @param template - HTML template string
 * @param req - Express request object (must be the original req, NOT a spread copy)
 * @param overridePath - Optional path override (use req.originalUrl in app.use('*') handlers)
 */
async function injectSeoMetaTags(template: string, req: any, overridePath?: string): Promise<string> {
  // Use overridePath if provided (needed in app.use('*') where req.path is always '/')
  const effectivePath = overridePath || req.path;
  // Try product pages first
  if (effectivePath.startsWith('/products/')) {
    return injectProductSeoMetaTags(template, req, effectivePath);
  }
  // Then try article pages
  if (effectivePath.startsWith('/resources/')) {
    return injectArticleSeoMetaTags(template, req, effectivePath);
  }
  return template;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Use Vite middleware but exclude sitemap.xml and robots.txt
  app.use((req, res, next) => {
    if (req.path === '/sitemap.xml' || req.path === '/robots.txt') {
      return next();
    }
    return vite.middlewares(req, res, next);
  });

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes, sitemap, and robots.txt
    if (url.startsWith('/api/') || url === '/sitemap.xml' || url === '/robots.txt') {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      
      // Inject SEO meta tags for product and article pages
      template = await injectSeoMetaTags(template, req);
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // ── PRODUCTION SSR: Serve index.html with dynamic meta tag injection ──
  // This is the KEY fix for Soft 404 problem in Google Search Console.
  // Previously, res.sendFile() returned a static index.html with empty <div id="root">,
  // causing Google to classify 1,182 product pages as Soft 404.
  // Now we read the file, inject product/article meta tags, then send the response.
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api/') || url === '/sitemap.xml' || url === '/robots.txt') {
      return next();
    }

    try {
      const indexPath = path.resolve(distPath, "index.html");
      
      // Check if it's a product or article page that needs meta injection
      // NOTE: Must use req.originalUrl instead of req.path here!
      // When using app.use("*", handler), req.path is always "/" (relative to mount point),
      // but req.originalUrl contains the actual full path like "/products/695775-742".
      const requestPath = req.originalUrl.split('?')[0]; // Remove query string
      const needsMetaInjection = requestPath.startsWith('/products/') || requestPath.startsWith('/resources/');
      
      if (needsMetaInjection) {
        // Read the file, inject meta tags, send as string
        let template = await fs.promises.readFile(indexPath, "utf-8");
        // IMPORTANT: Do NOT spread req object! Express req.get() is a prototype method
        // and will be lost when spread with { ...req }. Instead, pass req directly
        // and override path separately via the overridePath parameter.
        template = await injectSeoMetaTags(template, req, requestPath);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } else {
        // For non-product/article pages, use fast sendFile
        res.sendFile(indexPath);
      }
    } catch (error) {
      console.error("[SSR] Error serving index.html:", error);
      // Fallback to sendFile on error
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
