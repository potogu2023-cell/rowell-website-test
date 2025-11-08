import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./env";

/**
 * Extract slug from resource URL
 */
function extractSlugFromPath(path: string): string | null {
  const match = path.match(/^\/resources\/([^\/\?]+)/);
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
async function injectSeoMetaTags(template: string, req: any): Promise<string> {
  console.log(`[SEO] Processing request: ${req.path}`);
  const slug = extractSlugFromPath(req.path);
  console.log(`[SEO] Extracted slug: ${slug}`);
  if (!slug) {
    console.log(`[SEO] No slug found, skipping injection`);
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
    const host = req.get('host') || 'rowellhplc.com';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const title = article.title || ENV.appTitle;
    const description = article.metaDescription || article.excerpt || "";
    const image = article.coverImage || ENV.appLogo;

    const metaTags = `
    <title>${escapeHtml(title)} | ${ENV.appTitle}</title>
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
    <meta property="article:author" content="${article.authorName || 'ROWELL Team'}" />`;

    // Replace default title and inject meta tags
    // Find the <head> tag and inject right after it
    template = template.replace(/<title>.*?<\/title>/i, "");
    template = template.replace(
      /(<head[^>]*>)/i,
      `$1${metaTags}`
    );

    console.log(`[SEO] Injected meta tags for: ${article.title}`);
    return template;
  } catch (error) {
    console.error("[SEO] Error injecting meta tags:", error);
    return template;
  }
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

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

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
      
      // Inject SEO meta tags for article pages
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

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
