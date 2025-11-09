#!/usr/bin/env python3
"""
批量更新文章Meta描述脚本
为31篇已发布文章添加SEO优化的Meta描述
"""

import requests
import json
import time

# API配置
API_URL = 'https://3000-ipywb5n7uqtmemlvkffh0-dc4281b8.manus-asia.computer/api/trpc/resources.update'
API_KEY = 'rowell_fff6d961c76a55982da165ba02114e65'

# Meta描述映射（基于文章标题关键词）
META_DESCRIPTIONS = {
    # 英文文章
    "Peak Splitting": "Learn how to diagnose and fix peak splitting in HPLC. Discover physical and chemical causes, troubleshooting steps, and ultimate solutions from ROWELL experts.",
    "Tailing Peaks": "Eliminate tailing peaks in HPLC with proven solutions. Understand causes, optimize mobile phase, and improve peak shape with ROWELL's expert guidance.",
    "Peak Shape": "Master peak shape optimization in HPLC. Learn how column quality, mobile phase, and system parameters affect peak symmetry. Expert tips from ROWELL.",
    "Atorvastatin": "Discover how ROWELL HPLC columns improved atorvastatin analysis. Real-world case study with method optimization, results, and ROI analysis.",
    "Ghost Peaks": "Identify and eliminate ghost peaks in HPLC. Learn common causes, diagnostic steps, and prevention strategies from ROWELL chromatography experts.",
    "Baseline": "Troubleshoot baseline instability in HPLC. Understand causes, diagnostic methods, and solutions to achieve stable, reproducible chromatograms.",
    "Signal-to-Noise": "Boost HPLC detection sensitivity without losing resolution. 5 proven tips to improve signal-to-noise ratio from ROWELL analytical experts.",
    "FPP": "Compare FPP and SPP HPLC columns. Understand particle technology, performance differences, and choose the right column for your application.",
    "ROI": "Calculate the true ROI of upgrading HPLC columns. Learn how to evaluate total cost of ownership, productivity gains, and long-term savings.",
    "AI": "Explore how AI will reshape analytical laboratories. Discover AI applications in HPLC, method development, and quality control. Future insights from ROWELL.",
    
    # 俄语文章
    "Разделение пиков": "Узнайте, как диагностировать и устранить разделение пиков в ВЭЖХ. Физические и химические причины, методы устранения от экспертов ROWELL.",
    "хвостовыми пиками": "Устраните хвостовые пики в ВЭЖХ с помощью проверенных решений. Причины, оптимизация подвижной фазы, советы от ROWELL.",
    "форму пика": "Оптимизация формы пика в ВЭЖХ. Влияние качества колонки, подвижной фазы и параметров системы. Экспертные советы ROWELL.",
    "Аторвастатин": "Как колонки ROWELL улучшили анализ аторвастатина. Реальный кейс с оптимизацией метода, результатами и анализом ROI.",
    "Призрачные пики": "Выявление и устранение призрачных пиков в ВЭЖХ. Распространённые причины, диагностика, профилактика от экспертов ROWELL.",
    "базовая линия": "Устранение нестабильности базовой линии в ВЭЖХ. Причины, методы диагностики, решения для стабильных хроматограмм.",
    "сигнал-шум": "Повышение чувствительности детекции в ВЭЖХ без потери разрешения. 5 проверенных советов от аналитических экспертов ROWELL.",
    "Скорость": "Сравнение колонок FPP и SPP для ВЭЖХ. Технология частиц, различия в производительности, выбор колонки для вашего применения.",
    "Расчёт ROI": "Расчёт реальной окупаемости обновления колонок ВЭЖХ. Оценка совокупной стоимости владения, прироста производительности, экономии.",
    "ИИ": "Как ИИ изменит аналитические лаборатории. Применение ИИ в ВЭЖХ, разработке методов, контроле качества. Прогнозы от ROWELL.",
    
    # 西班牙语文章
    "División de Pico": "Aprenda a diagnosticar y solucionar la división de picos en HPLC. Causas físicas y químicas, pasos de solución de problemas de expertos ROWELL.",
    "Picos con Cola": "Elimine picos con cola en HPLC con soluciones probadas. Comprenda causas, optimice fase móvil, mejore forma de pico con guía de ROWELL.",
    "Forma del Pico": "Domine la optimización de forma de pico en HPLC. Cómo calidad de columna, fase móvil y parámetros afectan simetría. Consejos de ROWELL.",
    "Atorvastatina": "Descubra cómo columnas ROWELL mejoraron análisis de atorvastatina. Caso real con optimización de método, resultados y análisis ROI.",
    "Picos Fantasma": "Identifique y elimine picos fantasma en HPLC. Causas comunes, pasos de diagnóstico, estrategias de prevención de expertos ROWELL.",
    "Línea Base": "Solucione inestabilidad de línea base en HPLC. Comprenda causas, métodos de diagnóstico, soluciones para cromatogramas estables.",
    "Señal-Ruido": "Aumente sensibilidad de detección HPLC sin perder resolución. 5 consejos probados para mejorar relación señal-ruido de expertos ROWELL.",
    "Velocidad": "Compare columnas FPP y SPP para HPLC. Comprenda tecnología de partículas, diferencias de rendimiento, elija columna para su aplicación.",
    "costo inicial": "Calcule el ROI real de actualizar columnas HPLC. Evalúe costo total de propiedad, ganancias de productividad, ahorros a largo plazo.",
    "IA": "Explore cómo IA transformará laboratorios analíticos. Aplicaciones de IA en HPLC, desarrollo de métodos, control de calidad. Perspectivas ROWELL.",
}

