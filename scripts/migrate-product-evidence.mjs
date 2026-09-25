import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const batchPath = new URL("./product-evidence-batch-2026-09-25.json", import.meta.url);
const batch = JSON.parse(await fs.readFile(batchPath, "utf8"));
const records = batch.records;

if (batch.namespace !== "products" || batch.excluded_namespaces.includes("standards_products")) {
  throw new Error("batch_scope_invalid");
}
if (records.length !== 59 || batch.approved_record_count !== 59) {
  throw new Error(`batch_record_count_invalid:${records.length}`);
}
if (new Set(records.map((record) => record.slug)).size !== records.length) {
  throw new Error("batch_duplicate_slug");
}
for (const record of records) {
  if (!record.slug || !record.brand || !record.part_number) {
    throw new Error(`batch_identity_incomplete:${record.slug ?? "unknown"}`);
  }
  const values = record.values ?? {};
  for (const field of [
    "manufacturer_part_number",
    "pore_size",
    "carbon_load",
    "ph_range",
    "usp_code",
  ]) {
    if (!(field in values)) {
      throw new Error(`batch_field_missing:${record.slug}:${field}`);
    }
  }
}

const dbUrl = new URL(process.env.DATABASE_URL);
const sslParam = dbUrl.searchParams.get("ssl");
dbUrl.searchParams.delete("ssl");
const connectionConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: decodeURIComponent(dbUrl.pathname.slice(1)),
};
if (sslParam) {
  connectionConfig.ssl =
    sslParam === "true" ? { rejectUnauthorized: true } : JSON.parse(sslParam);
}

const connection = await mysql.createConnection(connectionConfig);
let transactionStarted = false;
try {
  const [databaseRows] = await connection.query("SELECT DATABASE() AS name");
  const database = databaseRows[0];
  if (!database?.name) throw new Error("database_name_unavailable");

  const [existingRows] = await connection.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME IN ('manufacturer_part_number', 'carbon_load', 'usp_code')`,
    [database.name],
  );
  const existing = new Set(existingRows.map((row) => row.COLUMN_NAME));
  const columns = {
    manufacturer_part_number: "varchar(255) NULL",
    carbon_load: "varchar(64) NULL",
    usp_code: "varchar(64) NULL",
  };
  for (const [name, definition] of Object.entries(columns)) {
    if (!existing.has(name)) {
      await connection.query(`ALTER TABLE products ADD COLUMN \`${name}\` ${definition}`);
    }
  }

  await connection.beginTransaction();
  transactionStarted = true;
  const locked = [];
  for (const record of records) {
    const [rows] = await connection.query(
      `SELECT id, slug, partNumber, brand, status
         FROM products
        WHERE slug = ? AND partNumber = ? AND brand = ? AND status = 'active'
        LIMIT 2
        FOR UPDATE`,
      [record.slug, record.part_number, record.brand],
    );
    if (rows.length !== 1) {
      throw new Error(`product_identity_mismatch:${record.slug}:${rows.length}`);
    }
    locked.push({ record, row: rows[0] });
  }
  if (locked.length !== 59) throw new Error(`locked_record_count_invalid:${locked.length}`);

  for (const { record, row } of locked) {
    const value = record.values;
    await connection.query(
      `UPDATE products
          SET manufacturer_part_number = ?,
              poreSize = ?,
              carbon_load = ?,
              phRange = ?,
              usp_code = ?
        WHERE id = ?`,
      [
        value.manufacturer_part_number,
        value.pore_size,
        value.carbon_load,
        value.ph_range,
        value.usp_code,
        row.id,
      ],
    );
  }

  await connection.commit();
  transactionStarted = false;
  console.log(
    `product_evidence_migration=completed batch=${batch.batch_id} records=${locked.length} namespace=products`,
  );
} catch (error) {
  if (transactionStarted) {
    try {
      await connection.rollback();
    } catch {
      // Preserve the original failure if rollback itself fails.
    }
  }
  console.error("product_evidence_migration=failed", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
