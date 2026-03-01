/**
 * ANPEL Standards 数据库查询模块
 * 独立于现有 products 表，不影响现有业务
 * 使用与现有代码一致的 db.execute(string, params) 语法
 */
import { getDb } from './db';

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

function mapProduct(row: any): StandardsProduct {
  return {
    id: Number(row.id),
    part_number: row.part_number || '',
    name_en: row.name_en || '',
    name_cn: row.name_cn || null,
    specification: row.specification || null,
    cas_number: row.cas_number || null,
    category_slug: row.category_slug || null,
    brand: row.brand || 'ANPEL',
    price_cny: row.price_cny != null ? String(row.price_cny) : null,
    price_usd: row.price_usd != null ? String(row.price_usd) : null,
    slug: row.slug || null,
    status: row.status || 'active',
  };
}

export async function getAllStandardsCategories(): Promise<StandardsCategory[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(`
    SELECT sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
           COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    ORDER BY sc.sort_order ASC
  `);
  return (rows as any[]).map((row: any) => ({
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn || null,
    description: row.description || null,
    icon: row.icon || null,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count),
  }));
}

export async function getStandardsCategoryBySlug(slug: string): Promise<StandardsCategory | null> {
  const db = await getDb();
  if (!db) return null;
  const [rows] = await db.execute(`
    SELECT sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order,
           COUNT(sp.id) as product_count
    FROM standards_categories sc
    LEFT JOIN standards_products sp ON sp.category_slug = sc.slug AND sp.status = 'active'
    WHERE sc.slug = ?
    GROUP BY sc.id, sc.slug, sc.name_en, sc.name_cn, sc.description, sc.icon, sc.sort_order
    LIMIT 1
  `, [slug]);
  const arr = rows as any[];
  if (!arr || arr.length === 0) return null;
  const row = arr[0];
  return {
    id: Number(row.id),
    slug: row.slug,
    name_en: row.name_en,
    name_cn: row.name_cn || null,
    description: row.description || null,
    icon: row.icon || null,
    sort_order: Number(row.sort_order),
    product_count: Number(row.product_count),
  };
}

export async function getStandardsByCategory(
  categorySlug: string,
  page: number = 1,
  pageSize: number = 20
): Promise<StandardsListResult> {
  const db = await getDb();
  if (!db) return { items: [], total: 0, page, pageSize };
  const offset = (page - 1) * pageSize;
  const [itemRows] = await db.execute(`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE category_slug = ? AND status = 'active'
    ORDER BY name_en ASC
    LIMIT ? OFFSET ?
  `, [categorySlug, pageSize, offset]);
  const [countRows] = await db.execute(`
    SELECT COUNT(*) as total FROM standards_products
    WHERE category_slug = ? AND status = 'active'
  `, [categorySlug]);
  const total = Number((countRows as any[])[0]?.total || 0);
  return {
    items: (itemRows as any[]).map(mapProduct),
    total,
    page,
    pageSize,
  };
}

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
  const startTerm = `${query}%`;

  let itemRows: any[];
  let countRows: any[];

  if (categorySlug) {
    const [ir] = await db.execute(`
      SELECT id, part_number, name_en, name_cn, specification, cas_number,
             category_slug, brand, price_cny, price_usd, slug, status
      FROM standards_products
      WHERE status = 'active' AND category_slug = ?
        AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
      ORDER BY
        CASE WHEN cas_number = ? THEN 0
             WHEN part_number = ? THEN 1
             WHEN name_en LIKE ? THEN 2
             ELSE 3
        END, name_en ASC
      LIMIT ? OFFSET ?
    `, [categorySlug, searchTerm, searchTerm, searchTerm, searchTerm, query, query, startTerm, pageSize, offset]);
    const [cr] = await db.execute(`
      SELECT COUNT(*) as total FROM standards_products
      WHERE status = 'active' AND category_slug = ?
        AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
    `, [categorySlug, searchTerm, searchTerm, searchTerm, searchTerm]);
    itemRows = ir as any[];
    countRows = cr as any[];
  } else {
    const [ir] = await db.execute(`
      SELECT id, part_number, name_en, name_cn, specification, cas_number,
             category_slug, brand, price_cny, price_usd, slug, status
      FROM standards_products
      WHERE status = 'active'
        AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
      ORDER BY
        CASE WHEN cas_number = ? THEN 0
             WHEN part_number = ? THEN 1
             WHEN name_en LIKE ? THEN 2
             ELSE 3
        END, name_en ASC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, query, query, startTerm, pageSize, offset]);
    const [cr] = await db.execute(`
      SELECT COUNT(*) as total FROM standards_products
      WHERE status = 'active'
        AND (name_en LIKE ? OR name_cn LIKE ? OR cas_number LIKE ? OR part_number LIKE ?)
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);
    itemRows = ir as any[];
    countRows = cr as any[];
  }

  const total = Number((countRows)[0]?.total || 0);
  return {
    items: itemRows.map(mapProduct),
    total,
    page,
    pageSize,
  };
}

export async function getStandardsProductBySlug(slug: string): Promise<StandardsProduct | null> {
  const db = await getDb();
  if (!db) return null;
  const [rows] = await db.execute(`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE slug = ? AND status = 'active'
    LIMIT 1
  `, [slug]);
  const arr = rows as any[];
  if (!arr || arr.length === 0) return null;
  return mapProduct(arr[0]);
}

export async function getRelatedStandardsProducts(
  categorySlug: string,
  excludeId: number,
  limit: number = 6
): Promise<StandardsProduct[]> {
  const db = await getDb();
  if (!db) return [];
  const [rows] = await db.execute(`
    SELECT id, part_number, name_en, name_cn, specification, cas_number,
           category_slug, brand, price_cny, price_usd, slug, status
    FROM standards_products
    WHERE category_slug = ? AND status = 'active' AND id != ?
    ORDER BY RAND()
    LIMIT ?
  `, [categorySlug, excludeId, limit]);
  return (rows as any[]).map(mapProduct);
}

export async function getStandardsStats(): Promise<{ total: number; categories: number }> {
  const db = await getDb();
  if (!db) return { total: 0, categories: 0 };
  const [totalRows] = await db.execute(`SELECT COUNT(*) as total FROM standards_products WHERE status = 'active'`);
  const [catRows] = await db.execute(`SELECT COUNT(*) as total FROM standards_categories`);
  return {
    total: Number((totalRows as any[])[0]?.total || 0),
    categories: Number((catRows as any[])[0]?.total || 0),
  };
}
