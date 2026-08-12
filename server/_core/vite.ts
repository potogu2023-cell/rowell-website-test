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
    // Always use HTTPS for canonical URLs to ensure consistent indexing
    const host = req.get('host') || 'www.rowellhplc.com';
    const fullUrl = `https://${host}${req.originalUrl}`;

    const SITE_TITLE = "ROWELL";
    const SITE_LOGO = "https://www.rowellhplc.com/logo.png";
    const title = article.title || SITE_TITLE;
    const description = article.metaDescription || article.excerpt || "";
    const image = article.coverImage || SITE_LOGO;
    const publishedAt = article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date().toISOString();
    const modifiedAt = article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : publishedAt;
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          "mainEntityOfPage": { "@type": "WebPage", "@id": fullUrl },
          "headline": title,
          "description": description,
          "image": [image],
          "datePublished": publishedAt,
          "dateModified": modifiedAt,
          "author": {
            "@type": "Organization",
            "name": article.author || "ROWELL Expert",
            "url": "https://www.rowellhplc.com/about"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ROWELL",
            "logo": { "@type": "ImageObject", "url": SITE_LOGO }
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.rowellhplc.com/" },
            { "@type": "ListItem", "position": 2, "name": "Resources", "item": "https://www.rowellhplc.com/resources" },
            { "@type": "ListItem", "position": 3, "name": title, "item": fullUrl }
          ]
        }
      ]
    };

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
    <meta property="article:author" content="${article.author || 'ROWELL Team'}" />
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

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

    // Primary query: by slug field
    let result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    // P1 FIX: Fallback query by partNumber if slug lookup fails
    // This handles cases where Google indexed old URLs like /products/92325
    // but the database slug is daicel-92325
    if (result.length === 0) {
      result = await db
        .select()
        .from(products)
        .where(eq(products.partNumber, slug))
        .limit(1);
      if (result.length > 0) {
        console.log(`[SEO] Slug '${slug}' not found, matched by partNumber fallback`);
      }
    }

    if (result.length === 0) {
      return template;
    }

    const product = result[0];
    // Always use HTTPS for canonical URLs to ensure consistent indexing
    const host = req.get('host') || 'www.rowellhplc.com';
    const fullUrl = `https://${host}${req.originalUrl}`;

    // Use database metaTitle/metaDescription if available, otherwise generate
    // De-duplicate brand name: if product.name already starts with brand name, strip it
    // e.g. brand="Thermo Fisher", name="Thermo Fisher Scientific Filtration" -> cleanName="Scientific Filtration"
    const rawName = product.name || '';
    const brandPrefix = product.brand || '';
    const cleanName = brandPrefix && rawName.toLowerCase().startsWith(brandPrefix.toLowerCase())
      ? rawName.slice(brandPrefix.length).replace(/^[\s|,\-]+/, '')
      : rawName;
    const title = product.metaTitle ||
      `${brandPrefix} ${cleanName} ${product.partNumber || ''} | ROWELL`.trim();
    const description = product.metaDescription ||
      `Buy ${brandPrefix} ${cleanName} (${product.partNumber || ''}) at ROWELL. Global shipping available. Request a quote today.`.trim();

    // Build product image URL
    const brandFolder = (product.brand || '').replace(/\s+/g, '');
    const imageUrl = product.imageUrl ||
      `${SITE_URL}/product-images/${brandFolder}/${product.partNumber}.jpg`;

    // ── P0 FIX: Inject visible content skeleton into <body> to prevent Soft 404 ──
    // Google's soft 404 detection requires actual visible text content in the page body,
    // not just meta tags in <head>. Without this, Google sees an empty <div id="root"> and
    // classifies the page as soft 404, refusing to index it.
    const specsRows = [
      product.particleSize ? `<tr><td>Particle Size</td><td>${escapeHtml(product.particleSize)}</td></tr>` : '',
      product.poreSize ? `<tr><td>Pore Size</td><td>${escapeHtml(product.poreSize)}</td></tr>` : '',
      product.columnLength ? `<tr><td>Column Length</td><td>${escapeHtml(product.columnLength)}</td></tr>` : '',
      product.innerDiameter ? `<tr><td>Inner Diameter</td><td>${escapeHtml(product.innerDiameter)}</td></tr>` : '',
      product.usp ? `<tr><td>USP Designation</td><td>${escapeHtml(product.usp)}</td></tr>` : '',
      product.phaseType ? `<tr><td>Phase Type</td><td>${escapeHtml(product.phaseType)}</td></tr>` : '',
    ].filter(Boolean).join('');

    const contentSkeleton = `
    <div id="seo-content" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${product.brand ? `<p>Brand: ${escapeHtml(product.brand)}</p>` : ''}
      <p>Part Number: ${escapeHtml(product.partNumber || '')}</p>
      ${product.name ? `<p>Product Name: ${escapeHtml(product.name)}</p>` : ''}
      ${product.description ? `<p>${escapeHtml((product.description || '').substring(0, 500))}</p>` : ''}
      ${specsRows ? `<table><tbody>${specsRows}</tbody></table>` : ''}
      <p>Available at ROWELL. Global shipping. Request a quote for competitive pricing.</p>
    </div>`;

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
      // ROWELL is a request-for-quote B2B catalog. Do not publish a fabricated
      // retail price, shipping promise, or return policy in structured data.
      "offers": {
        "@type": "Offer",
        "url": fullUrl,
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "ROWELL"
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
    
    <!-- JSON-LD Structured Data for product discovery -->
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;

    // Replace default title and inject meta tags
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );

    // Inject visible content skeleton into <body> for Soft 404 prevention
    template = template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"></div>${contentSkeleton}`
    );

    console.log(`[SEO] Injected product meta tags + content skeleton for: ${product.partNumber}`);
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
  // Then try article pages (/resources/ and /learning/literature/)
  if (effectivePath.startsWith('/resources/')) {
    return injectArticleSeoMetaTags(template, req, effectivePath);
  }
  // Literature pages share the same resources table (category-based)
  if (effectivePath.startsWith('/learning/literature/')) {
    // Map /learning/literature/slug to /resources/slug for DB lookup
    const literatureSlug = effectivePath.replace('/learning/literature/', '/resources/');
    return injectArticleSeoMetaTags(template, req, literatureSlug);
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
      const needsMetaInjection = requestPath.startsWith('/products/') || requestPath.startsWith('/resources/') || requestPath.startsWith('/learning/literature/');
      
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
