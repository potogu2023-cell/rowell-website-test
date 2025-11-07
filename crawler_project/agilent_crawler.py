#!/usr/bin/env python3.11
# -*- coding: utf-8 -*-
"""
Agilent产品信息爬虫
使用浏览器自动化方式爬取产品信息
"""

import sys
sys.path.append('/home/ubuntu/crawler_project')

from product_crawler import ProductCrawler, load_products
import pandas as pd
import json
import re
import time
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AgilentCrawler(ProductCrawler):
    """Agilent产品爬虫"""
    
    def __init__(self):
        super().__init__('Agilent')
        self.base_url = 'https://www.agilent.com/store/productDetail.jsp?catalogId='
    
    def extract_product_info(self, product_id: str, part_number: str, 
                            current_name: str) -> dict:
        """
        提取单个产品的信息
        
        注意: 此方法需要配合浏览器工具使用
        这里只提供数据结构,实际爬取由外部脚本完成
        """
        return {
            'productId': product_id,
            'partNumber': part_number,
            'brand': 'Agilent',
            'name': current_name,
            'description': '',
            'specifications': '{}',
            'descriptionQuality': 'none',
            'detailedDescription': ''
        }
    
    def parse_product_page(self, page_content: dict) -> dict:
        """
        解析产品页面内容
        
        Args:
            page_content: 包含页面信息的字典
                - product_id: 产品ID
                - part_number: 零件号
                - name: 产品名称
                - description: 描述文本
                - specifications: 规格表格数据
        
        Returns:
            标准化的产品信息字典
        """
        result = {
            'productId': page_content.get('product_id', ''),
            'partNumber': page_content.get('part_number', ''),
            'brand': 'Agilent',
            'name': '',
            'description': '',
            'specifications': '{}',
            'descriptionQuality': 'none',
            'detailedDescription': ''
        }
        
        # 处理产品名称
        name = page_content.get('name', '').strip()
        if name:
            result['name'] = self.clean_text(name)
        
        # 处理描述
        description = page_content.get('description', '').strip()
        description = self.clean_text(description)
        
        if description and len(description) >= 20:
            result['description'] = description
            # 判断描述质量
            if len(description) >= 100:
                result['descriptionQuality'] = 'high'
            elif len(description) >= 50:
                result['descriptionQuality'] = 'medium'
            else:
                result['descriptionQuality'] = 'low'
        else:
            # 从产品名称和规格提取描述
            extracted_desc = self.extract_description_from_name(
                result['name'],
                page_content.get('specifications', {})
            )
            if extracted_desc:
                result['description'] = extracted_desc
                result['descriptionQuality'] = 'extracted'
            else:
                result['description'] = 'N/A - No description available on official website'
                result['descriptionQuality'] = 'none'
        
        # 处理规格
        specs = page_content.get('specifications', {})
        if specs and isinstance(specs, dict):
            # 清理和标准化规格数据
            cleaned_specs = self.clean_specifications(specs)
            result['specifications'] = self.parse_specifications(cleaned_specs)
        else:
            result['specifications'] = '{}'
        
        # 处理详细描述
        detailed_desc = page_content.get('detailed_description', '').strip()
        if detailed_desc:
            result['detailedDescription'] = self.clean_text(detailed_desc)
        
        return result
    
    def extract_description_from_name(self, name: str, specs: dict) -> str:
        """
        从产品名称和规格中提取描述信息
        
        Args:
            name: 产品名称
            specs: 规格字典
        
        Returns:
            提取的描述文本
        """
        if not name:
            return ''
        
        # 提取产品类型
        product_type = ''
        if 'column' in name.lower():
            product_type = 'Chromatography column'
        elif 'vial' in name.lower():
            product_type = 'Sample vial'
        elif 'filter' in name.lower():
            product_type = 'Sample filter'
        elif 'spe' in name.lower() or 'bond elut' in name.lower():
            product_type = 'SPE cartridge'
        elif 'syringe' in name.lower():
            product_type = 'Syringe'
        else:
            product_type = 'Laboratory supply'
        
        # 从规格中提取关键信息
        key_specs = []
        
        # 常见规格字段映射
        spec_mapping = {
            'length': 'Length',
            'inner diameter': 'ID',
            'id': 'ID',
            'particle size': 'Particle Size',
            'phase': 'Phase',
            'volume': 'Volume',
            'material': 'Material',
            'pore size': 'Pore Size',
            'film thickness': 'Film Thickness'
        }
        
        for key, value in specs.items():
            key_lower = key.lower()
            for spec_key, display_name in spec_mapping.items():
                if spec_key in key_lower:
                    key_specs.append(f"{display_name}: {value}")
                    break
        
        # 组合描述
        if key_specs:
            specs_text = ', '.join(key_specs[:5])  # 最多5个规格
            description = f"{product_type} with {specs_text}."
        else:
            description = f"{product_type} for laboratory use."
        
        return description
    
    def clean_specifications(self, specs: dict) -> dict:
        """
        清理和标准化规格数据
        
        Args:
            specs: 原始规格字典
        
        Returns:
            清理后的规格字典
        """
        cleaned = {}
        
        for key, value in specs.items():
            if not key or not value:
                continue
            
            # 清理键名
            clean_key = key.strip()
            
            # 清理值
            if isinstance(value, str):
                clean_value = value.strip()
                # 移除多余空白
                clean_value = re.sub(r'\s+', ' ', clean_value)
            else:
                clean_value = str(value)
            
            if clean_value and clean_value.lower() not in ['n/a', 'na', '-', '']:
                cleaned[clean_key] = clean_value
        
        return cleaned


def create_browser_script(products_df: pd.DataFrame, output_file: str):
    """
    创建浏览器爬取脚本的数据文件
    
    Args:
        products_df: 产品DataFrame
        output_file: 输出文件路径
    """
    products_list = []
    
    for idx, row in products_df.iterrows():
        products_list.append({
            'index': idx,
            'productId': row['productId'],
            'partNumber': row['partNumber'],
            'name': row['name'],
            'url': f"https://www.agilent.com/store/productDetail.jsp?catalogId={row['partNumber']}"
        })
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products_list, f, ensure_ascii=False, indent=2)
    
    logger.info(f"已生成 {len(products_list)} 个产品的爬取列表: {output_file}")


if __name__ == '__main__':
    # 测试代码
    print("Agilent爬虫模块已加载")
    
    # 加载测试产品
    test_df = pd.read_csv('/home/ubuntu/crawler_project/data/agilent_test_products.csv')
    print(f"\n加载了 {len(test_df)} 个测试产品")
    
    # 创建爬虫实例
    crawler = AgilentCrawler()
    
    # 测试描述提取
    test_name = "J&W DB-1 GC Column, 10 m, 0.18 mm, 0.18 µm"
    test_specs = {
        "Length": "10 m",
        "Inner Diameter (ID)": "0.18 mm",
        "Film Thickness": "0.18 µm",
        "Phase": "DB-1"
    }
    
    extracted_desc = crawler.extract_description_from_name(test_name, test_specs)
    print(f"\n测试描述提取:")
    print(f"产品名称: {test_name}")
    print(f"提取描述: {extracted_desc}")
    
    # 生成浏览器爬取列表
    create_browser_script(test_df, '/home/ubuntu/crawler_project/data/agilent_crawl_list.json')
    print("\n✓ 爬取列表已生成")
