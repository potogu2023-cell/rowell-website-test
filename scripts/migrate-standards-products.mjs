import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const BATCH_DIR = new URL("../generated/standards-products-remaining-2026-09-26/", import.meta.url);
const BATCH_NAME = /^standards-products-batch-2026-09-26-remaining-(\d+)-(\d+)\.json$/;
const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

function validateBatch(batch, filename) {
  if (batch.namespace !== "standards_products" || !batch.excluded_namespaces?.includes("products")) {
    throw new Error(`standards_batch_scope_invalid:${filename}`);
  }
  if (batch.source_record_count !== 500 && batch.source_record_end !== 20505) {
    throw new Error(`standards_batch_window_invalid:${filename}`);
  }
  if (batch.approved_record_count !== batch.records.length) {
    throw new Error(`standards_batch_record_count_invalid:${filename}:${batch.records.length}`);
  }
  const seen = new Set();
  for (const r of batch.records) {
    if (!r.part_number || !r.name_en || !r.specification) {
      throw new Error(`standards_identity_incomplete:${filename}:${r.part_number ?? "unknown"}`);
    }
    if (seen.has(r.part_number)) throw new Error(`standards_batch_duplicate_part_number:${filename}:${r.part_number}`);
    seen.add(r.part_number);
    if (r.brand !== "ANPEL" || r.status !== "active" || r.slug !== r.part_number) {
      throw new Error(`standards_identity_policy_invalid:${filename}:${r.part_number}`);
    }
    if (r.cas_number && !CAS_RE.test(r.cas_number)) {
      throw new Error(`standards_cas_invalid:${filename}:${r.part_number}`);
    }
  }
}

async function getBatchFiles() {
  const names = await fs.readdir(BATCH_DIR);
  return names
    .filter((name) => BATCH_NAME.test(name))
    .sort((a, b) => Number(a.match(BATCH_NAME)[1]) - Number(b.match(BATCH_NAME)[1]));
}

function dbConfig() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const sslParam = dbUrl.searchParams.get("ssl");
  dbUrl.searchParams.delete("ssl");
  const config = {
    host: dbUrl.hostname,
    port: dbUrl.port ? Number(dbUrl.port) : 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: decodeURIComponent(dbUrl.pathname.slice(1)),
  };
  if (sslParam) config.ssl = sslParam === "true" ? { rejectUnauthorized: true } : JSON.parse(sslParam);
  return config;
}

export async function runStandardsProductsMigration() {
  const files = await getBatchFiles();
  if (files.length !== 34) throw new Error(`standards_batch_file_count_invalid:${files.length}`);

  const connection = await mysql.createConnection(dbConfig());
  let total = 0;
  try {
    const [dbRows] = await connection.query("SELECT DATABASE() AS name");
    const database = dbRows[0]?.name;
    if (!database) throw new Error("database_name_unavailable");
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'standards_products'",
      [database],
    );
    if (tables.length !== 1) throw new Error("standards_products_table_missing");

    for (const filename of files) {
      const match = filename.match(BATCH_NAME);
      const batch = JSON.parse(await fs.readFile(new URL(filename, BATCH_DIR), "utf8"));
      validateBatch(batch, filename);
      let tx = false;
      try {
        await connection.beginTransaction();
        tx = true;
        for (const r of batch.records) {
          const [rows] = await connection.query(
            "SELECT id FROM standards_products WHERE part_number = ? LIMIT 2 FOR UPDATE",
            [r.part_number],
          );
          if (rows.length > 1) throw new Error(`standards_identity_duplicate:${r.part_number}`);
          if (rows.length === 1) {
            await connection.query(
              "UPDATE standards_products SET name_en = ?, name_cn = ?, cas_number = ?, specification = ?, brand = ?, status = ?, slug = ? WHERE id = ?",
              [r.name_en, r.name_cn, r.cas_number, r.specification, r.brand, r.status, r.slug, rows[0].id],
            );
          } else {
            await connection.query(
              "INSERT INTO standards_products (part_number, name_en, name_cn, cas_number, specification, brand, status, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [r.part_number, r.name_en, r.name_cn, r.cas_number, r.specification, r.brand, r.status, r.slug],
            );
          }
        }
        await connection.commit();
        tx = false;
      } catch (error) {
        if (tx) {
          try { await connection.rollback(); } catch {}
        }
        throw new Error(`standards_batch_failed:${filename}:${error.message}`);
      }
      total += batch.records.length;
      console.log(`standards_products_batch=committed range=${match[1]}-${match[2]} records=${batch.records.length} namespace=standards_products products_updates=0`);
      // batch is scoped to this loop iteration and becomes collectible before the next file.
    }
    if (total !== 16703) throw new Error(`standards_total_invalid:${total}`);
    console.log(`standards_products_migration=completed batches=${files.length} records=${total} namespace=standards_products products_updates=0`);
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await runStandardsProductsMigration();
