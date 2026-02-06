import { eq, desc, and, sql, like } from "drizzle-orm";
import { getDb } from "./db";
import slugify from "slugify";
import {
  resources,
  resourceCategories,
  resourceTags,
  resourcePostTags,
  type InsertResource,
  type Resource,
  type InsertResourceCategory,
  type ResourceCategory,
  type InsertResourceTag,
  type ResourceTag,
} from "../drizzle/schema";

/**
 * Generate URL-friendly slug from title
 * Supports multilingual characters (Russian, Spanish, etc.)
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,        // Convert to lowercase
    strict: true,       // Strip special characters except replacement
    remove: /[*+~.()'\"’!:@]/g, // Remove specific characters
    trim: true,         // Trim leading/trailing replacement chars
  });
}

/**
 * Ensure slug is unique by appending number if necessary
 */
export async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(
          eq(resources.slug, slug),
          excludeId ? sql`${resources.id} != ${excludeId}` : undefined
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Create a new resource article
 */
export async function createResource(data: {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorName?: string;
  status?: "draft" | "published" | "archived";
  language?: string;
  categoryId?: number;
  featured?: boolean;
  tags?: string[]; // Array of tag names
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate unique slug
  const baseSlug = generateSlug(data.title);
  const slug = await ensureUniqueSlug(baseSlug);

  // Prepare resource data
  const resourceData: InsertResource = {
    slug,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    coverImage: data.coverImage,
    authorName: data.authorName || "ROWELL Team",
    status: data.status || "draft",
    language: data.language || "en",
    categoryId: data.categoryId,
    featured: data.featured ? 1 : 0,
    publishedAt: data.status === "published" ? new Date() : null,
  };

  // Insert resource
  const result = await db.insert(resources).values(resourceData);
  const resourceId = Number(result[0].insertId);

  // Handle tags if provided
  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      // Get or create tag
      const tagSlug = generateSlug(tagName);
      let tag = await db
        .select()
        .from(resourceTags)
        .where(eq(resourceTags.slug, tagSlug))
        .limit(1);

      let tagId: number;
      if (tag.length === 0) {
        // Create new tag
        const tagResult = await db.insert(resourceTags).values({
          name: tagName,
          slug: tagSlug,
        });
        tagId = Number(tagResult[0].insertId);
      } else {
        tagId = tag[0].id;
      }

      // Link tag to resource
      await db.insert(resourcePostTags).values({
        postId: resourceId,
        tagId,
      });
    }
  }

  return { id: resourceId, slug };
}

/**
 * Update an existing resource article
 */
export async function updateResource(
  id: number,
  data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    coverImage: string;
    authorName: string;
    status: "draft" | "published" | "archived";
    language: string;
    categoryId: number;
    featured: boolean;
    tags: string[];
    publishedAt: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Partial<InsertResource> = {};

  // Handle title change (regenerate slug)
  if (data.title !== undefined) {
    updateData.title = data.title;
    const baseSlug = generateSlug(data.title);
    updateData.slug = await ensureUniqueSlug(baseSlug, id);
  }

  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.authorName !== undefined) updateData.authorName = data.authorName;
  if (data.status !== undefined) {
    updateData.status = data.status;
    // Set publishedAt when status changes to published
    if (data.status === "published") {
      const existing = await db.select({ publishedAt: resources.publishedAt }).from(resources).where(eq(resources.id, id)).limit(1);
      if (existing.length > 0 && !existing[0].publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
  }
  if (data.language !== undefined) updateData.language = data.language;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.featured !== undefined) updateData.featured = data.featured ? 1 : 0;
  if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt;

  // Update resource
  await db.update(resources).set(updateData).where(eq(resources.id, id));

  // Handle tags if provided
  if (data.tags !== undefined) {
    // Remove existing tags
    await db.delete(resourcePostTags).where(eq(resourcePostTags.postId, id));

    // Add new tags
    for (const tagName of data.tags) {
      const tagSlug = generateSlug(tagName);
      let tag = await db
        .select()
        .from(resourceTags)
        .where(eq(resourceTags.slug, tagSlug))
        .limit(1);

      let tagId: number;
      if (tag.length === 0) {
        const tagResult = await db.insert(resourceTags).values({
          name: tagName,
          slug: tagSlug,
        });
        tagId = Number(tagResult[0].insertId);
      } else {
        tagId = tag[0].id;
      }

      await db.insert(resourcePostTags).values({
        postId: id,
        tagId,
      });
    }
  }

  return { id };
}

/**
 * Get resource by slug
 */
export async function getResourceBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(resources)
    .where(eq(resources.slug, slug))
    .limit(1);

  if (result.length === 0) return null;

  const resource = result[0];

  // Get tags
  const tags = await db
    .select({
      id: resourceTags.id,
      name: resourceTags.name,
      slug: resourceTags.slug,
    })
    .from(resourcePostTags)
    .innerJoin(resourceTags, eq(resourcePostTags.tagId, resourceTags.id))
    .where(eq(resourcePostTags.postId, resource.id));

  // Get category
  let category = null;
  if (resource.categoryId) {
    const categoryResult = await db
      .select()
      .from(resourceCategories)
      .where(eq(resourceCategories.id, resource.categoryId))
      .limit(1);
    if (categoryResult.length > 0) {
      category = categoryResult[0];
    }
  }

  return {
    ...resource,
    tags,
    category,
  };
}

/**
 * List resources with pagination and filters
 */
export async function listResources(options: {
  page?: number;
  pageSize?: number;
  status?: "draft" | "published" | "archived";
  categoryId?: number;
  featured?: boolean;
  language?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const page = options.page || 1;
  const pageSize = options.pageSize || 12;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [];
  if (options.status) {
    conditions.push(eq(resources.status, options.status));
  }
  if (options.categoryId) {
    conditions.push(eq(resources.categoryId, options.categoryId));
  }
  if (options.featured !== undefined) {
    conditions.push(eq(resources.featured, options.featured ? 1 : 0));
  }
  if (options.language) {
    conditions.push(eq(resources.language, options.language));
  }
  if (options.search) {
    conditions.push(
      sql`(${resources.title} LIKE ${`%${options.search}%`} OR ${resources.excerpt} LIKE ${`%${options.search}%`})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(resources)
    .where(whereClause);
  const total = Number(countResult[0].count);

  // Get resources
  const items = await db
    .select()
    .from(resources)
    .where(whereClause)
    .orderBy(desc(resources.publishedAt), desc(resources.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(resources)
    .set({ viewCount: sql`${resources.viewCount} + 1` })
    .where(eq(resources.id, id));
}

/**
 * Get or create category
 */
export async function getOrCreateCategory(name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const slug = generateSlug(name);
  const existing = await db
    .select()
    .from(resourceCategories)
    .where(eq(resourceCategories.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(resourceCategories).values({
    name,
    slug,
    description,
  });

  return {
    id: Number(result[0].insertId),
    name,
    slug,
    description,
  };
}

/**
 * List all categories
 */
export async function listCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(resourceCategories)
    .orderBy(resourceCategories.displayOrder, resourceCategories.name);
}
