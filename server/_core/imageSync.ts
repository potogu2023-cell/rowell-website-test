import { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

/**
 * CSV图片同步API
 * 
 * 接收CSV格式的产品图片数据,批量更新products表
 * CSV格式: partNumber,imageUrl
 * 
 * 使用方式:
 * curl -X POST https://your-domain.com/api/admin/imageSync \
 *   -H "Content-Type: text/csv" \
 *   --data-binary @images.csv
 */
export function registerImageSyncRoutes(app: Express) {
  // CSV图片批量同步API
  app.post("/api/admin/imageSync", async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      
      // 获取CSV原始文本
      let csvText = '';
      
      if (req.is('text/csv') || req.is('text/plain')) {
        // 如果是text/csv或text/plain,从body读取
        csvText = req.body;
      } else if (typeof req.body === 'string') {
        csvText = req.body;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid content type. Please send CSV data with Content-Type: text/csv'
        });
      }

      // 解析CSV
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'CSV file must contain header and at least one data row'
        });
      }

      // 验证CSV头部
      const header = lines[0].trim().toLowerCase();
      if (!header.includes('partnumber') || !header.includes('imageurl')) {
        return res.status(400).json({
          success: false,
          error: 'CSV header must contain "partNumber" and "imageUrl" columns'
        });
      }

      // 解析数据行
      const updates: Array<{ partNumber: string; imageUrl: string }> = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 2) {
          updates.push({
            partNumber: parts[0].trim(),
            imageUrl: parts[1].trim()
          });
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid data rows found in CSV'
        });
      }

      // 执行数据库更新
      const { products } = await import("../../drizzle/schema");
      const db = await getDb();
      
      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available'
        });
      }

      let successCount = 0;
      let failedCount = 0;
      const failedProducts: Array<{ partNumber: string; reason: string }> = [];

      for (const item of updates) {
        try {
          // 查找产品
          const existingProduct = await db
            .select({ id: products.id, productId: products.productId })
            .from(products)
            .where(eq(products.partNumber, item.partNumber))
            .limit(1);

          if (existingProduct.length > 0) {
            // 更新图片URL
            await db
              .update(products)
              .set({ 
                imageUrl: item.imageUrl,
                updatedAt: new Date()
              })
              .where(eq(products.partNumber, item.partNumber));
            
            successCount++;
          } else {
            failedCount++;
            failedProducts.push({
              partNumber: item.partNumber,
              reason: 'Product not found'
            });
          }
        } catch (error: any) {
          failedCount++;
          failedProducts.push({
            partNumber: item.partNumber,
            reason: error.message
          });
        }
      }

      const duration = Date.now() - startTime;

      return res.json({
        success: true,
        summary: {
          totalRows: updates.length,
          successCount,
          failedCount,
          duration: `${(duration / 1000).toFixed(2)}s`
        },
        failedProducts: failedProducts.length > 0 ? failedProducts : undefined
      });

    } catch (error: any) {
      console.error('ImageSync API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 图片同步状态查询API
  app.get("/api/admin/imageSync/status", async (req: Request, res: Response) => {
    try {
      const { products } = await import("../../drizzle/schema");
      const db = await getDb();
      
      if (!db) {
        return res.status(500).json({
          success: false,
          error: 'Database not available'
        });
      }

      // 统计products中有图片的数量
      const productsWithImages = await db
        .select()
        .from(products)
        .where(eq(products.imageUrl, ''));

      const totalProducts = await db
        .select()
        .from(products);

      const withImages = totalProducts.length - productsWithImages.length;

      return res.json({
        success: true,
        stats: {
          totalProducts: totalProducts.length,
          withImages,
          withoutImages: productsWithImages.length,
          coverageRate: ((withImages / totalProducts.length) * 100).toFixed(1) + '%'
        }
      });

    } catch (error: any) {
      console.error('ImageSync status API error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}
