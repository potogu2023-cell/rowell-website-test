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

function serializeJsonLd(data: unknown): string {
  // Prevent a data value from prematurely closing the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
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
    // Canonical URLs must not inherit tracking/query parameters or alternate hosts.
    const canonicalPath = (overridePath || req.originalUrl).split('?')[0];
    const fullUrl = `${SITE_URL}${canonicalPath}`;

    const SITE_TITLE = "ROWELL";
    const SITE_LOGO = "https://www.rowellhplc.com/logo.png";
    const title = article.title || SITE_TITLE;
    const description = article.metaDescription || article.excerpt || "";
    const image = article.coverImage ? toAbsoluteUrl(article.coverImage) : SITE_LOGO;
    // Render a concise, truthful text fallback so non-JavaScript crawlers receive
    // meaningful article content rather than an empty SPA root.
    const articleText = (article.content || description)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, " ")
      .replace(/[#>*_`]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1800);
    // Preserve one verified, same-site product-catalog link in the server-side
    // fallback. The strict pattern prevents arbitrary URLs or HTML injection.
    const internalLinkMatch = (article.content || "").match(
      /\[([^\]]{1,120})\]\((\/products(?:\?[A-Za-z0-9%=&._-]+)?)\)/
    );
    const internalCatalogLink = internalLinkMatch
      ? { label: internalLinkMatch[1], href: internalLinkMatch[2] }
      : null;
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
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;

    // Replace default title and inject meta tags
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );
    template = template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"><article><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${articleText ? `<p>${escapeHtml(articleText)}</p>` : ""}${internalCatalogLink ? `<p><a href="${internalCatalogLink.href}">${escapeHtml(internalCatalogLink.label)}</a></p>` : ""}</article></div>`
    );

    console.log(`[SEO] Injected article meta tags and content fallback for: ${article.title}`);
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
    // Canonical URLs must not inherit tracking/query parameters or alternate hosts.
    const canonicalPath = (overridePath || req.originalUrl).split('?')[0];
    const fullUrl = `${SITE_URL}${canonicalPath}`;

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

    // Use absolute image URLs for social previews and Product structured data.
    const brandFolder = (product.brand || '').replace(/\s+/g, '');
    const rawImageUrl = product.imageUrl ||
      `/product-images/${brandFolder}/${product.partNumber}.jpg`;
    const imageUrl = toAbsoluteUrl(rawImageUrl);

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
    const productBreadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": `${SITE_URL}/products` },
        { "@type": "ListItem", "position": 3, "name": product.name || product.partNumber, "item": fullUrl }
      ]
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
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>
    <script type="application/ld+json">${serializeJsonLd(productBreadcrumbData)}</script>`;

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

const STATIC_PAGE_SEO: Record<string, { title: string; description: string; heading: string; type: "WebSite" | "WebPage" }> = {
  "/": {
    title: "ROWELL | Global Chromatography Consumables Supplier",
    description: "ROWELL supplies HPLC and GC columns, chromatography consumables, and technical support to laboratories worldwide.",
    heading: "Global Chromatography Consumables for Analytical Laboratories",
    type: "WebSite",
  },
  "/products": {
    title: "HPLC & GC Columns and Chromatography Consumables | ROWELL",
    description: "Explore ROWELL's catalog of HPLC columns, GC columns, and chromatography consumables from leading laboratory brands.",
    heading: "Chromatography Columns and Laboratory Consumables",
    type: "WebPage",
  },
  "/resources": {
    title: "Chromatography Technical Guides & Application Notes | ROWELL",
    description: "Browse practical chromatography technical guides, application notes, column selection advice, and troubleshooting resources from ROWELL.",
    heading: "Chromatography Technical Resources",
    type: "WebPage",
  },
  "/learning": {
    title: "Chromatography Learning Center | ROWELL",
    description: "Access practical chromatography learning resources, application notes, technical guides, and laboratory troubleshooting advice.",
    heading: "Chromatography Learning Center",
    type: "WebPage",
  },
  "/applications": {
    title: "Chromatography Applications by Industry | ROWELL",
    description: "Explore chromatography applications for pharmaceutical, environmental, food safety, chemical, and analytical laboratory workflows.",
    heading: "Chromatography Applications by Industry",
    type: "WebPage",
  },
  "/about": {
    title: "About ROWELL | Global Chromatography Consumables Supplier",
    description: "Learn about ROWELL's commitment to reliable chromatography consumables, technical expertise, and global laboratory support.",
    heading: "About ROWELL",
    type: "WebPage",
  },
  "/contact": {
    title: "Contact ROWELL | Chromatography Consumables Support",
    description: "Contact ROWELL for product sourcing, chromatography column selection, technical support, and quotation requests.",
    heading: "Contact ROWELL",
    type: "WebPage",
  },
  "/usp-standards": {
    title: "USP Chromatography Reference Standards | ROWELL",
    description: "Explore USP chromatography reference standards and related analytical support for laboratory method development and quality control.",
    heading: "USP Chromatography Reference Standards",
    type: "WebPage",
  },
};

type DynamicRouteStatus = "active" | "gone" | "missing" | "unavailable";

function isKnownPublicSpaRoute(requestPath: string): boolean {
  if (Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath)) return true;
  return [
    /^\/products\/[^/]+$/,
    /^\/resources\/[^/]+$/,
    /^\/learning(?:-center)?$/,
    /^\/learning\/authors\/[^/]+$/,
    /^\/learning\/literature\/[^/]+$/,
    /^\/learning\/[^/]+$/,
    /^\/applications\/[^/]+$/,
    /^\/standards(?:\/search|\/category\/[^/]+|\/product\/[^/]+)?$/,
    /^\/admin\/(?:messages|seed)$/,
    /^\/test-filters$/,
    /^\/404$/,
  ].some((pattern) => pattern.test(requestPath));
}

async function getDynamicRouteStatus(requestPath: string): Promise<DynamicRouteStatus> {
  const productSlug = extractProductSlugFromPath(requestPath);
  const resourceSlug = extractSlugFromPath(requestPath) ||
    (requestPath.match(/^\/learning\/literature\/([^/?]+)/)?.[1] ?? null);

  if (!productSlug && !resourceSlug) return "active";

  try {
    const db = await getDb();
    // Avoid responding with a false 404 if database connectivity is temporarily unavailable.
    if (!db) return "unavailable";

    if (productSlug) {
      let records = await db.select({ id: products.id, status: products.status })
        .from(products)
        .where(eq(products.slug, productSlug))
        .limit(1);
      if (records.length === 0) {
        records = await db.select({ id: products.id, status: products.status })
          .from(products)
          .where(eq(products.partNumber, productSlug))
          .limit(1);
      }
      if (records.length === 0) return "missing";
      return records[0].status === "active" ? "active" : "gone";
    }

    const records = await db.select({ id: resources.id, status: resources.status })
      .from(resources)
      .where(eq(resources.slug, resourceSlug!))
      .limit(1);
    if (records.length === 0) return "missing";
    return records[0].status === "published" ? "active" : "gone";
  } catch (error) {
    console.error("[SEO] Dynamic route existence check failed:", error);
    return "unavailable";
  }
}

function renderNotFoundTemplate(template: string, requestPath: string, statusCode: 404 | 410): string {
  const title = statusCode === 410 ? "Content No Longer Available | ROWELL" : "Page Not Found | ROWELL";
  const heading = statusCode === 410 ? "This content is no longer available" : "Page not found";
  const description = statusCode === 410
    ? "This product or resource is no longer available. Browse current chromatography consumables and technical resources at ROWELL."
    : "The requested page could not be found. Browse ROWELL's current chromatography consumables and technical resources.";
  const metaTags = `<title>${title}</title><meta name="description" content="${description}" /><meta name="robots" content="noindex, follow" />`;
  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  return template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>${heading}</h1><p>${description}</p><p><a href="/products">Browse products</a> or <a href="/resources">explore technical resources</a>.</p></main></div>`
  );
}

