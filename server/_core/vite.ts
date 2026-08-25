import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { resources, products, literature } from "../../drizzle/schema";
import { and, desc, eq, or } from "drizzle-orm";
import { ENV } from "./env";
import { CATEGORY_LANDING_PROFILES, CATEGORY_LANDING_SLUGS } from "../../shared/categoryLandingContent";
import { USP_LANDING_PROFILES, USP_LANDING_CODES } from "../../shared/uspLandingContent";

const SITE_URL = "https://www.rowellhplc.com";

/**
 * Extract slug from resource URL
 */
function extractSlugFromPath(urlPath: string): string | null {
  const match = urlPath.match(/^\/resources\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractLiteratureSlugFromPath(urlPath: string): string | null {
  const match = urlPath.match(/^\/learning\/literature\/([^\/\?]+)/);
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

function extractCategoryLandingSlug(urlPath: string): string | null {
  const match = urlPath.match(/^\/categories\/([^\/\?]+)/);
  return match ? match[1] : null;
}

function extractUSPLandingCode(urlPath: string): string | null {
  const match = urlPath.match(/^\/usp\/([^\/\?]+)/i);
  return match ? match[1].toLowerCase() : null;
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
  const requestPath = overridePath || req.path;
  const resourceSlug = extractSlugFromPath(requestPath);
  const literatureSlug = extractLiteratureSlugFromPath(requestPath);
  if (!resourceSlug && !literatureSlug) {
    return template;
  }

  try {
    const db = await getDb();
    if (!db) {
      return template;
    }

    let article: any;
    if (literatureSlug) {
      const records = await db
        .select()
        .from(literature)
        .where(eq(literature.slug, literatureSlug))
        .limit(1);
      if (records.length === 0) {
        return template;
      }
      const record = records[0];
      article = {
        ...record,
        excerpt: record.summary,
        content: [record.summary, record.expandedAnalysis, record.practicalGuide].filter(Boolean).join('\n\n'),
        author: record.authors,
        publishedAt: record.addedDate,
      };
    } else {
      const records = await db
        .select()
        .from(resources)
        .where(eq(resources.slug, resourceSlug!))
        .limit(1);
      if (records.length === 0 || records[0].status !== "published") {
        return template;
      }
      article = records[0];
    }
    // Canonical URLs must not inherit tracking/query parameters or alternate hosts.
    const canonicalPath = (overridePath || req.originalUrl).split('?')[0];
    const fullUrl = `${SITE_URL}${canonicalPath}`;

    const SITE_TITLE = "ROWELL";
    const SITE_LOGO = "https://www.rowellhplc.com/logo.png";
    const title = article.title || SITE_TITLE;
    const description = article.excerpt || "";
    const image = SITE_LOGO;
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
      .where(and(eq(products.slug, slug), eq(products.status, 'active')))
      .limit(1);

    // P1 FIX: Fallback query by partNumber if slug lookup fails
    // This handles cases where Google indexed old URLs like /products/92325
    // but the database slug is daicel-92325
    if (result.length === 0) {
      result = await db
        .select()
        .from(products)
        .where(and(eq(products.partNumber, slug), eq(products.status, 'active')))
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
      `${brandPrefix} ${cleanName} (${product.partNumber || ''}). Review catalog specifications and submit an inquiry to confirm product details for your application.`.trim();

    // Use absolute image URLs for social previews and Product structured data.
    const brandFolder = (product.brand || '').replace(/\s+/g, '');
    const rawImageUrl = product.imageUrl ||
      `/product-images/${brandFolder}/${product.partNumber}.jpg`;
    const imageUrl = toAbsoluteUrl(rawImageUrl);

    // ── P0 FIX: Inject visible content skeleton into <body> to prevent Soft 404 ──
    // Google's soft 404 detection requires actual visible text content in the page body,
    // not just meta tags in <head>. Without this, Google sees an empty <div id="root"> and
    // classifies the page as soft 404, refusing to index it.
    const hasCatalogValue = (value: unknown): value is string => {
      if (typeof value !== 'string') return false;
      const normalized = value.trim();
      return normalized.length > 0 && !/^(?:n\/?a|n\/|not available|none|null|-)$/i.test(normalized);
    };
    const isCartridgeVolume = hasCatalogValue(product.columnLength)
      && /\b(?:spe|cartridge)\b/i.test(`${product.productType || ''} ${product.category || ''} ${product.name || ''}`)
      && /^\d+(?:\.\d+)?\s*mL$/i.test(product.columnLength.trim());
    const isGcCapillary = hasCatalogValue(product.columnLength)
      && /^G\d+$/i.test(String(product.usp || '').trim())
      && /^\d+(?:\.\d+)?\s*m$/i.test(product.columnLength.trim());
    const isGcLiner = hasCatalogValue(product.columnLength)
      && /\b(?:gc\s*)?liner\b/i.test(`${product.productType || ''} ${product.category || ''} ${product.name || ''}`)
      && /^\d+(?:\.\d+)?\s*mm$/i.test(product.columnLength.trim());
    const specsRows = [
      hasCatalogValue(product.particleSize) ? `<tr><td>Particle Size</td><td>${escapeHtml(product.particleSize)}</td></tr>` : '',
      hasCatalogValue(product.poreSize) ? `<tr><td>Pore Size</td><td>${escapeHtml(product.poreSize)}</td></tr>` : '',
      hasCatalogValue(product.columnLength) ? `<tr><td>${isCartridgeVolume ? 'Cartridge Volume' : isGcCapillary ? 'GC Capillary Length' : isGcLiner ? 'Liner Length' : 'Column Length'}</td><td>${escapeHtml(product.columnLength)}</td></tr>` : '',
      hasCatalogValue(product.innerDiameter) ? `<tr><td>Inner Diameter</td><td>${escapeHtml(product.innerDiameter)}</td></tr>` : '',
      hasCatalogValue(product.usp) ? `<tr><td>USP Designation</td><td>${escapeHtml(product.usp)}</td></tr>` : '',
      hasCatalogValue(product.phaseType) ? `<tr><td>Phase Type</td><td>${escapeHtml(product.phaseType)}</td></tr>` : '',
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
      <p>Use the inquiry form to confirm current product details and suitability for your application.</p>
    </div>`;

    // JSON-LD structured data for Google Merchant Listings
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "@id": `${fullUrl}#product`,
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
      "mainEntityOfPage": fullUrl
      // ROWELL is a request-for-quote B2B catalog. No Offer is emitted because
      // current availability, price, shipping, and return terms are confirmed
      // only in the context of each inquiry.
    };
    const productBreadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${fullUrl}#breadcrumb`,
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
    title: "ROWELL | Chromatography Consumables Catalog",
    description: "Browse HPLC columns, GC columns, and chromatography consumables and submit product inquiries for analytical laboratory applications.",
    heading: "Chromatography Consumables for Analytical Laboratories",
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
    title: "USP Column Classification (L-Codes) | ROWELL",
    description: "Browse chromatography catalog products by recorded USP stationary-phase classification (L-codes) and compare exact product specifications for method evaluation.",
    heading: "USP Column Classification (L-Codes)",
    type: "WebPage",
  },
};

function injectCategoryLandingSeoMetaTags(template: string, requestPath: string): string {
  const slug = extractCategoryLandingSlug(requestPath);
  const profile = slug ? CATEGORY_LANDING_PROFILES[slug] : null;
  if (!slug || !profile) return template;

  const fullUrl = `${SITE_URL}/categories/${encodeURIComponent(slug)}`;
  const catalogPath = profile.catalogHref ?? `/products?category=${encodeURIComponent(profile.catalogSlug)}`;
  const catalogUrl = `${SITE_URL}${catalogPath}`;
  const faqEntities = profile.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${fullUrl}#collection`,
      name: profile.heading,
      description: profile.summary,
      url: fullUrl,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "ROWELL", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${fullUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
        { "@type": "ListItem", position: 3, name: profile.name, item: fullUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${fullUrl}#faq`,
      mainEntity: faqEntities,
    },
  ];
  const selectionHtml = profile.selectionPoints
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join("");
  const selectionFrameworkHtml = (profile.selectionFramework ?? [])
    .map((item) => `<section><h3>${escapeHtml(item.heading)}</h3><p>${escapeHtml(item.body)}</p></section>`)
    .join("");
  const selectionFrameworkSectionHtml = selectionFrameworkHtml
    ? `<section><h2>${escapeHtml(profile.name)} Selection Framework</h2><p>Use this framework to organize a method-level comparison before reviewing exact product listings. It is a selection aid, not a substitute for product-specific manufacturer documentation or method-suitability testing.</p>${selectionFrameworkHtml}</section>`
    : "";
  const faqHtml = profile.faq
    .map((item) => `<section><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></section>`)
    .join("");
  const relatedLinksHtml = (profile.relatedLinks ?? [])
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a><p>${escapeHtml(item.description)}</p></li>`)
    .join("");
  const relatedSectionHtml = relatedLinksHtml ? `<section><h2>Related Method Resources</h2><ul>${relatedLinksHtml}</ul></section>` : "";
  const metaTags = `
    <title>${escapeHtml(profile.heading)} | ROWELL</title>
    <meta name="description" content="${escapeHtml(profile.summary)}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(profile.heading)} | ROWELL" />
    <meta property="og:description" content="${escapeHtml(profile.summary)}" />
    <meta property="og:site_name" content="ROWELL" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;

  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  template = template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/products">Products</a> / ${escapeHtml(profile.name)}</nav><h1>${escapeHtml(profile.heading)}</h1><p>${escapeHtml(profile.summary)}</p><h2>Selection Considerations</h2><p>${escapeHtml(profile.overview)}</p><ul>${selectionHtml}</ul>${selectionFrameworkSectionHtml}<p><a href="${catalogUrl}">Browse ${escapeHtml(profile.name)}</a></p>${relatedSectionHtml}<h2>Frequently Asked Questions</h2>${faqHtml}</main></div>`
  );
  return template;
}

function injectUSPLandingSeoMetaTags(template: string, requestPath: string): string {
  const code = extractUSPLandingCode(requestPath);
  const profile = code ? USP_LANDING_PROFILES[code] : null;
  if (!code || !profile) return template;

  const fullUrl = `${SITE_URL}/usp/${encodeURIComponent(code)}`;
  const catalogUrl = `${SITE_URL}/products?usp=${encodeURIComponent(profile.code)}`;
  const faqEntities = profile.faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${fullUrl}#collection`,
      name: profile.heading,
      description: profile.summary,
      url: fullUrl,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: "ROWELL", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${fullUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "USP Column Classification", item: `${SITE_URL}/usp-standards` },
        { "@type": "ListItem", position: 3, name: profile.code, item: fullUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${fullUrl}#faq`,
      mainEntity: faqEntities,
    },
  ];
  const selectionHtml = profile.selectionPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  const faqHtml = profile.faq.map((item) => `<section><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></section>`).join("");
  const metaTags = `
    <title>${escapeHtml(profile.heading)} | ROWELL</title>
    <meta name="description" content="${escapeHtml(profile.summary)}" />
    <link rel="canonical" href="${fullUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${fullUrl}" />
    <meta property="og:title" content="${escapeHtml(profile.heading)} | ROWELL" />
    <meta property="og:description" content="${escapeHtml(profile.summary)}" />
    <meta property="og:site_name" content="ROWELL" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;

  template = template.replace(/<title>.*?<\/title>/i, "");
  template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
  return template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/usp-standards">USP Column Classification</a> / ${escapeHtml(profile.code)}</nav><h1>${escapeHtml(profile.heading)}</h1><p>${escapeHtml(profile.summary)}</p><p>${escapeHtml(profile.overview)}</p><h2>Selection Considerations</h2><ul>${selectionHtml}</ul><p><a href="${catalogUrl}">Browse products recorded with ${escapeHtml(profile.code)}</a></p><p>USP L-codes identify stationary-phase classifications. They do not establish product certification, approval, endorsement, or automatic method replacement.</p><h2>Frequently Asked Questions</h2>${faqHtml}</main></div>`
  );
}

type DynamicRouteStatus = "active" | "gone" | "missing" | "unavailable";

function isKnownPublicSpaRoute(requestPath: string): boolean {
  if (Object.prototype.hasOwnProperty.call(STATIC_PAGE_SEO, requestPath)) return true;
  if (requestPath.startsWith("/usp/")) {
    const code = extractUSPLandingCode(requestPath);
    return !!code && USP_LANDING_CODES.includes(code);
  }
  if (requestPath.startsWith("/categories/")) {
    const slug = extractCategoryLandingSlug(requestPath);
    return !!slug && CATEGORY_LANDING_SLUGS.includes(slug);
  }
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
  const resourceSlug = extractSlugFromPath(requestPath);
  const literatureSlug = extractLiteratureSlugFromPath(requestPath);

  if (!productSlug && !resourceSlug && !literatureSlug) return "active";

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

    if (literatureSlug) {
      const records = await db.select({ id: literature.id })
        .from(literature)
        .where(eq(literature.slug, literatureSlug))
        .limit(1);
      return records.length === 0 ? "missing" : "active";
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

async function redirectLegacyLearningArticle(req: any, res: any, next: () => void): Promise<void> {
  if (req.method !== "GET") return next();
  const match = req.originalUrl.match(/^\/learning\/([^/?]+)(?:\?[^]*)?$/);
  if (!match) return next();
  // The legacy `/learning/:slug` namespace also contains an independent article
  // collection. Redirect only when the same slug exists in the resources table;
  // otherwise leave the learning-center article route intact.
  try {
    const db = await getDb();
    if (!db) return next();
    const resourceRecord = await db.select({ id: resources.id })
      .from(resources)
      .where(eq(resources.slug, match[1]))
      .limit(1);
    if (resourceRecord.length === 0) return next();
    return res.redirect(301, `/resources/${match[1]}`);
  } catch (error) {
    console.error("[SEO] Legacy learning URL check failed:", error);
    return next();
  }
}

async function redirectLegacyProductUrl(req: any, res: any, next: () => void): Promise<void> {
  if (req.method !== "GET") return next();
  const match = req.originalUrl.match(/^\/products\/([^/?]+)(?:\?[^]*)?$/);
  if (!match) return next();

  try {
    const db = await getDb();
    if (!db) return next();
    const legacyKey = decodeURIComponent(match[1]);
    const productRecord = await db.select({ slug: products.slug, status: products.status })
      .from(products)
      .where(or(eq(products.partNumber, legacyKey), eq(products.productId, legacyKey)))
      .limit(1);
    const product = productRecord[0];
    if (!product || product.status !== "active" || !product.slug || product.slug === legacyKey) {
      return next();
    }
    return res.redirect(301, `/products/${encodeURIComponent(product.slug)}`);
  } catch (error) {
    console.error("[SEO] Legacy product URL check failed:", error);
    return next();
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

async function injectResourcesIndexSeoMetaTags(template: string): Promise<string> {
  const page = STATIC_PAGE_SEO["/resources"];
  const fullUrl = `${SITE_URL}/resources`;
  try {
    const db = await getDb();
    if (!db) return injectStaticPageSeoMetaTags(template, "/resources");
    const latestResources = await db.select({
      title: resources.title,
      slug: resources.slug,
      excerpt: resources.excerpt,
      category: resources.category,
      publishedAt: resources.publishedAt,
    })
      .from(resources)
      .where(eq(resources.status, "published"))
      .orderBy(desc(resources.publishedAt))
      .limit(12);

    const itemList = latestResources.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: article.title,
      url: `${SITE_URL}/resources/${encodeURIComponent(article.slug)}`,
    }));
    const structuredData = [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${fullUrl}#collection`,
        name: page.heading,
        description: page.description,
        url: fullUrl,
        inLanguage: "en",
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${fullUrl}#latest-resources`,
        name: "Latest Chromatography Resources",
        itemListElement: itemList,
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${fullUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Resources", item: fullUrl },
        ],
      },
    ];
    const articleLinks = latestResources.map((article) => {
      const articleUrl = `/resources/${encodeURIComponent(article.slug)}`;
      const excerpt = article.excerpt ? `<p>${escapeHtml(article.excerpt)}</p>` : "";
      const category = article.category ? `<p>${escapeHtml(article.category)}</p>` : "";
      return `<article><h2><a href="${articleUrl}">${escapeHtml(article.title)}</a></h2>${category}${excerpt}</article>`;
    }).join("");
    const metaTags = `
      <title>${escapeHtml(page.title)}</title>
      <meta name="description" content="${escapeHtml(page.description)}" />
      <link rel="canonical" href="${fullUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${fullUrl}" />
      <meta property="og:title" content="${escapeHtml(page.title)}" />
      <meta property="og:description" content="${escapeHtml(page.description)}" />
      <meta property="og:site_name" content="ROWELL" />
      <script type="application/ld+json">${serializeJsonLd(structuredData)}</script>`;
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(/(<head[^>]*>)/i, `$1${metaTags}`);
    return template.replace(
      /<div id="root"><\/div>/,
      `<div id="root"><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p><section><h2>Latest Technical Resources</h2>${articleLinks}</section></main></div>`
    );
  } catch (error) {
    console.error("[SEO] Failed to render resources index:", error);
    return injectStaticPageSeoMetaTags(template, "/resources");
  }
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
  const categoryHubLinks = canonicalPath === "/products"
    ? `<nav aria-label="Featured product category guides"><ul>${CATEGORY_LANDING_SLUGS.map((slug) => {
        const profile = CATEGORY_LANDING_PROFILES[slug];
        return `<li><a href="/categories/${encodeURIComponent(slug)}">${escapeHtml(profile.name)} selection guide</a></li>`;
      }).join("")}</ul></nav>`
    : "";
  template = template.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p>${categoryHubLinks}</main></div>`
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
  const uspCode = extractUSPLandingCode(effectivePath);
  if (uspCode && USP_LANDING_CODES.includes(uspCode)) {
    return injectUSPLandingSeoMetaTags(template, effectivePath);
  }
  const categorySlug = extractCategoryLandingSlug(effectivePath);
  if (categorySlug && CATEGORY_LANDING_SLUGS.includes(categorySlug)) {
    return injectCategoryLandingSeoMetaTags(template, effectivePath);
  }
  if (effectivePath === "/resources") {
    return injectResourcesIndexSeoMetaTags(template);
  }
  // Try product pages first
  if (effectivePath.startsWith('/products/')) {
    return injectProductSeoMetaTags(template, req, effectivePath);
  }
  // Then try article pages (/resources/ and /learning/literature/)
  if (effectivePath.startsWith('/resources/')) {
    return injectArticleSeoMetaTags(template, req, effectivePath);
  }
  // Literature pages use the dedicated literature table.
  if (effectivePath.startsWith('/learning/literature/')) {
    return injectArticleSeoMetaTags(template, req, effectivePath);
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

  // Canonicalize legacy article and product URLs before Vite serves the application shell.
  app.use(redirectLegacyLearningArticle);
  app.use(redirectLegacyProductUrl);

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
      
      const requestPath = req.originalUrl.split('?')[0].replace(/\/+$/, '') || '/';
      const dynamicRouteStatus = await getDynamicRouteStatus(requestPath);
      if (dynamicRouteStatus === "missing" || dynamicRouteStatus === "gone" || !isKnownPublicSpaRoute(requestPath)) {
        const statusCode = dynamicRouteStatus === "gone" ? 410 : 404;
        template = renderNotFoundTemplate(template, requestPath, statusCode);
        const page = await vite.transformIndexHtml(url, template);
        return res.status(statusCode).set({ "Content-Type": "text/html" }).end(page);
      }

      // Inject SEO metadata and visible server-side content for every known public route.
      template = await injectSeoMetaTags(template, req, requestPath);
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

  // Canonicalize legacy article and product URLs before static serving or SEO injection.
  app.use(redirectLegacyLearningArticle);
  app.use(redirectLegacyProductUrl);

  // Administrative interfaces are functional application routes, not public search landing pages.
  // Prevent indexing and avoid reusing a stale administrative shell in shared caches.
  app.use((req, res, next) => {
    if (req.path === '/admin' || req.path.startsWith('/admin/')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.setHeader('Cache-Control', 'no-store, private, max-age=0, must-revalidate');
    }
    next();
  });

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
        requestPath.startsWith('/categories/') ||
        requestPath.startsWith('/usp/') ||
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
