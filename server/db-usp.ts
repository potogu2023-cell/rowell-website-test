/**
 * USP Standards数据库操作模块
 * 
 * 功能:
 * 1. 获取所有USP标准
 * 2. 根据USP代码获取标准详情
 * 3. 根据USP标准匹配产品
 * 4. 获取USP标准及其产品数量
 */

import { db } from './db';
import { products, uspStandards } from '../drizzle/schema';
import { eq, like, and, or, sql } from 'drizzle-orm';

/**
 * 获取所有USP标准,按displayOrder排序
 */
export async function getAllUSPStandards() {
  try {
    const standards = await db.select()
      .from(uspStandards)
      .orderBy(uspStandards.displayOrder);
    
    return standards;
  } catch (error) {
    console.error('Error fetching USP standards:', error);
    throw new Error('Failed to fetch USP standards');
  }
}

/**
 * 根据USP代码获取标准详情
 * @param code USP标准代码,如 "L1", "L7"
 */
export async function getUSPStandardByCode(code: string) {
  try {
    const standard = await db.select()
      .from(uspStandards)
      .where(eq(uspStandards.code, code))
      .limit(1);
    
    if (standard.length === 0) {
      return null;
    }
    
    return standard[0];
  } catch (error) {
    console.error(`Error fetching USP standard ${code}:`, error);
    throw new Error(`Failed to fetch USP standard ${code}`);
  }
}

/**
 * 根据USP标准匹配产品
 * 使用精确匹配算法,避免误匹配(如"L1"匹配到"L10")
 * 
 * @param uspCode USP标准代码,如 "L1"
 * @param limit 返回产品数量限制,默认50
 */
export async function getProductsByUSPStandard(uspCode: string, limit: number = 50) {
  try {
    // 精确匹配USP标准
    // 匹配以下情况:
    // 1. usp = "L1" (完全匹配)
    // 2. usp = "L1,..." (开头)
    // 3. usp = "...,L1" (结尾)
    // 4. usp = "...,L1,..." (中间)
    const matchedProducts = await db.select()
      .from(products)
      .where(
        and(
          or(
            eq(products.usp, uspCode),                                    // "L1"
            like(products.usp, `${uspCode},%`),                          // "L1,..."
            like(products.usp, `%,${uspCode}`),                          // "...,L1"
            like(products.usp, `%,${uspCode},%`)                         // "...,L1,..."
          ),
          // 只返回active状态的产品
          eq(products.status, 'active')
        )
      )
      .orderBy(products.brand, products.name)
      .limit(limit);
    
    return matchedProducts;
  } catch (error) {
    console.error(`Error fetching products for USP ${uspCode}:`, error);
    throw new Error(`Failed to fetch products for USP ${uspCode}`);
  }
}

/**
 * 获取USP标准及其匹配的产品
 * @param uspCode USP标准代码
 * @param productLimit 产品数量限制,默认50
 */
export async function getUSPStandardWithProducts(uspCode: string, productLimit: number = 50) {
  try {
    // 获取USP标准信息
    const standard = await getUSPStandardByCode(uspCode);
    
    if (!standard) {
      return null;
    }
    
    // 获取匹配的产品
    const matchedProducts = await getProductsByUSPStandard(uspCode, productLimit);
    
    return {
      standard,
      products: matchedProducts,
      productCount: matchedProducts.length
    };
  } catch (error) {
    console.error(`Error fetching USP standard with products for ${uspCode}:`, error);
    throw new Error(`Failed to fetch USP standard with products for ${uspCode}`);
  }
}

/**
 * 获取所有USP标准及其对应的产品数量
 * 用于在USP Standards页面显示每个标准有多少个产品
 */
export async function getAllUSPStandardsWithProductCount() {
  try {
    const standards = await getAllUSPStandards();
    
    // 为每个标准计算产品数量
    const standardsWithCount = await Promise.all(
      standards.map(async (standard) => {
        // 使用COUNT查询而不是获取所有产品,提高性能
        const countResult = await db.select({
          count: sql<number>`COUNT(*)`
        })
          .from(products)
          .where(
            and(
              or(
                eq(products.usp, standard.code),
                like(products.usp, `${standard.code},%`),
                like(products.usp, `%,${standard.code}`),
                like(products.usp, `%,${standard.code},%`)
              ),
              eq(products.status, 'active')
            )
          );
        
        return {
          ...standard,
          productCount: Number(countResult[0]?.count || 0)
        };
      })
    );
    
    return standardsWithCount;
  } catch (error) {
    console.error('Error fetching USP standards with product count:', error);
    throw new Error('Failed to fetch USP standards with product count');
  }
}

/**
 * 批量填充产品的USP数据
 * 基于产品名称的规则匹配
 * 
 * ⚠️ 此函数用于数据初始化,生产环境慎用
 */
export async function fillProductUSPData() {
  try {
    const updates = [];
    
    // L1 (C18)
    updates.push(
      db.update(products)
        .set({ usp: 'L1' })
        .where(
          and(
            or(
              like(products.name, '%C18%'),
              like(products.name, '%Octadecyl%'),
              like(products.name, '%ODS%')
            ),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // L7 (C8)
    updates.push(
      db.update(products)
        .set({ usp: 'L7' })
        .where(
          and(
            or(
              like(products.name, '%C8%'),
              like(products.name, '%Octyl%')
            ),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // L11 (Phenyl)
    updates.push(
      db.update(products)
        .set({ usp: 'L11' })
        .where(
          and(
            like(products.name, '%Phenyl%'),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // L60 (HILIC)
    updates.push(
      db.update(products)
        .set({ usp: 'L60' })
        .where(
          and(
            like(products.name, '%HILIC%'),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // L10 (Nitrile/Cyano)
    updates.push(
      db.update(products)
        .set({ usp: 'L10' })
        .where(
          and(
            or(
              like(products.name, '%Nitrile%'),
              like(products.name, '%Cyano%'),
              like(products.name, '%CN%')
            ),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // L3 (Silica)
    updates.push(
      db.update(products)
        .set({ usp: 'L3' })
        .where(
          and(
            or(
              like(products.name, '%Silica%'),
              like(products.name, '%SiO2%')
            ),
            or(
              eq(products.usp, null),
              eq(products.usp, '')
            )
          )
        )
    );
    
    // 执行所有更新
    const results = await Promise.all(updates);
    
    // 统计更新数量
    const totalUpdated = results.reduce((sum, result) => sum + (result.rowsAffected || 0), 0);
    
    return {
      success: true,
      totalUpdated,
      message: `Successfully filled USP data for ${totalUpdated} products`
    };
  } catch (error) {
    console.error('Error filling product USP data:', error);
    throw new Error('Failed to fill product USP data');
  }
}
