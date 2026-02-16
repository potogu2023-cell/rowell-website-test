import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerImageSyncRoutes } from "./imageSync";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { generateSitemap } from "../sitemap";
import { seoMetaInjectionMiddleware } from "../seo-meta-injection";
import { learningCenterRouter as learningCenterRestRouter } from "../learning-center-rest-api";
import { testLiteratureRouter } from "../test-literature-api";

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
  } catch (error) {
    console.error('[Server] Failed to run database migration:', error);
  }

  // Validate production configuration
  try {
    const { validateAllConfigs } = await import('../config-validator');
    const { db } = await import('../db');
    const configValid = await validateAllConfigs(db);
    if (!configValid) {
      console.error('\n⛔ 服务器启动失败：配置验证未通过！');
      console.error('请检查 PRODUCTION_CONFIG.md 文件获取正确配置。\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('[Server] Failed to validate configuration:', error);
    // Don't exit on validation error in case it's a dev environment
  }

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Add text/csv parser for imageSync API
  app.use(bodyParser.text({ type: 'text/csv', limit: '50mb' }));
  app.use(bodyParser.text({ type: 'text/plain', limit: '50mb' }));
  // SEO meta tag injection for article pages
  app.use(seoMetaInjectionMiddleware);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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
    res.send(`User-agent: *\nAllow: /\nSitemap: ${req.protocol}://${req.get("host")}/sitemap.xml`);
  });
  // tRPC API
  app.use(
    "/api/trpc",
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
}

startServer().catch(console.error);
