import fs from "node:fs/promises";
import mysql from "mysql2/promise";

export async function runStandardsProductsMigration() {
  const batch = JSON.parse(await fs.readFile(new URL("./standards-products-batch-2026-09-26-wave7.json", import.meta.url), "utf8"));
  const records = batch.records;
  if (batch.namespace !== "standards_products" || !batch.excluded_namespaces?.includes("products")) throw new Error("standards_batch_scope_invalid");
  if (records.length !== 500 || batch.approved_record_count !== 500) throw new Error(`standards_batch_record_count_invalid:${records.length}`);
  if (new Set(records.map((r) => r.part_number)).size !== records.length) throw new Error("standards_batch_duplicate_part_number");
  for (const r of records) {
    if (!r.part_number || !r.name_en || !r.specification) throw new Error(`standards_identity_incomplete:${r.part_number ?? "unknown"}`);
    if (r.cas_number && !/^\d{2,7}-\d{2}-\d$/.test(r.cas_number)) throw new Error(`standards_cas_invalid:${r.part_number}`);
  }
  const dbUrl = new URL(process.env.DATABASE_URL); const sslParam = dbUrl.searchParams.get("ssl"); dbUrl.searchParams.delete("ssl");
  const config = { host: dbUrl.hostname, port: dbUrl.port ? Number(dbUrl.port) : 3306, user: decodeURIComponent(dbUrl.username), password: decodeURIComponent(dbUrl.password), database: decodeURIComponent(dbUrl.pathname.slice(1)) };
  if (sslParam) config.ssl = sslParam === "true" ? { rejectUnauthorized: true } : JSON.parse(sslParam);
  const connection = await mysql.createConnection(config); let tx = false;
  try {
    const [dbRows] = await connection.query("SELECT DATABASE() AS name"); const database = dbRows[0]?.name; if (!database) throw new Error("database_name_unavailable");
    const [tables] = await connection.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'standards_products'", [database]);
    if (tables.length !== 1) throw new Error("standards_products_table_missing");
    await connection.beginTransaction(); tx = true;
    for (const r of records) {
      const [rows] = await connection.query("SELECT id FROM standards_products WHERE part_number = ? LIMIT 2 FOR UPDATE", [r.part_number]);
      if (rows.length > 1) throw new Error(`standards_identity_duplicate:${r.part_number}`);
      if (rows.length === 1) {
        await connection.query("UPDATE standards_products SET name_en = ?, name_cn = ?, cas_number = ?, specification = ?, brand = ?, status = ?, slug = ? WHERE id = ?", [r.name_en, r.name_cn, r.cas_number, r.specification, r.brand, r.status, r.slug, rows[0].id]);
      } else {
        await connection.query("INSERT INTO standards_products (part_number, name_en, name_cn, cas_number, specification, brand, status, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [r.part_number, r.name_en, r.name_cn, r.cas_number, r.specification, r.brand, r.status, r.slug]);
      }
    }
    await connection.commit(); tx = false;
    console.log(`standards_products_migration=completed batch=${batch.batch_id} records=${records.length} namespace=standards_products products_updates=0`);
  } catch (error) {
    if (tx) try { await connection.rollback(); } catch {}
    console.error("standards_products_migration=failed", error.message); process.exitCode = 1;
  } finally { await connection.end(); }
}

if (import.meta.url === `file://${process.argv[1]}`) await runStandardsProductsMigration();
