import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { writeFileSync } from "fs";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

async function exportBrand(brand, filename) {
  const [rows] = await connection.query(
    "SELECT productId, partNumber, brand, name, catalogUrl FROM products WHERE brand = ?",
    [brand]
  );
  
  const csv = ["productId,partNumber,brand,name,catalogUrl"];
  for (const row of rows) {
    csv.push([
      row.productId,
      row.partNumber || "",
      row.brand,
      `"${(row.name || "").replace(/"/g, '""')}"`,
      row.catalogUrl || ""
    ].join(","));
  }
  
  writeFileSync(filename, csv.join("\n"));
  console.log(`✅ ${brand}: ${rows.length} products → ${filename}`);
}

await exportBrand("Restek", "restek_215_products.csv");
await exportBrand("Supelco", "supelco_199_products.csv");
await exportBrand("Avantor", "avantor_83_products.csv");

await connection.end();
