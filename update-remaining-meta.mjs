import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

// Correct slugs with meta descriptions
const updates = [
  {
    slug: "picos-fantasma-en-hplc-identificacin-rastreo-de-origen-y-mtodos-de-eliminacin",
    metaDescription: "Identifique y elimine picos fantasma en HPLC. Causas comunes, pasos de diagnóstico, estrategias de prevención de expertos ROWELL."
  },
  {
    slug: "est-inestable-su-lnea-base-una-gua-sistemtica-para-la-resolucin-de-problemas-de-ruido-y-deriva-en-la-lnea-base-de-hplc",
    metaDescription: "Solucione inestabilidad de línea base en HPLC. Comprenda causas, métodos de diagnóstico, soluciones para cromatogramas estables."
  },
  {
    slug: "despidindose-de-los-picos-con-cola-estrategias-avanzadas-de-optimizacin-de-la-forma-del-pico-para-compuestos-bsicos",
    metaDescription: "Elimine picos con cola en HPLC con soluciones probadas. Comprenda causas, optimice fase móvil, mejore forma de pico con guía de ROWELL."
  },
  {
    slug: "velocidad-y-rendimiento-el-duelo-definitivo-entre-columnas-de-partculas-totalmente-porosas-fpp-y-partculas-superficialmente-porosas-spp",
    metaDescription: "Compare columnas FPP y SPP para HPLC. Comprenda tecnología de partículas, diferencias de rendimiento, elija columna para su aplicación."
  },
  {
    slug: "la-batalla-por-la-forma-del-pico-cuidado-con-los-efectos-extra-columna-que-roban-tu-resolucin",
    metaDescription: "Domine la optimización de forma de pico en HPLC. Cómo calidad de columna, fase móvil y parámetros afectan simetría. Consejos de ROWELL."
  },
  {
    slug: "la-batalla-seal-ruido-5-consejos-para-aumentar-la-sensibilidad-de-deteccin-en-hplc-sin-sacrificar-la-resolucin",
    metaDescription: "Aumente sensibilidad de detección HPLC sin perder resolución. 5 consejos probados para mejorar relación señal-ruido de expertos ROWELL."
  },
  {
    slug: "proshanie-s-hvostami-pikov-prodvinutye-strategii-optimizacii-formy-pikov-dlya-osnovnyh-soedinenij",
    metaDescription: "Устраните хвостовые пики в ВЭЖХ с помощью проверенных решений. Причины, оптимизация подвижной фазы, советы от ROWELL."
  },
  {
    slug: "fpp-spp",
    metaDescription: "Сравнение колонок FPP и SPP для ВЭЖХ. Технология частиц, различия в производительности, выбор колонки для вашего применения."
  },
  {
    slug: "borba-za-formu-pika-osteregajtes-vnekolonochnyh-effektov-kotorye-kradut-vashe-razreshenie",
    metaDescription: "Оптимизация формы пика в ВЭЖХ. Влияние качества колонки, подвижной фазы и параметров системы. Экспертные советы ROWELL."
  },
  {
    slug: "borba-signal-shum-5-sovetov-po-povysheniyu-chuvstvitelnosti-detekcii-v-vezhh-bez-poteri-razreshayushej-sposobnosti",
    metaDescription: "Повышение чувствительности детекции в ВЭЖХ без потери разрешения. 5 проверенных советов от аналитических экспертов ROWELL."
  },
  {
    slug: "razdelenie-pikov-v-vezhh-diagnostika-i-okonchatelnye-resheniya-1",
    metaDescription: "Узнайте, как диагностировать и устранить разделение пиков в ВЭЖХ. Физические и химические причины, методы устранения от экспертов ROWELL."
  }
];

async function updateMetaDescriptions() {
  console.log("Updating remaining meta descriptions...\n");
  
  let successCount = 0;
  
  for (const { slug, metaDescription } of updates) {
    try {
      await db.update(resources)
        .set({ metaDescription })
        .where(eq(resources.slug, slug));
      
      console.log(`✅ Updated: ${slug.substring(0, 70)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${slug}:`, error.message);
    }
  }
  
  console.log(`\n✅ Successfully updated ${successCount}/${updates.length} articles`);
}

updateMetaDescriptions().catch(console.error);
