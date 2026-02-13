import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "./db";
import { products, categories, inquiries, inquiryItems, users } from "../drizzle/schema";
import { eq, like, and, or, sql, desc } from "drizzle-orm";
import axios from 'axios';

// One-time execution flag (in-memory, resets on server restart)
let updateExecuted = false;

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // One-time self-destructing endpoint for YMC/Tosoh data update
  app.post("/api/admin/update-products-once", async (req, res) => {
    try {
      // Check if already executed
      if (updateExecuted) {
        return res.status(403).json({ 
          error: "This endpoint has already been executed and is now disabled.",
          message: "Data update can only be performed once. Please contact administrator if you need to run it again."
        });
      }

      console.log('[UPDATE] Starting one-time YMC and Tosoh product data update...');
      
      // CDN URLs for data files
      const YMC_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/tjohcbqXsySOlnhe.csv';
      const TOSOH_CDN_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031980410/XSAyYRUdzBdDdNIA.csv';
      
      // Fetch YMC data
      console.log('[UPDATE] Fetching YMC data from CDN...');
      const ymcResponse = await axios.get(YMC_CDN_URL);
      const ymcData = parseCSV(ymcResponse.data);
      console.log(`[UPDATE] Found ${ymcData.length} YMC products`);
      
      // Fetch Tosoh data
      console.log('[UPDATE] Fetching Tosoh data from CDN...');
      const tosohResponse = await axios.get(TOSOH_CDN_URL);
      const tosohData = parseCSV(tosohResponse.data);
      console.log(`[UPDATE] Found ${tosohData.length} Tosoh products`);
      
      const allData = [...ymcData, ...tosohData];
      
      let updatedCount = 0;
      let notFoundCount = 0;
      const notFoundProducts: string[] = [];
      
      console.log('[UPDATE] Starting database update...');
      
      for (const row of allData) {
        try {
          // Find product by partNumber
          const existingProducts = await db
            .select()
            .from(products)
            .where(eq(products.partNumber, row.productCode))
            .limit(1);
          
          if (existingProducts.length === 0) {
            console.log(`[UPDATE] Product not found: ${row.productCode}`);
            notFoundCount++;
            notFoundProducts.push(row.productCode);
            continue;
          }
          
          // Update product with complete data
          await db
            .update(products)
            .set({
              particleSize: row.particleSize || null,
              poreSize: row.poreSize || null,
              dimensions: `${row.columnLength} × ${row.innerDiameter}`,
              status: 'active', // Set status to active
              phRange: row.phRange || null,
              usp: row.usp || null,
              description: row.description || null,
              applications: row.applications || null,
            })
            .where(eq(products.partNumber, row.productCode));
          
          updatedCount++;
          
          if (updatedCount % 20 === 0) {
            console.log(`[UPDATE] Progress: ${updatedCount}/${allData.length} products updated`);
          }
        } catch (error) {
          console.error(`[UPDATE] Error updating product ${row.productCode}:`, error);
        }
      }
      
      // Mark as executed to disable future calls
      updateExecuted = true;
      
      console.log('[UPDATE] ========================================');
      console.log('[UPDATE] UPDATE SUMMARY');
      console.log('[UPDATE] ========================================');
      console.log(`[UPDATE] Total products processed:    ${allData.length}`);
      console.log(`[UPDATE] Successfully updated:        ${updatedCount}`);
      console.log(`[UPDATE] Not found in database:       ${notFoundCount}`);
      console.log('[UPDATE] ========================================');
      console.log('[UPDATE] Endpoint is now DISABLED');
      
      return res.json({
        success: true,
        summary: {
          totalProcessed: allData.length,
          successfullyUpdated: updatedCount,
          notFound: notFoundCount,
          notFoundProducts: notFoundProducts.length > 0 ? notFoundProducts : undefined
        },
        message: "Update completed successfully. This endpoint is now disabled and cannot be used again.",
        endpointStatus: "DISABLED"
      });
      
    } catch (error) {
      console.error('[UPDATE] Update failed:', error);
      return res.status(500).json({ 
        error: "Update failed", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Helper function to parse CSV
  function parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map((line: string) => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header: string, index: number) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  }

  // Get all products with optional filters
  app.get("/api/products", async (req, res) => {
    try {
      const { 
        search, 
        brand, 
        category: categorySlug, 
        page = "1", 
        limit = "24",
        sort = "name"
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let whereConditions: any[] = [];

      // Search filter
      if (search && typeof search === "string") {
        whereConditions.push(
          or(
            like(products.partNumber, `%${search}%`),
            like(products.name, `%${search}%`),
            like(products.brand, `%${search}%`)
          )
        );
      }

      // Brand filter
      if (brand && typeof brand === "string") {
        whereConditions.push(eq(products.brand, brand));
      }

      // Category filter
      if (categorySlug && typeof categorySlug === "string") {
        whereConditions.push(eq(products.categoryId, categorySlug));
      }

      // Build where clause
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);
      
      const total = Number(totalResult[0]?.count || 0);

      // Get products
      let query = db
        .select()
        .from(products)
        .where(whereClause)
        .limit(limitNum)
        .offset(offset);

      // Apply sorting
      if (sort === "price-asc") {
        query = query.orderBy(products.price);
      } else if (sort === "price-desc") {
        query = query.orderBy(desc(products.price));
      } else {
        query = query.orderBy(products.name);
      }

      const result = await query;

      res.json({
        products: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get single product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const result = await db.select().from(categories);
      res.json(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create inquiry (requires authentication)
  app.post("/api/inquiries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { items, notes } = req.body;
      const userId = req.user!.id;

      // Create inquiry
      const [inquiry] = await db
        .insert(inquiries)
        .values({
          userId,
          status: "pending",
          notes: notes || null,
        })
        .returning();

      // Create inquiry items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await db.insert(inquiryItems).values({
            inquiryId: inquiry.id,
            productId: item.productId,
            quantity: item.quantity || 1,
          });
        }
      }

      res.json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // Get user's inquiries (requires authentication)
  app.get("/api/inquiries", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const userId = req.user!.id;
      const result = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.userId, userId))
        .orderBy(desc(inquiries.createdAt));

      res.json(result);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
