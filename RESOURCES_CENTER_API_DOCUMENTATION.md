# Resources Center API Documentation

**Version**: 1.0  
**Date**: November 8, 2025  
**Status**: Phase 1 Complete - Ready for Automated Publishing

---

## 📋 Overview

The ROWELL HPLC Resources Center is now live with full API support for automated content publishing. This document provides everything needed to integrate your content creation workflow with the website.

**Base URL**: `https://rowell.manus.space/api/trpc`  
**API Type**: tRPC (Type-safe RPC)  
**Authentication**: JWT Token (Admin role required)

---

## 🔐 Authentication

### Getting Your API Token

1. **Login to ROWELL website** as an administrator
2. **Open browser DevTools** (F12)
3. **Go to Application/Storage tab** → Cookies
4. **Copy the value** of cookie named `manus_session`
5. **Use this token** in your API calls

**Token Format**: JWT string (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

**Token Expiration**: 30 days (you'll need to refresh periodically)

### Using the Token

Include the token in the `Cookie` header:

```http
Cookie: manus_session=YOUR_TOKEN_HERE
```

---

## 📝 API Endpoints

### 1. Create Article

**Endpoint**: `resources.create`  
**Method**: POST (tRPC mutation)  
**Auth**: Required (Admin only)

**Request Body**:

```typescript
{
  title: string;              // Required, max 255 chars
  content: string;            // Required, Markdown format (supports HTML)
  excerpt?: string;           // Optional, max 500 chars
  coverImage?: string;        // Optional, image URL
  authorName?: string;        // Optional, default: "ROWELL Team"
  status?: "draft" | "published" | "archived";  // Optional, default: "draft"
  language?: string;          // Optional, default: "en"
  categoryName?: string;      // Optional, will be created if doesn't exist
  tags?: string[];            // Optional, array of tag names
  featured?: boolean;         // Optional, default: false
}
```

**Response**:

```typescript
{
  success: true;
  id: number;                 // Article ID
  slug: string;               // URL-friendly slug
  url: string;                // Full article URL
}
```

**Example (using fetch)**:

```javascript
const response = await fetch('https://rowell.manus.space/api/trpc/resources.create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'manus_session=YOUR_TOKEN_HERE'
  },
  body: JSON.stringify({
    title: "How to Solve HPLC Peak Tailing Issues",
    content: `
# Peak Tailing Problem Solutions

## Video Tutorial
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

## Problem Analysis
Peak tailing is one of the most common issues in HPLC analysis...

## Solutions
1. **Check pH**: Ensure mobile phase pH is within column specifications
2. **Reduce sample load**: Overloading can cause peak distortion
3. **Check for column contamination**: Run a blank to verify

## Conclusion
By following these steps, you can effectively eliminate peak tailing...
    `,
    excerpt: "Learn how to identify and fix HPLC peak tailing problems with our comprehensive guide",
    coverImage: "https://example.com/peak-tailing-cover.jpg",
    categoryName: "Technical Articles",
    tags: ["HPLC", "Peak Tailing", "Troubleshooting"],
    status: "published",
    language: "en"
  })
});

const result = await response.json();
console.log(`Article published: ${result.url}`);
// Output: Article published: /resources/how-to-solve-hplc-peak-tailing-issues
```

---

### 2. Update Article

**Endpoint**: `resources.update`  
**Method**: POST (tRPC mutation)  
**Auth**: Required (Admin only)

**Request Body**:

```typescript
{
  id: number;                 // Required, article ID
  title?: string;             // Optional
  content?: string;           // Optional
  excerpt?: string;           // Optional
  coverImage?: string;        // Optional
  authorName?: string;        // Optional
  status?: "draft" | "published" | "archived";  // Optional
  language?: string;          // Optional
  categoryName?: string;      // Optional
  tags?: string[];            // Optional
  featured?: boolean;         // Optional
}
```

**Response**:

```typescript
{
  success: true;
  id: number;
}
```

---

### 3. Get Article by Slug

**Endpoint**: `resources.getBySlug`  
**Method**: GET (tRPC query)  
**Auth**: Not required (public)

**Request Parameters**:

```typescript
{
  slug: string;               // Required
}
```

**Response**:

```typescript
{
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  status: "draft" | "published" | "archived";
  language: string;
  categoryId: number | null;
  viewCount: number;
  featured: 0 | 1;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  } | null;
}
```

---

### 4. List Articles

**Endpoint**: `resources.list`  
**Method**: GET (tRPC query)  
**Auth**: Not required (public)

**Request Parameters**:

```typescript
{
  page?: number;              // Optional, default: 1
  pageSize?: number;          // Optional, default: 12, max: 50
  categoryId?: number;        // Optional
  featured?: boolean;         // Optional
  language?: string;          // Optional
  search?: string;            // Optional
}
```

**Response**:

```typescript
{
  items: Array<Article>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

### 5. List Categories

**Endpoint**: `resources.listCategories`  
**Method**: GET (tRPC query)  
**Auth**: Not required (public)

**Response**:

```typescript
Array<{
  id: number;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}>
```

---

## 🎯 Content Guidelines

### Markdown Format

The `content` field supports full Markdown syntax plus HTML tags:

**Supported Features**:
- Headers (`# H1`, `## H2`, etc.)
- Bold (`**text**`) and italic (`*text*`)
- Lists (ordered and unordered)
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Code blocks (` ```language `)
- Tables
- Blockquotes (`> text`)
- **HTML tags** (iframe, div, span, etc.)

### YouTube Video Embedding

To embed YouTube videos, use standard iframe code:

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

The website will automatically:
- Make videos responsive (16:9 aspect ratio)
- Add proper styling and spacing
- Enable fullscreen mode

### Images

**Cover Images**:
- Recommended size: 1200×630px
- Format: JPG or PNG
- Max file size: 2MB
- Upload to your CDN/storage first, then use the URL

**In-content Images**:
- Use Markdown syntax: `![Alt text](image-url)`
- Or HTML: `<img src="image-url" alt="Alt text" />`

### SEO Best Practices

1. **Title**: 50-60 characters, include primary keyword
2. **Excerpt**: 150-160 characters, compelling summary
3. **Content**: 1000+ words for better ranking
4. **Headers**: Use H2, H3 hierarchy properly
5. **Images**: Always include alt text
6. **Links**: Link to relevant internal pages (products, other articles)

---

## 🔧 Integration Examples

### Example 1: Simple Article Creation

```javascript
async function publishArticle(token, articleData) {
  const response = await fetch('https://rowell.manus.space/api/trpc/resources.create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `manus_session=${token}`
    },
    body: JSON.stringify(articleData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
const result = await publishArticle('YOUR_TOKEN', {
  title: "HPLC Column Selection Guide",
  content: "# Introduction\n\nChoosing the right HPLC column...",
  excerpt: "A comprehensive guide to selecting HPLC columns",
  categoryName: "Technical Articles",
  tags: ["HPLC", "Column Selection"],
  status: "published"
});

console.log(`Published: ${result.url}`);
```

### Example 2: Batch Publishing

```javascript
async function publishBatch(token, articles) {
  const results = [];
  
  for (const article of articles) {
    try {
      const result = await publishArticle(token, article);
      results.push({ success: true, ...result });
      console.log(`✓ Published: ${article.title}`);
    } catch (error) {
      results.push({ success: false, title: article.title, error: error.message });
      console.error(`✗ Failed: ${article.title} - ${error.message}`);
    }
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
```

### Example 3: Article with YouTube Video

```javascript
const articleWithVideo = {
  title: "HPLC Method Development Tutorial",
  content: `
# HPLC Method Development: Step-by-Step Guide

## Watch the Video Tutorial

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>

## Introduction

In this tutorial, we'll walk through the complete process of developing an HPLC method...

## Step 1: Define Your Goals

Before starting method development, clearly define:
- Target analytes
- Required sensitivity
- Sample matrix
- Throughput requirements

## Step 2: Select Column Chemistry

Choose the appropriate stationary phase based on:
1. Analyte polarity
2. pH stability requirements
3. Temperature limitations

[Continue with detailed steps...]

## Conclusion

By following these systematic steps, you can develop robust HPLC methods...
  `,
  excerpt: "Learn HPLC method development with our comprehensive video tutorial and step-by-step guide",
  coverImage: "https://example.com/method-dev-cover.jpg",
  categoryName: "Tutorials",
  tags: ["HPLC", "Method Development", "Tutorial", "Video"],
  status: "published",
  featured: true
};
```

---

## ⚠️ Error Handling

### Common Errors

**401 Unauthorized**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```
**Solution**: Check your token is valid and included in Cookie header

**403 Forbidden**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only admins can create resources"
  }
}
```
**Solution**: Ensure your account has admin role

**400 Bad Request**:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input: title is required"
  }
}
```
**Solution**: Check all required fields are provided and valid

**404 Not Found**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```
**Solution**: Check the slug/ID is correct

---

## 📊 Database Schema

For reference, here's the underlying database structure:

### `resources` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| slug | VARCHAR(255) | URL-friendly identifier (unique) |
| title | VARCHAR(255) | Article title |
| content | TEXT | Markdown content |
| excerpt | VARCHAR(500) | Short summary |
| coverImage | VARCHAR(500) | Cover image URL |
| authorName | VARCHAR(100) | Author name |
| status | ENUM | draft/published/archived |
| language | VARCHAR(10) | Language code (en, zh, etc.) |
| categoryId | INT | Foreign key to categories |
| viewCount | INT | Page view counter |
| featured | INT | 0 or 1 |
| publishedAt | DATETIME | Publication timestamp |
| createdAt | DATETIME | Creation timestamp |
| updatedAt | DATETIME | Last update timestamp |

### `resource_categories` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(100) | Category name |
| slug | VARCHAR(100) | URL-friendly identifier |
| description | TEXT | Category description |
| displayOrder | INT | Sort order |

### `resource_tags` Table

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(50) | Tag name |
| slug | VARCHAR(50) | URL-friendly identifier |

---

## 🚀 Quick Start Checklist

- [ ] Get admin account credentials
- [ ] Login to website and copy session token
- [ ] Test API with a draft article
- [ ] Verify article appears in resources center
- [ ] Test YouTube video embedding
- [ ] Publish first production article
- [ ] Set up automated publishing workflow

---

## 📞 Support

**Questions or Issues?**
- Technical issues: Contact ROWELL HPLC Website Engineering Team
- Content strategy: Contact ROWELL HPLC Social Media Team

**Website URL**: https://rowell.manus.space  
**Resources Center**: https://rowell.manus.space/resources

---

## 📝 Changelog

**Version 1.0** (November 8, 2025)
- Initial release
- Core CRUD operations
- Markdown rendering with YouTube support
- Category and tag management
- Public listing and detail pages

**Upcoming Features** (Phase 2):
- Admin CMS interface
- Rich text editor
- Image upload integration
- SEO optimization (meta tags, sitemap)
- Social sharing buttons
- Search functionality

---

**Document Status**: ✅ Ready for Production Use  
**Last Updated**: November 8, 2025  
**Next Review**: After Phase 2 completion
