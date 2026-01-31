# Resource Center Articles Import Guide

This guide explains how to import the 20 professional HPLC articles into the database.

## Method 1: Automatic Import via Script (Recommended)

We've created an automated script that will import all 20 articles into the database.

### On Render (Production):

1. Open the Render Shell for your web service
2. Run the following command:
   ```bash
   pnpm seed:resources
   ```

### Locally (if you have DATABASE_URL):

```bash
export DATABASE_URL="your_database_url_here"
pnpm seed:resources
```

## Method 2: Manual SQL Import

If you prefer to use the SQL file directly:

```bash
psql $DATABASE_URL < drizzle/import_resources.sql
```

## What Gets Imported

The script will import 20 articles across 3 categories:

### Technical Guides (7 articles)
1. HPLC Method Development: A Step-by-Step Guide for Beginners
2. Troubleshooting Common HPLC Peak Issues
3. How to Select the Right HPLC Column for Your Application
4. Sample Preparation Techniques for HPLC Analysis
5. A Practical Guide to Mobile Phase Optimization in HPLC
6. A Practical Guide to HPLC System Maintenance and Care
7. A Practical Guide to HPLC Column Selection

### Application Notes (7 articles)
1. Pharmaceutical Analysis: Assay of Active Ingredients in Tablets
2. Food Safety: Detection of Pesticide Residues in Vegetables
3. Environmental Analysis: Determination of Heavy Metals in Water
4. Petrochemical Analysis: Determination of Antioxidant Additives in Gasoline
5. Clinical Diagnostics: Analysis of Vitamin D in Human Serum
6. Nutraceuticals: Analysis of Curcuminoids in Turmeric Supplements
7. Food Analysis: Determination of Artificial Sweeteners in Beverages

### Industry Insights (6 articles)
1. The Rise of Biopharmaceuticals and the Indispensable Role of HPLC
2. Emerging Trends in HPLC Technology
3. The Impact of AI on Chromatography Data Analysis
4. HPLC in Forensic Science
5. Pharma 4.0: The Future of Pharmaceutical Quality Control
6. HPLC in Cannabis Testing

## Verification

After import, you can verify the articles are loaded by:

1. Visiting https://www.rowellhplc.com/resources
2. You should see all 20 articles displayed
3. Featured articles (3 total) will be highlighted

## Troubleshooting

If the import fails:

1. **Check DATABASE_URL**: Ensure the environment variable is set correctly
2. **Check file paths**: Ensure all article markdown files are in `resource_center_articles/` directory
3. **Check database connection**: Verify you can connect to the database
4. **Check logs**: Look for error messages in the console output

## Notes

- All articles are published in **English only** (as per content strategy)
- Publication dates are distributed across 2025-2026 to create a sense of history
- 3 articles are marked as "featured" for homepage display
- All articles include proper tags for categorization and SEO
