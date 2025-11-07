#!/usr/bin/env python3.11
# -*- coding: utf-8 -*-
"""
批量爬取辅助脚本
用于处理浏览器爬取的数据并生成结果
"""

import pandas as pd
import json
import sys
sys.path.append('/home/ubuntu/crawler_project')
from agilent_crawler import AgilentCrawler

def process_crawled_data(crawled_data_file: str, output_csv: str, output_report: str):
    """
    处理爬取的数据并生成CSV和报告
    
    Args:
        crawled_data_file: 爬取数据JSON文件
        output_csv: 输出CSV文件
        output_report: 输出报告文件
    """
    # 加载爬取数据
    with open(crawled_data_file, 'r', encoding='utf-8') as f:
        crawled_data = json.load(f)
    
    # 创建爬虫实例
    crawler = AgilentCrawler()
    
    # 处理每个产品
    results = []
    for item in crawled_data:
        result = crawler.parse_product_page(item)
        results.append(result)
        crawler.results.append(result)
        
        # 更新统计
        is_valid, status = crawler.validate_result(result)
        if status == 'success':
            crawler.stats['success'] += 1
        elif status == 'partial':
            crawler.stats['partial'] += 1
        elif status == 'not_found':
            crawler.stats['not_found'] += 1
        else:
            crawler.stats['failed'] += 1
    
    crawler.stats['total'] = len(results)
    
    # 保存CSV
    df = pd.DataFrame(results)
    df.to_csv(output_csv, index=False, encoding='utf-8-sig')
    print(f"✓ CSV已保存: {output_csv}")
    
    # 生成报告
    crawler.generate_report(output_report)
    print(f"✓ 报告已生成: {output_report}")
    
    # 打印统计
    print(f"\n爬取统计:")
    print(f"  总数: {crawler.stats['total']}")
    print(f"  成功: {crawler.stats['success']}")
    print(f"  部分: {crawler.stats['partial']}")
    print(f"  失败: {crawler.stats['failed']}")
    print(f"  未找到: {crawler.stats['not_found']}")
    
    return results


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("用法: python3.11 batch_crawl_helper.py <crawled_data.json> <output.csv> <report.md>")
        sys.exit(1)
    
    process_crawled_data(sys.argv[1], sys.argv[2], sys.argv[3])
