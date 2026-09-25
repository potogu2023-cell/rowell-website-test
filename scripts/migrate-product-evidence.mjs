import mysql from "mysql2/promise";

const target = {
  slug: "227-32015-01",
  partNumber: "227-32015-01",
  brand: "Shimadzu",
  values: {
    manufacturer_part_number: "227-32015-01",
    carbon_load: "7%",
    usp_code: "USP L11",
    pore_size: "90 Å",
    ph_range: "1.5-8.0",
  },
};

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

try {
  const [databaseRows] = await connection.query("SELECT DATABASE() AS name");
  const database = databaseRows[0];
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
  const [rows] = await connection.query(
    `SELECT id, partNumber, brand
       FROM products
      WHERE slug = ? AND partNumber = ? AND brand = ? AND status = 'active'
      LIMIT 2
      FOR UPDATE`,
    [target.slug, target.partNumber, target.brand],
  );
  if (rows.length !== 1) {
    throw new Error(`product_identity_mismatch:${rows.length}`);
  }

  const value = target.values;
  await connection.query(
    `UPDATE products
        SET manufacturer_part_number = ?,
            pore_size = ?,
            carbon_load = ?,
            ph_range = ?,
            usp_code = ?
      WHERE id = ?`,
    [
      value.manufacturer_part_number,
      value.pore_size,
      value.carbon_load,
      value.ph_range,
      value.usp_code,
      rows[0].id,
    ],
  );
  await connection.commit();
  console.log("product_evidence_migration=completed target=227-32015-01");
} catch (error) {
  try {
    await connection.rollback();
  } catch {
    // DDL may have committed independently; preserve the original failure.
  }
  console.error("product_evidence_migration=failed", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
