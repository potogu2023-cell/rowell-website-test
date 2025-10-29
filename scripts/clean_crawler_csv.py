#!/usr/bin/env python3
"""
清理爬虫CSV数据 - Python版本

使用pandas处理CSV，容忍度更高
"""

import sys
import pandas as pd

def clean_brand_name(brand):
    """清理品牌名称"""
    if pd.isna(brand):
        return ''
    brand = str(brand).strip()
    if '|' in brand:
        return brand.split('|')[0].strip()
    return brand

def main():
    if len(sys.argv) < 2:
        print('❌ 请提供输入CSV文件路径')
        print('使用方法: python3 scripts/clean_crawler_csv.py input.csv [output.csv]')
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace('.csv', '_cleaned_pandas.csv')
    
    print('🚀 开始清理CSV数据（Pandas）...\n')
    print(f'📁 输入文件: {input_file}')
    print(f'📁 输出文件: {output_file}\n')
    
    # 读取CSV文件 - 只读取前12列
    print('📖 读取CSV文件...')
    try:
        df = pd.read_csv(
            input_file,
            usecols=range(12),  # 只读取前12列
            names=['productId', 'partNumber', 'name', 'brand', 'productType',
                   'particleSize', 'poreSize', 'columnLength', 'innerDiameter',
                   'phaseType', 'phRange', 'status'],
            header=0,  # 跳过表头
            dtype=str,  # 所有列都作为字符串读取
            na_values=['', 'NA', 'N/A', 'null', 'NULL'],
            keep_default_na=False,
        )
    except Exception as e:
        print(f'❌ CSV读取失败: {e}')
        sys.exit(1)
    
    print(f'✅ 读取完成，共 {len(df)} 条记录\n')
    
    # 清理数据
    print('🧹 清理数据...')
    initial_count = len(df)
    
    # 1. 移除空行
    df = df.dropna(subset=['productId', 'partNumber', 'name', 'brand', 'productType'], how='all')
    
    # 2. 移除必需字段为空的行
    df = df[df['productId'].notna() & (df['productId'] != '')]
    df = df[df['partNumber'].notna() & (df['partNumber'] != '')]
    df = df[df['name'].notna() & (df['name'] != '')]
    df = df[df['brand'].notna() & (df['brand'] != '')]
    df = df[df['productType'].notna() & (df['productType'] != '')]
    
    # 3. 清理品牌名称
    df['brand'] = df['brand'].apply(clean_brand_name)
    df = df[df['brand'] != '']
    
    # 4. 清理名称中的换行符和多余空格
    df['name'] = df['name'].str.replace('\n', ' ').str.replace(r'\s+', ' ', regex=True).str.strip()
    
    # 5. 填充空值
    df = df.fillna('')
    
    # 6. 设置默认status
    df.loc[df['status'] == '', 'status'] = 'active'
    
    skipped = initial_count - len(df)
    print(f'✅ 清理完成，有效记录 {len(df)} 条，跳过 {skipped} 条\n')
    
    # 输出清理后的CSV
    print('💾 写入清理后的CSV文件...')
    df.to_csv(output_file, index=False, quoting=1)  # quoting=1 表示QUOTE_ALL
    print(f'✅ 文件已保存: {output_file}\n')
    
    # 统计信息
    print('═══════════════════════════════════════')
    print('📊 数据统计')
    print('═══════════════════════════════════════')
    print(f'总记录数: {len(df)}')
    print(f'跳过记录: {skipped}')
    print(f'数据保留率: {len(df) / initial_count * 100:.1f}%')
    
    print('\n品牌分布:')
    brand_counts = df['brand'].value_counts()
    for brand, count in brand_counts.items():
        print(f'  {brand}: {count}')
    
    print('\n产品类型分布:')
    type_counts = df['productType'].value_counts()
    for ptype, count in type_counts.items():
        print(f'  {ptype}: {count}')
    
    print('═══════════════════════════════════════\n')
    
    print('🎉 清理完成！')
    print(f'\n下一步: 使用以下命令导入数据到数据库:')
    print(f'pnpm tsx scripts/import-crawler-data.ts {output_file}')

if __name__ == '__main__':
    main()

