#!/usr/bin/env python3
"""
诊断CSV文件，找出缺失字段的行
"""

import sys
import pandas as pd

def main():
    if len(sys.argv) < 2:
        print('❌ 请提供输入CSV文件路径')
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    print('🔍 开始诊断CSV文件...\n')
    print(f'📁 文件: {input_file}\n')
    
    # 读取CSV文件 - 只读取前12列
    print('📖 读取CSV文件...')
    df = pd.read_csv(
        input_file,
        usecols=range(12),
        names=['productId', 'partNumber', 'name', 'brand', 'productType',
               'particleSize', 'poreSize', 'columnLength', 'innerDiameter',
               'phaseType', 'phRange', 'status'],
        header=0,
        dtype=str,
        keep_default_na=False,
    )
    print(f'✅ 读取完成，共 {len(df)} 条记录\n')
    
    # 检查每个必需字段的缺失情况
    required_fields = ['productId', 'partNumber', 'name', 'brand', 'productType']
    
    print('═══════════════════════════════════════')
    print('📊 必需字段缺失统计')
    print('═══════════════════════════════════════')
    
    for field in required_fields:
        missing = df[field].isna() | (df[field] == '')
        missing_count = missing.sum()
        print(f'{field}: {missing_count} 行缺失 ({missing_count/len(df)*100:.1f}%)')
    
    # 找出至少缺少一个必需字段的行
    missing_any = pd.Series([False] * len(df))
    for field in required_fields:
        missing_any |= (df[field].isna() | (df[field] == ''))
    
    missing_rows = df[missing_any]
    print(f'\n总共 {len(missing_rows)} 行至少缺少一个必需字段\n')
    
    # 显示前10个缺失行的示例
    print('═══════════════════════════════════════')
    print('📋 缺失行示例（前10行）')
    print('═══════════════════════════════════════')
    for idx, row in missing_rows.head(10).iterrows():
        print(f'\n行 {idx + 2}:')
        for field in required_fields:
            value = row[field]
            status = '✓' if value and value != '' else '✗ 缺失'
            print(f'  {field}: {status} ({repr(value[:50]) if value else ""})')
    
    # 检查品牌分布（包括缺失的）
    print('\n═══════════════════════════════════════')
    print('📊 品牌分布（包括空值）')
    print('═══════════════════════════════════════')
    brand_counts = df['brand'].value_counts()
    for brand, count in brand_counts.head(15).items():
        print(f'  {brand}: {count}')
    
    # 检查是否有空字符串
    empty_brand = (df['brand'] == '').sum()
    if empty_brand > 0:
        print(f'  [空字符串]: {empty_brand}')

if __name__ == '__main__':
    main()

