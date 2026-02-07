import { db } from "../db";
import { sql } from "drizzle-orm";

export async function addMultilingualCategories() {
  console.log("Adding multilingual fields to categories table...");

  // Add multilingual columns
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ja VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_es VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_pt VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ko VARCHAR(255)`);
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255)`);

  console.log("Multilingual columns added successfully");

  // Update translations
  const translations = [
    // Level 1 categories
    { slug: 'hplc-columns', en: 'HPLC Columns', ja: 'HPLCカラム', es: 'Columnas HPLC', pt: 'Colunas HPLC', ar: 'أعمدة HPLC', ko: 'HPLC 컬럼', ru: 'Колонки ВЭЖХ' },
    { slug: 'sample-preparation', en: 'Sample Preparation', ja: 'サンプル前処理', es: 'Preparación de Muestras', pt: 'Preparação de Amostras', ar: 'تحضير العينات', ko: '샘플 전처리', ru: 'Подготовка образцов' },
    { slug: 'accessories', en: 'Accessories', ja: 'アクセサリー', es: 'Accesorios', pt: 'Acessórios', ar: 'الملحقات', ko: '액세서리', ru: 'Аксессуары' },
    
    // Level 2 categories
    { slug: 'c18-columns', en: 'C18 Columns', ja: 'C18カラム', es: 'Columnas C18', pt: 'Colunas C18', ar: 'أعمدة C18', ko: 'C18 컬럼', ru: 'Колонки C18' },
    { slug: 'c8-columns', en: 'C8 Columns', ja: 'C8カラム', es: 'Columnas C8', pt: 'Colunas C8', ar: 'أعمدة C8', ko: 'C8 컬럼', ru: 'Колонки C8' },
    { slug: 'silica-columns', en: 'Silica Columns', ja: 'シリカカラム', es: 'Columnas de Sílice', pt: 'Colunas de Sílica', ar: 'أعمدة السيليكا', ko: '실리카 컬럼', ru: 'Силикагелевые колонки' },
    { slug: 'phenyl-columns', en: 'Phenyl Columns', ja: 'フェニルカラム', es: 'Columnas Fenilo', pt: 'Colunas Fenil', ar: 'أعمدة الفينيل', ko: '페닐 컬럼', ru: 'Фенильные колонки' },
    { slug: 'hilic-columns', en: 'HILIC Columns', ja: 'HILICカラム', es: 'Columnas HILIC', pt: 'Colunas HILIC', ar: 'أعمدة HILIC', ko: 'HILIC 컬럼', ru: 'HILIC колонки' },
    { slug: 'cyano-columns', en: 'Cyano Columns', ja: 'シアノカラム', es: 'Columnas Ciano', pt: 'Colunas Ciano', ar: 'أعمدة السيانو', ko: '시아노 컬럼', ru: 'Цианопропильные колонки' },
    { slug: 'c4-columns', en: 'C4 Columns', ja: 'C4カラム', es: 'Columnas C4', pt: 'Colunas C4', ar: 'أعمدة C4', ko: 'C4 컬럼', ru: 'Колонки C4' },
    { slug: 'pfp-columns', en: 'PFP Columns', ja: 'PFPカラム', es: 'Columnas PFP', pt: 'Colunas PFP', ar: 'أعمدة PFP', ko: 'PFP 컬럼', ru: 'PFP колонки' },
    { slug: 'amino-columns', en: 'Amino Columns', ja: 'アミノカラム', es: 'Columnas Amino', pt: 'Colunas Amino', ar: 'أعمدة الأمينو', ko: '아미노 컬럼', ru: 'Аминопропильные колонки' },
    { slug: 'diol-columns', en: 'Diol Columns', ja: 'ジオールカラム', es: 'Columnas Diol', pt: 'Colunas Diol', ar: 'أعمدة الديول', ko: '디올 컬럼', ru: 'Диольные колонки' },
    { slug: 'c30-columns', en: 'C30 Columns', ja: 'C30カラム', es: 'Columnas C30', pt: 'Colunas C30', ar: 'أعمدة C30', ko: 'C30 컬럼', ru: 'Колонки C30' },
    { slug: 'other-columns', en: 'Other Columns', ja: 'その他のカラム', es: 'Otras Columnas', pt: 'Outras Colunas', ar: 'أعمدة أخرى', ko: '기타 컬럼', ru: 'Другие колонки' },
  ];

  for (const t of translations) {
    await db.execute(sql`
      UPDATE categories 
      SET name_en = ${t.en}, 
          name_ja = ${t.ja}, 
          name_es = ${t.es}, 
          name_pt = ${t.pt}, 
          name_ar = ${t.ar}, 
          name_ko = ${t.ko}, 
          name_ru = ${t.ru}
      WHERE slug = ${t.slug}
    `);
    console.log(`Updated translations for ${t.slug}`);
  }

  console.log("All translations updated successfully!");
}

// Run migration if this file is executed directly
if (require.main === module) {
  addMultilingualCategories()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
