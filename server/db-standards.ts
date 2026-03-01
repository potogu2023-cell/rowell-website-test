/**
 * ANPEL Standards 数据库查询模块
 * 独立于现有 products 表，不影响现有业务
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

export interface StandardsCategory {
  id: number;
  slug: string;
  name_en: string;
  name_cn: string | null;
  description: string | null;
  icon: string | null;
  sort_order: number;
  product_count: number;
}

export interface StandardsProduct {
  id: number;
  part_number: string;
  name_en: string;
  name_cn: string | null;
  specification: string | null;
  cas_number: string | null;
  category_slug: string | null;
  brand: string;
  price_cny: string | null;
  price_usd: string | null;
  slug: string | null;
  status: string;
}

export interface StandardsListResult {
  items: StandardsProduct[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取所有分类及产品数量
 */
export async function getAllStandardsCategories(): Promise<StandardsCategory[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT 
      sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
      COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    ORDER BY sc.sort_order ASC
  `);

  return (result as any[]).map((row: any) => ({
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn,
    description: row.description,
    icon: row.icon,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count),
  }));
}

/**
 * 获取单个分类详情
 */
export async function getStandardsCategoryBySlug(slug: string): Promise<StandardsCategory | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT 
      sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
      COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    WHERE sc.slug = ${slug}
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    LIMIT 1
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  return {
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn,
    description: row.description,
    icon: row.icon,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count),
  };
}

/**
 * 获取分类下的产品列表（分页）
 */
export async function getStandardsByCategory(
  categorySlug: string,
  page: number = 1,
  pageSize: number = 20
): Promise<StandardsListResult> {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page, pageSize };

  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db.execute(sql`
      SELECT id, part_number, name_en, name_cn, specification, cas_number,
             category_slug, brand, price_cny, price_usd, slug, status
      FROM standards_products
      WHERE category_slug = ${categorySlug} AND status = 'active'
      ORDER BY name_en ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT COUNT(*) as total FROM standards_products
      WHERE category_slug = ${categorySlug} AND status = 'active'
    `),
  ]);

  const total = Number((countResult as any[])[0]?.total || 0);

  return {
    items: (items as any[]).map(mapProduct),
    total,
    page,
    pageSize,
  };
}

/**
 * 搜索标准品（支持产品名、CAS号、货号）
 */
export async function searchStandardsProducts(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  categorySlug?: string
): Promise<StandardsListResult> {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page, pageSize };

  const offset = (page - 1) * pageSize;
  const searchTerm = `%${query}%`;

  const categoryFilter = categorySlug
    ? sql`AND category_slug = ${categorySlug}`
    : sql``;

  const [items, countResult] = await Promise.all([
    db.execute(sql`
      SELECT id, part_number, name_en, name_cn, specification, cas_number,
             category_slug, brand, price_cny, price_usd, slug, status
      FROM standards_products
      WHERE status = 'active'
        AND (
          name_en LIKE ${searchTerm}
          OR name_cn LIKE ${searchTerm}
          OR cas_number LIKE ${searchTerm}
          OR part_number LIKE ${searchTerm}
        )
        ${categoryFilter}
      ORDER BY 
        CASE WHEN cas_number = ${query} THEN 0
             WHEN part_number = ${query} THEN 1
             WHEN name_en LIKE ${`${query}%`} THEN 2
             ELSE 3
        END,
        name_en ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT COUNT(*) as total FROM standards_products
      WHERE status = 'active'
        AND (
          name_en LIKE ${searchTerm}
          OR name_cn LIKE ${searchTerm}
          OR cas_number LIKE ${searchTerm}
          OR part_number LIKE ${searchTerm}
        )
        ${categoryFilter}
    `),
  ]);

  const total = Number((countResult as any[])[0]?.total || 0);

  return {
    items: (items as any[]).map(mapProduct),
    total,
    page,
    pageSize,
  };
}

/**
 * 通过 slug 获取单个产品详情
 */
export async function getStandardsProductBySlug(slug: string): Promise<StandardsProduct | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE slug = ${slug} AND status = 'active'
    LIMIT 1
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) return null;
  return mapProduct(rows[0]);
}

/**
 * 通过货号获取产品详情
 */
export async function getStandardsProductByPartNumber(partNumber: string): Promise<StandardsProduct | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.execute(sql`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE part_number = ${partNumber} AND status = 'active'
    LIMIT 1
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) return null;
  return mapProduct(rows[0]);
}

/**
 * 获取同类别的相关产品
 */
export async function getRelatedStandardsProducts(
  categorySlug: string,
  excludeId: number,
  limit: number = 6
): Promise<StandardsProduct[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE category_slug = ${categorySlug} AND status = 'active' AND id != ${excludeId}
    ORDER BY RAND()
    LIMIT ${limit}
  `);

  return (result as any[]).map(mapProduct);
}

/**
 * 获取总产品数统计
 */
export async function getStandardsStats(): Promise<{ total: number; categories: number }> {
  const db = await getDb();
  if (!db) return { total: 0, categories: 0 };

  const [totalResult, catResult] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as total FROM standards_products WHERE status = 'active'`),
    db.execute(sql`SELECT COUNT(*) as total FROM standards_categories`),
  ]);

  return {
    total: Number((totalResult as any[])[0]?.total || 0),
    categories: Number((catResult as any[])[0]?.total || 0),
  };
}

function mapProduct(row: any): StandardsProduct {
  return {
    id: Number(row.id),
    part_number: row.part_number,
    name_en: row.name_en,
    name_cn: row.name_cn,
    specification: row.specification,
    cas_number: row.cas_number,
    category_slug: row.category_slug,
    brand: row.brand || 'ANPEL',
    price_cny: row.price_cny ? String(row.price_cny) : null,
    price_usd: row.price_usd ? String(row.price_usd) : null,
    slug: row.slug,
    status: row.status || 'active',
  };
}
