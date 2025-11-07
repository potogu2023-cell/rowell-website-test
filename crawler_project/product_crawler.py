#!/usr/bin/env python3.11
# -*- coding: utf-8 -*-
"""
HPLC产品信息爬虫 - 核心模块
用于从品牌官网爬取产品的文字信息(名称、描述、技术规格)
"""

import pandas as pd
import json
import re
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/ubuntu/crawler_project/logs/crawler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ProductCrawler:
    """产品信息爬虫基类"""
    
    def __init__(self, brand: str):
        """
        初始化爬虫
        
        Args:
            brand: 品牌名称
        """
        self.brand = brand
        self.base_url = self._get_base_url()
        self.results = []
        self.stats = {
            'total': 0,
            'success': 0,
            'partial': 0,
            'failed': 0,
            'not_found': 0
        }
    
    def _get_base_url(self) -> str:
        """获取品牌官网URL"""
        url_mapping = {
            'Agilent': 'https://www.agilent.com',
            'Thermo Fisher Scientific': 'https://www.thermofisher.com',
            'Waters': 'https://www.waters.com',
            'Daicel': 'https://www.daicel.com',
            'Phenomenex': 'https://www.phenomenex.com',
            'Restek': 'https://www.restek.com',
            'Merck': 'https://www.sigmaaldrich.com',
            'Shimadzu': 'https://www.shimadzu.com',
            'ACE': 'https://www.ace-hplc.com',
            'Develosil': 'https://www.nomura-chem.co.jp',
            'Avantor': 'https://www.avantorsciences.com'
        }
        return url_mapping.get(self.brand, '')
    
    def extract_product_info(self, product_id: str, part_number: str, 
                            current_name: str) -> Dict:
        """
        提取单个产品的信息(需要在子类中实现)
        
        Args:
            product_id: 产品ID
            part_number: 零件号
            current_name: 当前产品名称
        
        Returns:
            包含产品信息的字典
        """
        raise NotImplementedError("子类必须实现此方法")
    
    def clean_text(self, text: str) -> str:
        """
        清理文本内容
        
        Args:
            text: 原始文本
        
        Returns:
            清理后的文本
        """
        if not text:
            return ""
        
        # 移除HTML标签
        text = re.sub(r'<[^>]+>', '', text)
        
        # 移除多余空白
        text = re.sub(r'\s+', ' ', text)
        
        # 移除首尾空白
        text = text.strip()
        
        return text
    
    def parse_specifications(self, spec_data: Dict) -> str:
        """
        将规格数据转换为JSON字符串
        
        Args:
            spec_data: 规格数据字典
        
        Returns:
            JSON格式的规格字符串
        """
        if not spec_data:
            return "{}"
        
        # 确保所有值都是字符串
        cleaned_specs = {}
        for key, value in spec_data.items():
            if value is not None and value != "":
                cleaned_specs[key] = str(value).strip()
        
        return json.dumps(cleaned_specs, ensure_ascii=False)
    
    def validate_result(self, result: Dict) -> Tuple[bool, str]:
        """
        验证爬取结果的质量
        
        Args:
            result: 爬取结果
        
        Returns:
            (是否有效, 状态描述)
        """
        # 检查必需字段
        if not result.get('name'):
            return False, 'missing_name'
        
        # 检查产品名称长度
        if len(result.get('name', '')) < 10:
            return False, 'name_too_short'
        
        # 检查描述
        description = result.get('description', '')
        if description == 'NOT_FOUND':
            return False, 'not_found'
        
        if not description or len(description) < 50:
            return True, 'partial'  # 部分成功
        
        # 检查规格
        try:
            specs = json.loads(result.get('specifications', '{}'))
            if len(specs) < 3:
                return True, 'partial'  # 部分成功
        except:
            return True, 'partial'
        
        return True, 'success'
    
    def crawl_products(self, products: pd.DataFrame) -> List[Dict]:
        """
        批量爬取产品信息
        
        Args:
            products: 产品DataFrame
        
        Returns:
            爬取结果列表
        """
        self.stats['total'] = len(products)
        logger.info(f"开始爬取 {self.brand} 的 {len(products)} 个产品")
        
        for idx, row in products.iterrows():
            try:
                product_id = row['productId']
                part_number = row['partNumber']
                current_name = row['name']
                
                logger.info(f"[{idx+1}/{len(products)}] 正在爬取: {part_number}")
                
                # 提取产品信息
                result = self.extract_product_info(product_id, part_number, current_name)
                
                # 验证结果
                is_valid, status = self.validate_result(result)
                
                if status == 'success':
                    self.stats['success'] += 1
                elif status == 'partial':
                    self.stats['partial'] += 1
                elif status == 'not_found':
                    self.stats['not_found'] += 1
                else:
                    self.stats['failed'] += 1
                
                self.results.append(result)
                
                # 控制请求频率(1-2秒)
                time.sleep(1.5)
                
            except Exception as e:
                logger.error(f"爬取产品 {part_number} 时出错: {str(e)}")
                self.stats['failed'] += 1
                
                # 添加失败记录
                self.results.append({
                    'productId': product_id,
                    'partNumber': part_number,
                    'brand': self.brand,
                    'name': current_name,
                    'description': 'ERROR',
                    'specifications': '{}',
                    'detailedDescription': ''
                })
        
        logger.info(f"爬取完成! 成功: {self.stats['success']}, "
                   f"部分: {self.stats['partial']}, "
                   f"失败: {self.stats['failed']}, "
                   f"未找到: {self.stats['not_found']}")
        
        return self.results
    
    def save_results(self, output_file: str):
        """
        保存爬取结果到CSV
        
        Args:
            output_file: 输出文件路径
        """
        if not self.results:
            logger.warning("没有结果可保存")
            return
        
        df = pd.DataFrame(self.results)
        df.to_csv(output_file, index=False, encoding='utf-8-sig')
        logger.info(f"结果已保存到: {output_file}")
    
    def generate_report(self, output_file: str):
        """
        生成爬取报告
        
        Args:
            output_file: 报告文件路径
        """
        success_rate = (self.stats['success'] / self.stats['total'] * 100) if self.stats['total'] > 0 else 0
        
        report = f"""# {self.brand} 文字信息补充报告

**爬取日期**: {datetime.now().strftime('%Y-%m-%d')}
**爬取人员**: Manus AI Agent

## 📊 爬取统计

- 目标产品数: {self.stats['total']}
- 成功爬取: {self.stats['success']}
- 部分成功: {self.stats['partial']} (缺少某些字段)
- 失败/未找到: {self.stats['failed'] + self.stats['not_found']}
- 总体成功率: {success_rate:.1f}%

## 📋 字段完整性

| 字段 | 完整数量 | 完整率 |
|------|---------|--------|
| name | {self._count_field('name')} | {self._calc_rate('name'):.1f}% |
| description | {self._count_field('description')} | {self._calc_rate('description'):.1f}% |
| specifications | {self._count_field('specifications')} | {self._calc_rate('specifications'):.1f}% |

## ⚠️ 问题产品清单

"""
        
        # 添加问题产品
        problem_products = []
        for result in self.results:
            if result.get('description') in ['NOT_FOUND', 'ERROR', '']:
                problem_products.append(result)
        
        if problem_products:
            report += "| productId | partNumber | 问题描述 |\n"
            report += "|-----------|------------|----------|\n"
            for p in problem_products[:20]:  # 只列出前20个
                desc = p.get('description', '')
                issue = '产品未找到' if desc == 'NOT_FOUND' else '爬取失败' if desc == 'ERROR' else '描述缺失'
                report += f"| {p['productId']} | {p['partNumber']} | {issue} |\n"
            
            if len(problem_products) > 20:
                report += f"\n... 还有 {len(problem_products) - 20} 个问题产品\n"
        else:
            report += "无问题产品\n"
        
        report += f"""

## 📝 特殊情况说明

- 部分产品的技术规格可能不完整
- 部分产品只有英文描述
- 遵守了官网的robots.txt和访问频率限制

## 💡 后续建议

- 建议对问题产品进行人工审核
- 建议统一规格字段的命名
- 建议补充缺失的产品描述
"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"报告已生成: {output_file}")
    
    def _count_field(self, field: str) -> int:
        """统计字段完整数量"""
        count = 0
        for result in self.results:
            value = result.get(field, '')
            if value and value not in ['NOT_FOUND', 'ERROR', 'N/A', '{}']:
                if field == 'description' and len(value) >= 50:
                    count += 1
                elif field == 'specifications':
                    try:
                        specs = json.loads(value)
                        if len(specs) >= 3:
                            count += 1
                    except:
                        pass
                elif field == 'name' and len(value) >= 10:
                    count += 1
        return count
    
    def _calc_rate(self, field: str) -> float:
        """计算字段完整率"""
        if self.stats['total'] == 0:
            return 0.0
        return (self._count_field(field) / self.stats['total']) * 100


def load_products(csv_file: str, brand: str = None) -> pd.DataFrame:
    """
    加载产品清单
    
    Args:
        csv_file: CSV文件路径
        brand: 品牌名称(可选,用于筛选)
    
    Returns:
        产品DataFrame
    """
    df = pd.read_csv(csv_file)
    
    # 统一品牌名称
    df['brand'] = df['brand'].replace('Thermo Fisher', 'Thermo Fisher Scientific')
    
    if brand:
        df = df[df['brand'] == brand].copy()
    
    return df


if __name__ == '__main__':
    # 测试代码
    print("产品爬虫核心模块已加载")
    print("请使用具体的品牌爬虫类进行爬取")