function injectStaticPageSeoMetaTags(template: string, requestPath: string): string {
  const canonicalPath = requestPath.split("?")[0].replace(/\/$/, "") || "/";
  const page = STATIC_PAGE_SEO[canonicalPath];
  if (!page) return template;

  const fullUrl = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": page.type,
    "name": page.title,
    "description": page.description,
    "url": fullUrl,
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "name": "ROWELL",
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/logo.png` }
    }
  };
  const metaTags = `
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:site_name" content="ROWELL" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;

  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  template = template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p></main></div>`
  );
  return template;
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
  return injectStaticPageSeoMetaTags(template, effectivePath);
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

  // Core static routes must be intercepted before express.static can serve the
  // root index.html. Otherwise `/` bypasses route-specific SEO metadata.
  app.use(async (req, res, next) => {
    if (req.method !== "GET") return next();
    const requestPath = req.originalUrl.split("?")[0];
    if (!Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath)) {
      return next();
    }

    try {
      const indexPath = path.resolve(distPath, "index.html");
      let template = await fs.promises.readFile(indexPath, "utf-8");
      template = await injectSeoMetaTags(template, req, requestPath);
      return res.status(200).set({ "Content-Type": "text/html" }).send(template);
    } catch (error) {
      console.error("[SSR] Error injecting static-page SEO metadata:", error);
      return next();
    }
  });

  // Do not let express.static serve index.html for `/` before the SSR/SEO
  // middleware below has a chance to inject route-specific metadata.
  app.use(express.static(distPath, { index: false }));

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
      
      // NOTE: Must use req.originalUrl instead of req.path here!
      // When using app.use("*", handler), req.path is always "/" (relative to mount point),
      // but req.originalUrl contains the actual full path like "/products/695775-742".
      const requestPath = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/'; // Remove query string and normalize trailing slash
      const dynamicRouteStatus = await getDynamicRouteStatus(requestPath);
      if (dynamicRouteStatus === "missing" || dynamicRouteStatus === "gone") {
        let template = await fs.promises.readFile(indexPath, "utf-8");
        const statusCode = dynamicRouteStatus === "gone" ? 410 : 404;
        template = renderNotFoundTemplate(template, requestPath, statusCode);
        return res.status(statusCode).set({ "Content-Type": "text/html" }).send(template);
      }

      if (!isKnownPublicSpaRoute(requestPath)) {
        let template = await fs.promises.readFile(indexPath, "utf-8");
        template = renderNotFoundTemplate(template, requestPath, 404);
        return res.status(404).set({ "Content-Type": "text/html" }).send(template);
      }

      const needsMetaInjection =
        requestPath.startsWith('/products/') ||
        requestPath.startsWith('/resources/') ||
        requestPath.startsWith('/learning/literature/') ||
        Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath);
      
      if (needsMetaInjection) {
        // Read the file, inject meta tags, send as string
        let template = await fs.promises.readFile(indexPath, "utf-8");
        // IMPORTANT: Do NOT spread req object! Express req.get() is a prototype method
        // and will be lost when spread with { ...req }. Instead, pass req directly
        // and override path separately via the overridePath parameter.
        template = await injectSeoMetaTags(template, req, requestPath);
        res.status(200).set({ "Content-Type": "text/html" }).send(template);
      } else {
        // For routes without a defined SEO profile, use the fast static response.
        res.sendFile(indexPath);
      }
    } catch (error) {
      console.error("[SSR] Error serving index.html:", error);
      // Fallback to sendFile on error
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
