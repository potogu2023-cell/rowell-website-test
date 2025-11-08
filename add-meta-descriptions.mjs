import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";
import "dotenv/config";

const db = drizzle(process.env.DATABASE_URL);

// Meta descriptions for each article (from SEO guide)
const metaDescriptions = {
  // English articles
  "peak-splitting-in-hplc-diagnosis-and-ultimate-solutions": 
    "Learn how to diagnose and fix peak splitting in HPLC. Discover physical and chemical causes, troubleshooting steps, and ultimate solutions from ROWELL experts.",
  
  "saying-goodbye-to-tailing-peaks-advanced-peak-shape-optimization-strategies-for-basic-compounds":
    "Eliminate tailing peaks in HPLC with proven solutions. Understand causes, optimize mobile phase, and improve peak shape with ROWELL's expert guidance.",
  
  "the-battle-for-peak-shape-beware-of-the-extra-column-effects-that-steal-your-resolution":
    "Master peak shape optimization in HPLC. Learn how column quality, mobile phase, and system parameters affect peak symmetry. Expert tips from ROWELL.",
  
  "application-case-study-a-complete-analytical-method-for-related-substances-in-atorvastatin":
    "Discover how ROWELL HPLC columns improved atorvastatin analysis. Real-world case study with method optimization, results, and ROI analysis.",
  
  "ghost-peaks-in-hplc-identification-source-tracking-and-elimination-methods":
    "Identify and eliminate ghost peaks in HPLC. Learn common causes, diagnostic steps, and prevention strategies from ROWELL chromatography experts.",
  
  "is-your-baseline-unstable-a-systematic-troubleshooting-guide-for-hplc-baseline-noise-and-drift":
    "Troubleshoot baseline instability in HPLC. Understand causes, diagnostic methods, and solutions to achieve stable, reproducible chromatograms.",
  
  "the-signal-to-noise-battle-5-tips-to-increase-hplc-detection-sensitivity-without-sacrificing-resolution":
    "Boost HPLC detection sensitivity without losing resolution. 5 proven tips to improve signal-to-noise ratio from ROWELL analytical experts.",
  
  "speed-and-performance-the-ultimate-showdown-between-fully-porous-particle-fpp-and-superficially-porous-particle-spp-columns":
    "Compare FPP and SPP HPLC columns. Understand particle technology, performance differences, and choose the right column for your application.",
  
  "beyond-the-initial-cost-how-to-calculate-the-roi-of-upgrading-to-high-efficiency-hplc-columns":
    "Calculate the true ROI of upgrading HPLC columns. Learn how to evaluate total cost of ownership, productivity gains, and long-term savings.",
  
  "industry-outlook-how-artificial-intelligence-ai-will-reshape-the-future-of-the-analytical-laboratory":
    "Explore how AI will reshape analytical laboratories. Discover AI applications in HPLC, method development, and quality control. Future insights from ROWELL.",
  
  // Russian articles
  "razdelenie-pikov-v-vezhh-diagnostika-i-okonchatelnye-resheniya":
    "Узнайте, как диагностировать и устранить разделение пиков в ВЭЖХ. Физические и химические причины, методы устранения от экспертов ROWELL.",
  
  "proshanie-s-hvostovymi-pikami-peredovye-strategii-optimizacii-formy-pika-dlya-osnovnyh-soedinenij":
    "Устраните хвостовые пики в ВЭЖХ с помощью проверенных решений. Причины, оптимизация подвижной фазы, советы от ROWELL.",
  
  "bitva-za-formu-pika-osterezhtes-effektov-vne-kolonki-kotorye-kradut-vashe-razreshenie":
    "Оптимизация формы пика в ВЭЖХ. Влияние качества колонки, подвижной фазы и параметров системы. Экспертные советы ROWELL.",
  
  "primer-primeneniya-polnyj-analiticheskij-metod-opredeleniya-rodstvennyh-veshestv-v-atorvastatine":
    "Как колонки ROWELL улучшили анализ аторвастатина. Реальный кейс с оптимизацией метода, результатами и анализом ROI.",
  
  "prizrachnye-piki-v-vezhh-identifikaciya-otslezhivanie-istochnika-i-metody-ustraneniya":
    "Выявление и устранение призрачных пиков в ВЭЖХ. Распространённые причины, диагностика, профилактика от экспертов ROWELL.",
  
  "vasha-bazovaya-liniya-nestabilna-sistematicheskoe-rukovodstvo-po-ustraneniyu-shuma-i-drejfa-bazovoj-linii-v-vezhh":
    "Устранение нестабильности базовой линии в ВЭЖХ. Причины, методы диагностики, решения для стабильных хроматограмм.",
  
  "borba-signal-shum-5-sovetov-po-uvelicheniyu-chuvstvitelnosti-detektirovaniya-v-vezhh-bez-poteri-razresheniya":
    "Повышение чувствительности детекции в ВЭЖХ без потери разрешения. 5 проверенных советов от аналитических экспертов ROWELL.",
  
  "skorost-i-proizvoditelnost-okonchatelnoe-protivoborstvo-mezhdu-kolonkami-s-polnostyu-poristymi-chasticami-fpp-i-poverhnostno-poristymi-chasticami-spp":
    "Сравнение колонок FPP и SPP для ВЭЖХ. Технология частиц, различия в производительности, выбор колонки для вашего применения.",
  
  "roi":
    "Расчёт реальной окупаемости обновления колонок ВЭЖХ. Оценка совокупной стоимости владения, прироста производительности, экономии.",
  
  "otraslevoj-prognoz-kak-iskusstvennyj-intellekt-ii-izmenit-budushee-analiticheskoj-laboratorii":
    "Как ИИ изменит аналитические лаборатории. Применение ИИ в ВЭЖХ, разработке методов, контроле качества. Прогнозы от ROWELL.",
  
  // Spanish articles
  "divisin-de-pico-en-hplc-diagnstico-y-soluciones-definitivas":
    "Aprenda a diagnosticar y solucionar la división de picos en HPLC. Causas físicas y químicas, pasos de solución de problemas de expertos ROWELL.",
  
  "despidindose-de-los-picos-con-cola-estrategias-avanzadas-de-optimizacin-de-forma-de-pico-para-compuestos-bsicos":
    "Elimine picos con cola en HPLC con soluciones probadas. Comprenda causas, optimice fase móvil, mejore forma de pico con guía de ROWELL.",
  
  "la-batalla-por-la-forma-del-pico-cuidado-con-los-efectos-extra-columna-que-roban-su-resolucin":
    "Domine la optimización de forma de pico en HPLC. Cómo calidad de columna, fase móvil y parámetros afectan simetría. Consejos de ROWELL.",
  
  "estudio-de-caso-de-aplicacin-un-mtodo-analtico-completo-para-sustancias-relacionadas-en-atorvastatina":
    "Descubra cómo columnas ROWELL mejoraron análisis de atorvastatina. Caso real con optimización de método, resultados y análisis ROI.",
  
  "picos-fantasma-en-hplc-identificacin-seguimiento-de-fuente-y-mtodos-de-eliminacin":
    "Identifique y elimine picos fantasma en HPLC. Causas comunes, pasos de diagnóstico, estrategias de prevención de expertos ROWELL.",
  
  "est-inestable-su-lnea-base-una-gua-sistemtica-de-solucin-de-problemas-para-el-ruido-y-la-deriva-de-la-lnea-base-de-hplc":
    "Solucione inestabilidad de línea base en HPLC. Comprenda causas, métodos de diagnóstico, soluciones para cromatogramas estables.",
  
  "la-batalla-seal-ruido-5-consejos-para-aumentar-la-sensibilidad-de-deteccin-de-hplc-sin-sacrificar-la-resolucin":
    "Aumente sensibilidad de detección HPLC sin perder resolución. 5 consejos probados para mejorar relación señal-ruido de expertos ROWELL.",
  
  "velocidad-y-rendimiento-el-enfrentamiento-definitivo-entre-columnas-de-partculas-totalmente-porosas-fpp-y-partculas-superficialmente-porosas-spp":
    "Compare columnas FPP y SPP para HPLC. Comprenda tecnología de partículas, diferencias de rendimiento, elija columna para su aplicación.",
  
  "ms-all-del-costo-inicial-cmo-calcular-el-roi-de-actualizar-a-columnas-hplc-de-alta-eficiencia":
    "Calcule el ROI real de actualizar columnas HPLC. Evalúe costo total de propiedad, ganancias de productividad, ahorros a largo plazo.",
  
  "perspectivas-de-la-industria-cmo-la-inteligencia-artificial-ia-remodelar-el-futuro-del-laboratorio-analtico":
    "Explore cómo IA transformará laboratorios analíticos. Aplicaciones de IA en HPLC, desarrollo de métodos, control de calidad. Perspectivas ROWELL.",
};

async function addMetaDescriptions() {
  console.log("Starting to add meta descriptions to articles...\n");
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [slug, metaDescription] of Object.entries(metaDescriptions)) {
    try {
      // Check if article exists
      const article = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1);
      
      if (article.length === 0) {
        console.log(`⚠️  Article not found: ${slug}`);
        errorCount++;
        continue;
      }
      
      // Update meta description
      await db.update(resources)
        .set({ metaDescription })
        .where(eq(resources.slug, slug));
      
      console.log(`✅ Updated: ${slug.substring(0, 60)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${slug}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${Object.keys(metaDescriptions).length}`);
}

addMetaDescriptions().catch(console.error);
