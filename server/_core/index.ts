import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAdminAccessRoutes } from "./admin-access";
import { registerImageSyncRoutes } from "./imageSync";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateSitemap } from "../sitemap";
import { learningCenterRouter as learningCenterRestRouter } from "../learning-center-rest-api";
import { testLiteratureRouter } from "../test-literature-api";
import { importArticles } from "../article-importer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Run database migration first
  try {
    const { migrateDatabase } = await import('../migrate-db');
    await migrateDatabase();
  } catch {
    console.error('[Server] Failed to run database migration');
  }

  // Validate production configuration
  try {
    const { validateAllConfigs } = await import('../config-validator');
    const { getDb } = await import('../db');
    const db = await getDb();
    const configValid = await validateAllConfigs(db);
    if (!configValid) {
      console.error('\n⛔ 服务器启动失败：配置验证未通过！');
      console.error('请检查 PRODUCTION_CONFIG.md 文件获取正确配置。\n');
      process.exit(1);
    }
  } catch {
    console.error('[Server] Failed to validate configuration');
    // Don't exit on validation error in case it's a dev environment
  }

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Add text/csv parser for imageSync API
  app.use(express.text({ type: 'text/csv', limit: '50mb' }));
  app.use(express.text({ type: 'text/plain', limit: '50mb' }));
  // Product and article SEO tags are injected once in serveStatic/setupVite.
  // Do not mount the legacy response-interception middleware here: it duplicates
  // canonical tags and Product JSON-LD in production HTML.
  // Legacy OAuth callback and independent email-based administrator access.
  registerOAuthRoutes(app);
  registerAdminAccessRoutes(app);
  // ImageSync REST API for CSV uploads
  registerImageSyncRoutes(app)  // Learning Center API
app.use("/api/learning-center", learningCenterRestRouter);
  // Test API for debugging
  app.use("/api", testLiteratureRouter);
  // Sitemap.xml for SEO
  app.get("/sitemap.xml", generateSitemap);
  // robots.txt for search engines
  app.get("/robots.txt", (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    // Always advertise the canonical host, even if an alias domain is crawled.
    // Keep operational routes out of search crawl paths.
    res.send("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /test-filters\nSitemap: https://www.rowellhplc.com/sitemap.xml");
  });
  // Debug endpoint to test article meta injection directly
  app.get("/api/debug/article-meta", async (req, res) => {
    try {
      const { getDb } = await import('../db');
      const { resources: resourcesTable } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await getDb();
      if (!db) {
        return res.json({ error: 'DB not available' });
      }
      const slug = req.query.slug as string || 'food-analysis-artificial-sweeteners-beverages';
      const articles = await db.select().from(resourcesTable).where(eq(resourcesTable.slug, slug)).limit(1);
      if (articles.length === 0) {
        return res.json({ error: 'Article not found', slug });
      }
      const article = articles[0];
      res.json({
        found: true,
        slug: article.slug,
        status: article.status,
        title: article.title,
        hasExcerpt: !!article.excerpt,
        reqGet: typeof req.get,
        host: req.get('host'),
        protocol: req.protocol
      });
    } catch (e: any) {
      res.json({ error: String(e), stack: e.stack?.slice(0, 500) });
    }
  });

  // Debug endpoint to verify deployed code version
  app.get("/api/debug/version", async (req, res) => {
    try {
      const { createHash } = await import('crypto');
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
      const indexPath = resolve(import.meta.dirname, 'index.js');
      const content = readFileSync(indexPath, 'utf-8');
      const hash = createHash('md5').update(content).digest('hex');
      const hasSendFileInterception = content.includes('originalSendFile');
      const hasResourcesCheck = content.includes('startsWith("/resources/")');
      const hasOriginalUrl = content.includes('req.originalUrl.split');
      const hasFixedSiteTitle = content.includes('SITE_TITLE2 = "ROWELL"') || content.includes('SITE_TITLE = "ROWELL"');
      const hasNoEnvAppTitle = !content.includes('ENV.appTitle');
      res.json({
        hash,
        hasSendFileInterception,
        hasResourcesCheck,
        hasOriginalUrl,
        hasFixedSiteTitle,
        hasNoEnvAppTitle,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      res.json({ error: String(e) });
    }
  });

  // tRPC API responses may contain authenticated or operational data. Never permit browser or edge caching.
  app.use(
    "/api/trpc",
    (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store, private, max-age=0, must-revalidate");
      res.setHeader("CDN-Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      next();
    },
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Delivery events are persisted in MySQL; the in-process worker safely resumes
  // due work after a deploy or restart without storing customer details in logs.
  try {
    const { startInquiryNotificationWorker } = await import('../inquiry-notification-worker');
    startInquiryNotificationWorker();
  } catch {
    console.error('[InquiryNotifications] Worker could not start');
  }

  // Enabled only through SEO_MONITOR_ENABLED=true. This worker performs public
  // technical checks and never fetches private Search Console data or modifies pages.
  try {
    const { startSeoTechnicalMonitoringWorker } = await import('../seo-monitoring-worker');
    startSeoTechnicalMonitoringWorker();
  } catch {
    console.error('[SeoMonitoring] Worker could not start');
  }

  // Importing content during every production restart can silently overwrite
  // reviewed articles. Keep this exceptional maintenance operation opt-in only.
  if (process.env.RUN_STARTUP_ARTICLE_IMPORT === 'true') {
    console.warn('[Server] Explicit startup article import enabled.');
    try {
      await importArticles();
    } catch (error) {
      console.error('[Server] Failed to import articles:', error);
    }
  } else {
    console.log('[Server] Startup article import skipped; use a controlled import workflow when needed.');
  }
}

startServer().catch(console.error);
