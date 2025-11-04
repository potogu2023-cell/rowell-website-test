import pandas as pd
import mysql.connector
import os
from urllib.parse import urlparse
from datetime import datetime

# Get DATABASE_URL from environment
db_url = os.getenv('DATABASE_URL')

# Parse DATABASE_URL
parsed = urlparse(db_url)

db_config = {
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'user': parsed.username,
    'password': parsed.password,
    'database': parsed.path.lstrip('/').split('?')[0],
    'ssl_disabled': False
}

print("="*80)
print("添加168个新产品到数据库（修复版）")
print("="*80)

# Read CSV file with clean products
csv_df = pd.read_csv('/home/ubuntu/165个产品_无问题_待更新.csv')
print(f"\nCSV产品数: {len(csv_df)}")

# Generate prefix from brand name
def get_prefix(brand):
    # Remove spaces and special characters
    clean_brand = brand.replace(' ', '').replace('-', '').replace('.', '')
    # Take first 4 characters and uppercase
    prefix = clean_brand[:4].upper()
    return prefix

# Auto-classify products based on product name keywords
def classify_product(name):
    name_lower = name.lower()
    
    if 'column' in name_lower or 'hplc' in name_lower or 'gc' in name_lower:
        if 'guard' in name_lower:
            return 'Guard Columns'
        elif 'gc' in name_lower:
            return 'GC Columns'
        else:
            return 'HPLC Columns'
    elif 'syringe filter' in name_lower or 'filter' in name_lower:
        return 'Syringe Filters'
    elif 'vial' in name_lower:
        return 'Vials'
    elif 'septa' in name_lower or 'septum' in name_lower:
        return 'Septa'
    elif 'cap' in name_lower or 'closure' in name_lower or 'crimp' in name_lower:
        return 'Caps'
    elif 'insert' in name_lower:
        return 'Inserts'
    elif 'syringe' in name_lower:
        return 'Syringes'
    elif 'spe' in name_lower or 'extraction' in name_lower or 'cartridge' in name_lower:
        return 'Sample Preparation'
    elif 'standard' in name_lower or 'reference' in name_lower:
        return 'Standards'
    elif 'guard' in name_lower or 'holder' in name_lower or 'fitting' in name_lower or 'tubing' in name_lower or 'nut' in name_lower:
        return 'Accessories'
    else:
        return 'Other'

# Connect to database
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Prepare products to insert
products_to_insert = []

for idx, row in csv_df.iterrows():
    brand = row['品牌']
    part_number = str(row['原品牌零件号']).strip()
    official_name = row['官网产品名称']
    product_type = classify_product(official_name)
    
    prefix = get_prefix(brand)
    product_id = f"{prefix}-{part_number}"
    
    products_to_insert.append({
        'productId': product_id,
        'prefix': prefix,
        'brand': brand,
        'partNumber': part_number,
        'name': official_name,
        'productType': product_type,
        'rowell_name': row['ROWELL产品名称']
    })

print(f"\n准备插入 {len(products_to_insert)} 个产品")

# Brand distribution
print("\n品牌分布:")
brand_counts = {}
for p in products_to_insert:
    brand = p['brand']
    brand_counts[brand] = brand_counts.get(brand, 0) + 1

for brand, count in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True):
    prefix = get_prefix(brand)
    print(f"  {brand:30s} ({prefix}): {count} 个")

# Product type distribution
print("\n产品类型分布:")
type_counts = {}
for p in products_to_insert:
    ptype = p['productType']
    type_counts[ptype] = type_counts.get(ptype, 0) + 1

for ptype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {ptype:30s}: {count} 个")

# Insert products
print("\n" + "="*80)
print("开始插入产品...")
print("="*80)

insert_sql = """
    INSERT INTO products (productId, prefix, brand, partNumber, name, productType, createdAt, updatedAt)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

insert_count = 0
failed_count = 0
now = datetime.now()

for product in products_to_insert:
    try:
        cursor.execute(insert_sql, (
            product['productId'],
            product['prefix'],
            product['brand'],
            product['partNumber'],
            product['name'],
            product['productType'],
            now,
            now
        ))
        insert_count += 1
        
        if insert_count % 20 == 0:
            print(f"  已插入 {insert_count} 个产品...")
    except Exception as e:
        failed_count += 1
        if failed_count <= 5:  # Only show first 5 errors
            print(f"  ❌ 插入失败: {product['brand']} - {product['partNumber']}")
            print(f"     错误: {str(e)}")

conn.commit()
print(f"\n✅ 成功插入 {insert_count} 个产品!")
if failed_count > 0:
    print(f"⚠️ 插入失败 {failed_count} 个产品")

# Save insert results
results_df = pd.DataFrame(products_to_insert)
results_df.to_csv('/home/ubuntu/insert_results_168_fixed.csv', index=False, encoding='utf-8-sig')
print(f"✅ 已保存插入结果: /home/ubuntu/insert_results_168_fixed.csv")

# Verify
cursor.execute("SELECT COUNT(*) as count FROM products")
total_count = cursor.fetchone()['count']
print(f"\n数据库产品总数: {total_count}")

cursor.close()
conn.close()

print("\n✅ 插入完成!")