def find_meta_description(title):
    """根据文章标题查找对应的Meta描述"""
    for keyword, description in META_DESCRIPTIONS.items():
        if keyword.lower() in title.lower():
            return description
    return None

def update_article_meta(article_id, meta_description):
    """更新单篇文章的Meta描述"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {API_KEY}'
    }
    data = {
        "json": {
            "id": article_id,
            "metaDescription": meta_description
        }
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=data, timeout=30)
        result = response.json()
        
        if result.get('result', {}).get('data', {}).get('json', {}).get('success'):
            return True, "Success"
        else:
            return False, json.dumps(result)
    except Exception as e:
        return False, str(e)

# 文章列表（从Sitemap中提取的31篇文章）
# 格式：(文章ID, 文章标题, 语言)
ARTICLES = [
    # 英文文章（10篇）
    (2, "Peak Splitting in HPLC: Diagnosis and Ultimate Solutions", "en"),
    (3, "Saying Goodbye to Tailing Peaks: Advanced Peak Shape Optimization Strategies for Basic Compounds", "en"),
    (4, "The Battle for Peak Shape: Beware of the Extra-Column Effects that Steal Your Resolution", "en"),
    (5, "Application Case Study: A Complete Analytical Method for Related Substances in Atorvastatin", "en"),
    (6, "Ghost Peaks in HPLC: Identification, Source Tracking, and Elimination Methods", "en"),
    (7, "Is Your Baseline Unstable? A Systematic Troubleshooting Guide for HPLC Baseline Noise and Drift", "en"),
    (8, "The Signal-to-Noise Battle: 5 Tips to Increase HPLC Detection Sensitivity Without Sacrificing Resolution", "en"),
    (9, "Speed and Performance: The Ultimate Showdown Between Fully Porous Particle (FPP) and Superficially Porous Particle (SPP) Columns", "en"),
    (10, "Beyond the Initial Cost: How to Calculate the ROI of Upgrading to High-Efficiency HPLC Columns", "en"),
    (11, "Industry Outlook: How Artificial Intelligence (AI) Will Reshape the Future of the Analytical Laboratory", "en"),
    
    # 俄语文章（11篇，包含1篇重复）
    (12, "Пример применения: Полный аналитический метод определения родственных веществ в аторвастатине", "ru"),
    (13, "Расчёт ROI при обновлении колонок ВЭЖХ", "ru"),
    (14, "Призрачные пики в ВЭЖХ: идентификация, отслеживание источника и методы устранения", "ru"),
    (15, "Отраслевой прогноз: Как искусственный интеллект (ИИ) изменит будущее аналитической лаборатории", "ru"),
    (16, "Ваша базовая линия нестабильна? Систематическое руководство по устранению шума и дрейфа базовой линии в ВЭЖХ", "ru"),
    (17, "Разделение пиков в ВЭЖХ: диагностика и окончательные решения", "ru"),
    (18, "Прощание с хвостами пиков: продвинутые стратегии оптимизации формы пиков для основных соединений", "ru"),
    (19, "Скорость и производительность: окончательное противостояние между колонками с полностью пористыми частицами (FPP) и поверхностно-пористыми частицами (SPP)", "ru"),
    (20, "Битва за форму пика: остерегайтесь внеколоночных эффектов, которые крадут ваше разрешение", "ru"),
    (21, "Борьба сигнал-шум: 5 советов по повышению чувствительности детекции в ВЭЖХ без потери разрешающей способности", "ru"),
    (32, "Разделение пиков в ВЭЖХ: диагностика и окончательные решения", "ru"),  # 重复文章
    
    # 西班牙语文章（10篇）
    (22, "Estudio de Caso de Aplicación: Un Método Analítico Completo para Sustancias Relacionadas en Atorvastatina", "es"),
    (23, "Más allá del Costo Inicial: Cómo Calcular el ROI de Actualizar a Columnas HPLC de Alta Eficiencia", "es"),
    (24, "Picos Fantasma en HPLC: Identificación, Rastreo de Origen y Métodos de Eliminación", "es"),
    (25, "Perspectivas de la Industria: Cómo la Inteligencia Artificial (IA) Remodelará el Futuro del Laboratorio Analítico", "es"),
    (26, "¿Está Inestable su Línea Base? Una Guía Sistemática para la Resolución de Problemas de Ruido y Deriva en la Línea Base de HPLC", "es"),
    (27, "División de Pico en HPLC: Diagnóstico y Soluciones Definitivas", "es"),
    (28, "Despidiéndose de los Picos con Cola: Estrategias Avanzadas de Optimización de la Forma del Pico para Compuestos Básicos", "es"),
    (29, "Velocidad y Rendimiento: El Duelo Definitivo entre Columnas de Partículas Totalmente Porosas (FPP) y Partículas Superficialmente Porosas (SPP)", "es"),
    (30, "La Batalla por la Forma del Pico: Cuidado con los Efectos Extra-Columna que Roban tu Resolución", "es"),
    (31, "La Batalla Señal-Ruido: 5 Consejos para Aumentar la Sensibilidad de Detección en HPLC sin Sacrificar la Resolución", "es"),
]

def main():
    print("=" * 80)
    print("批量更新文章Meta描述")
    print("=" * 80)
    print(f"\n总文章数: {len(ARTICLES)}")
    print(f"API URL: {API_URL}\n")
    
    success_count = 0
    fail_count = 0
    results = []
    
    for article_id, title, language in ARTICLES:
        print(f"\n处理文章 ID {article_id}: {title[:50]}...")
        
        # 查找Meta描述
        meta_description = find_meta_description(title)
        
        if not meta_description:
            print(f"  ⚠️  未找到Meta描述，跳过")
            fail_count += 1
            results.append({
                "id": article_id,
                "title": title,
                "language": language,
                "status": "skipped",
                "reason": "No meta description found"
            })
            continue
        
        print(f"  Meta描述: {meta_description[:80]}...")
        
        # 更新文章
        success, message = update_article_meta(article_id, meta_description)
        
        if success:
            print(f"  ✅ 更新成功")
            success_count += 1
            results.append({
                "id": article_id,
                "title": title,
                "language": language,
                "status": "success",
                "metaDescription": meta_description
            })
        else:
            print(f"  ❌ 更新失败: {message[:100]}")
            fail_count += 1
            results.append({
                "id": article_id,
                "title": title,
                "language": language,
                "status": "failed",
                "error": message
            })
        
        # 避免请求过快
        time.sleep(0.5)
    
    # 保存结果
    with open('/home/ubuntu/meta_update_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    # 打印总结
    print("\n" + "=" * 80)
    print("更新完成")
    print("=" * 80)
    print(f"成功: {success_count}")
    print(f"失败: {fail_count}")
    print(f"总计: {len(ARTICLES)}")
    print(f"\n详细结果已保存到: /home/ubuntu/meta_update_results.json")

if __name__ == "__main__":
    main()

