import { getDb } from "./server/db";

async function exportProducts() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    return;
  }

  const { products } = await import("./drizzle/schema");
  
  console.log("Exporting all products...");
  
  const allProducts = await db
    .select({
      productId: products.productId,
      partNumber: products.partNumber,
      brand: products.brand,
      name: products.name,
      imageUrl: products.imageUrl,
      catalogUrl: products.catalogUrl,
      description: products.description,
    })
    .from(products)
    .orderBy(products.brand, products.productId);
  
  console.log(`Total products: ${allProducts.length}`);
  
  // Generate CSV
  const fs = await import("fs");
  const csvHeader = "productId,partNumber,brand,name,currentImageUrl,currentCatalogUrl,hasDescription\n";
  const csvRows = allProducts.map(p => {
    const hasImage = p.imageUrl ? "yes" : "no";
    const hasCatalog = p.catalogUrl ? "yes" : "no";
    const hasDesc = p.description && p.description.length > 50 ? "yes" : "no";
    return `"${p.productId}","${p.partNumber}","${p.brand}","${p.name || ''}","${hasImage}","${hasCatalog}","${hasDesc}"`;
  }).join("\n");
  
  fs.writeFileSync("/home/ubuntu/Downloads/products-crawler-list.csv", csvHeader + csvRows);
  console.log("CSV file generated: /home/ubuntu/Downloads/products-crawler-list.csv");
  
  // Generate statistics
  const stats: Record<string, { total: number; hasImage: number; hasCatalog: number; hasDesc: number }> = {};
  
  allProducts.forEach(p => {
    if (!stats[p.brand]) {
      stats[p.brand] = { total: 0, hasImage: 0, hasCatalog: 0, hasDesc: 0 };
    }
    stats[p.brand].total++;
    if (p.imageUrl) stats[p.brand].hasImage++;
    if (p.catalogUrl) stats[p.brand].hasCatalog++;
    if (p.description && p.description.length > 50) stats[p.brand].hasDesc++;
  });
  
  console.log("\n=== Statistics by Brand ===");
  Object.entries(stats).forEach(([brand, stat]) => {
    const imagePercent = ((stat.hasImage / stat.total) * 100).toFixed(1);
    const catalogPercent = ((stat.hasCatalog / stat.total) * 100).toFixed(1);
    const descPercent = ((stat.hasDesc / stat.total) * 100).toFixed(1);
    console.log(`${brand}: ${stat.total} products | Image: ${imagePercent}% | Catalog: ${catalogPercent}% | Desc: ${descPercent}%`);
  });
  
  process.exit(0);
}

exportProducts();
