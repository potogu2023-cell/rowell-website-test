import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from '../drizzle/schema';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

/**
 * Vercel Serverless Function: 批量更新产品图片URL
 * 
 * 用法:
 * POST /api/update-product-images
 * 
 * Body:
 * {
 *   "updates": [
 *     { "productId": "245011", "imageUrl": "https://..." },
 *     { "productId": "245012", "imageUrl": "https://..." }
 *   ],
 *   "apiKey": "your-secret-api-key"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "updated": 55,
 *   "failed": 0,
 *   "details": [...]
 * }
 */

interface UpdateRequest {
  updates: Array<{
    productId: string;
    imageUrl: string;
  }>;
  apiKey?: string;
}

interface UpdateResult {
  productId: string;
  success: boolean;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const body = req.body as UpdateRequest;

    // 验证请求体
    if (!body.updates || !Array.isArray(body.updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected { updates: [...] }'
      });
    }

    // API Key验证(可选,增强安全性)
    const expectedApiKey = process.env.IMAGE_UPDATE_API_KEY;
    if (expectedApiKey && body.apiKey !== expectedApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Invalid API key.'
      });
    }

    // 连接数据库
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      return res.status(500).json({
        success: false,
        error: 'DATABASE_URL not configured'
      });
    }

    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    // 执行批量更新
    const results: UpdateResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const update of body.updates) {
      try {
        const { productId, imageUrl } = update;

        // 验证数据
        if (!productId || !imageUrl) {
          results.push({
            productId: productId || 'unknown',
            success: false,
            error: 'Missing productId or imageUrl'
          });
          failedCount++;
          continue;
        }

        // 更新数据库
        await db
          .update(products)
          .set({ imageUrl })
          .where(eq(products.productId, productId));

        results.push({
          productId,
          success: true
        });
        successCount++;
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failedCount++;
      }
    }

    await connection.end();

    // 返回结果
    return res.status(200).json({
      success: true,
      updated: successCount,
      failed: failedCount,
      total: body.updates.length,
      details: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating product images:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
