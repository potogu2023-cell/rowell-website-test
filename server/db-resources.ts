import { and, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import slugify from "slugify";
import { getDb } from "./db";
import {
  resources,
  resourceCategories,
  resourceTags,
  resourcePostTags,
  type InsertResource,
} from "../drizzle/schema";

/** Generate a URL-safe slug while retaining transliteration support. */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"’!:@]/g,
    trim: true,
  });
}

function toMysqlTimestamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const condition = excludeId === undefined
      ? eq(resources.slug, slug)
      : and(eq(resources.slug, slug), ne(resources.id, excludeId));
    const existing = await db.select({ id: resources.id }).from(resources).where(condition).limit(1);
    if (existing.length === 0) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export type ResourceWriteInput = {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  status?: "draft" | "published" | "archived";
  category?: string;
  tags?: string[];
  publishedAt?: Date;
};

/** Create a resource using fields that exist in the current resources schema. */
export async function createResource(data: ResourceWriteInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const slug = await ensureUniqueSlug(generateSlug(data.title));
  const resourceData: InsertResource = {
    slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    author: data.author || "ROWELL Team",
    status: data.status || "draft",
    category: data.category,
    tags: data.tags,
    publishedAt: data.publishedAt
      ? toMysqlTimestamp(data.publishedAt)
      : data.status === "published"
        ? toMysqlTimestamp(new Date())
        : null,
  };

  const result = await db.insert(resources).values(resourceData);
  const resourceId = Number(result[0].insertId);
  await replaceResourceTags(db, resourceId, data.tags);
  return { id: resourceId, slug };
}

export type ResourceUpdateInput = Partial<Omit<ResourceWriteInput, "title">> & {
  title?: string;
};

/** Update only schema-backed resource fields and preserve tag relations. */
export async function updateResource(id: number, data: ResourceUpdateInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<InsertResource> = {};
  if (data.title !== undefined) {
    updateData.title = data.title;
    updateData.slug = await ensureUniqueSlug(generateSlug(data.title), id);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.author !== undefined) updateData.author = data.author;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "published") {
      const existing = await db
        .select({ publishedAt: resources.publishedAt })
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);
      if (existing.length > 0 && !existing[0].publishedAt) {
        updateData.publishedAt = toMysqlTimestamp(new Date());
      }
    }
  }
  if (data.publishedAt !== undefined) updateData.publishedAt = toMysqlTimestamp(data.publishedAt);
  if (data.tags !== undefined) updateData.tags = data.tags;

  if (Object.keys(updateData).length > 0) {
    await db.update(resources).set(updateData).where(eq(resources.id, id));
  }
  if (data.tags !== undefined) await replaceResourceTags(db, id, data.tags);
  return { id };
}

async function replaceResourceTags(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  resourceId: number,
  tags?: string[],
) {
  if (tags === undefined) return;
  await db.delete(resourcePostTags).where(eq(resourcePostTags.postId, resourceId));

  for (const tagName of tags) {
    const name = tagName.trim();
    if (!name) continue;
    const slug = generateSlug(name);
    const existing = await db.select({ id: resourceTags.id }).from(resourceTags).where(eq(resourceTags.slug, slug)).limit(1);
    const tagId = existing.length > 0
      ? existing[0].id
      : Number((await db.insert(resourceTags).values({ name, slug }))[0].insertId);
    await db.insert(resourcePostTags).values({ postId: resourceId, tagId });
  }
}

export async function getResourceBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1);
  if (result.length === 0) return null;
  const resource = result[0];
  const tags = await db
    .select({ id: resourceTags.id, name: resourceTags.name, slug: resourceTags.slug })
    .from(resourcePostTags)
    .innerJoin(resourceTags, eq(resourcePostTags.tagId, resourceTags.id))
    .where(eq(resourcePostTags.postId, resource.id));
  return { ...resource, tags };
}

export async function listResources(options: {
  page?: number;
  pageSize?: number;
  status?: "draft" | "published" | "archived";
  category?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const page = options.page || 1;
  const pageSize = options.pageSize || 12;
  const offset = (page - 1) * pageSize;
  const conditions: SQL[] = [];
  if (options.status) conditions.push(eq(resources.status, options.status));
  if (options.category) conditions.push(eq(resources.category, options.category));
  if (options.search) {
    const pattern = `%${options.search}%`;
    conditions.push(sql`(${resources.title} LIKE ${pattern} OR ${resources.excerpt} LIKE ${pattern})`);
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(resources).where(whereClause);
  const total = Number(countResult[0]?.count || 0);
  const items = await db
    .select()
    .from(resources)
    .where(whereClause)
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function incrementViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(resources).set({ views: sql`${resources.views} + 1` }).where(eq(resources.id, id));
}

export async function getOrCreateCategory(name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = generateSlug(name);
  const existing = await db.select().from(resourceCategories).where(eq(resourceCategories.slug, slug)).limit(1);
  if (existing.length > 0) return existing[0];

  const result = await db.insert(resourceCategories).values({ name, slug, description });
  return { id: Number(result[0].insertId), name, slug, description };
}

export async function listCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(resourceCategories).orderBy(resourceCategories.displayOrder, resourceCategories.name);
}
