# Articles Directory

This directory contains all Learning Center articles in Markdown format.

## How to Add Articles

1. Create a new  file in this directory
2. Use the required YAML frontmatter format (see below)
3. Commit and push to GitHub
4. Render will automatically deploy and import the article

## Required YAML Frontmatter Format

```yaml
---
title: "Article Title in English"
author_slug: rowell-hplc-team
category: technical-guides  # or application-notes, industry-trends, literature-reviews
application_area: pharmaceutical  # or environmental, food-safety, biopharmaceutical, clinical, chemical
slug: unique-article-slug
published_date: '2025-11-20'  # Recommended: set to past date
meta_description: "SEO description (50-160 characters)"
keywords: "keyword1, keyword2, keyword3"
---

## Article Content in English

Your article content here...
```

## Language Policy

⚠️ **CRITICAL**: All articles MUST be in English. Chinese content will be automatically rejected.

## Valid Values

**Category**:
- `application-notes`
- `technical-guides`
- `industry-trends`
- `literature-reviews`

**Application Area**:
- `pharmaceutical`
- `environmental`
- `food-safety`
- `biopharmaceutical`
- `clinical`
- `chemical`

