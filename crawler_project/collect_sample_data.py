#!/usr/bin/env python3.11
# -*- coding: utf-8 -*-
"""
收集示例产品数据
通过浏览器访问产品页面并手动记录数据
"""

import pandas as pd
import json

# 示例产品数据(手动收集)
sample_data = []

# 产品1: 0100-2637 (配件 - 已测试过)
sample_data.append({
    'product_id': 'AGIL-0100-2637',
    'part_number': '0100-2637',
    'name': 'Nut and ferrule, stainless steel, 1/8 inch, for sample loop for switching valve',
    'description': '',  # 官网无描述
    'specifications': {
        'Fitting Component': 'Fitting Complete',
        'Material': 'Stainless Steel',
        'Technique': 'LC',
        'UNSPSC Code': '41105106'
    }
})

# 产品2: 121-1012 (GC色谱柱 - 已测试过)
sample_data.append({
    'product_id': 'AGIL-121-1012',
    'part_number': '121-1012',
    'name': 'J&W DB-1 GC Column, 10 m, 0.18 mm, 0.18 µm, 7 inch cage',
    'description': 'This is the most common GC column format compatible with Agilent 5890, 6890, 7820, 7890, 8860, and 8890 series GC systems and all non-Agilent GC systems with a similarly sized oven.',
    'specifications': {
        'Capillary Tubing': 'Fused Silica',
        'Film Thickness': '0.18 µm',
        'Format': '7 inch',
        'Inner Diameter (ID)': '0.18 mm',
        'Length': '10 m',
        'Phase': 'DB-1',
        'Polarity': 'Low Polarity',
        'Temperature Range': '-60°C-325/350°C',
        'UNSPSC Code': '41115710',
        'USP Designation': 'G1, G2, G38, G9',
        'With Smart Key': 'No'
    }
})

# 保存示例数据
output_file = '/home/ubuntu/crawler_project/data/agilent_sample_crawled.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(sample_data, f, ensure_ascii=False, indent=2)

print(f"已保存 {len(sample_data)} 个示例产品数据到: {output_file}")
print("\n示例数据:")
for item in sample_data:
    print(f"  - {item['part_number']}: {item['name'][:60]}...")
