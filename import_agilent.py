import csv
import json
import os
import mysql.connector
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not set")
    exit(1)

# Parse MySQL URL: mysql://user:pass@host:port/dbname
parsed = urlparse(db_url)
db_config = {
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'user': parsed.username,
    'password': parsed.password,
    'database': parsed.path.lstrip('/'),
}

print('=== Agilent产品数据导入 ===\n')
print(f'连接数据库: {db_config["host"]}:{db_config["port"]}/{db_config["database"]}\n')

# Connect to database
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Read CSV
csv_file = '/home/ubuntu/upload/agilent_columns_crawl_results.csv'
with open(csv_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    records = list(reader)

print(f'读取CSV文件: {len(records)}个产品')

# Filter successful products
success_products = [r for r in records if r['crawlStatus'] == 'success']
print(f'成功爬取的产品: {len(success_products)}个')
print(f'失败的产品: {len(records) - len(success_products)}个\n')

# Check existing Agilent products
cursor.execute("SELECT partNumber FROM products WHERE brand = 'Agilent'")
existing_part_numbers = set(row['partNumber'] for row in cursor.fetchall())
print(f'数据库中现有Agilent产品: {len(existing_part_numbers)}个')

# Prepare new products
new_products = []
for record in success_products:
    if record['partNumber'] in existing_part_numbers:
        continue
    
    try:
        specs = json.loads(record['specifications'] or '{}')
    except:
        specs = {}
    
    # Extract fields
    particle_size = specs.get('Particle Size')
    pore_size = specs.get('Pore Size')
    column_length = specs.get('Length')
    inner_diameter = specs.get('Inner Diameter (ID)') or specs.get('Inner Diameter')
    usp = specs.get('USP Designation')
    phase_type = specs.get('Phase')
    film_thickness = specs.get('Film Thickness')
    temperature_range = specs.get('Temperature Range')
    ph_range = specs.get('pH Range')
    
    # Determine category
    name_desc = (record['name'] + ' ' + record['description']).lower()
    if 'gc column' in name_desc or 'gas chromatography' in name_desc:
        category = 'gc-columns'
    elif 'guard' in name_desc or 'vanguard' in name_desc:
        category = 'guard-columns'
    else:
        category = 'hplc-columns'
    
    new_products.append({
        'productId': record['productId'],
        'partNumber': record['partNumber'],
        'brand': 'Agilent',
        'name': record['name'],
        'description': record['description'] or None,
        'specifications': json.dumps(specs),
        'particleSize': particle_size,
        'poreSize': pore_size,
        'columnLength': column_length,
        'innerDiameter': inner_diameter,
        'usp': usp,
        'phaseType': phase_type,
        'filmThickness': film_thickness,
        'temperatureRange': temperature_range,
        'phRange': ph_range,
        'imageUrl': record['imageUrl'] or None,
        'catalogUrl': record['catalogUrl'] or None,
        'category': category
    })

print(f'新产品: {len(new_products)}个')
print(f'重复产品(将跳过): {len(success_products) - len(new_products)}个\n')

if len(new_products) == 0:
    print('没有新产品需要导入!')
    conn.close()
    exit(0)

# Insert products
print('开始导入产品...')
insert_sql = """
INSERT INTO products (
    productId, partNumber, brand, name, description, specifications,
    particleSize, poreSize, columnLength, innerDiameter, usp, phaseType,
    filmThickness, temperatureRange, phRange, imageUrl, catalogUrl
) VALUES (
    %(productId)s, %(partNumber)s, %(brand)s, %(name)s, %(description)s, %(specifications)s,
    %(particleSize)s, %(poreSize)s, %(columnLength)s, %(innerDiameter)s, %(usp)s, %(phaseType)s,
    %(filmThickness)s, %(temperatureRange)s, %(phRange)s, %(imageUrl)s, %(catalogUrl)s
)
"""

imported = 0
for product in new_products:
    try:
        product_data = {k: v for k, v in product.items() if k != 'category'}
        cursor.execute(insert_sql, product_data)
        imported += 1
        if imported % 20 == 0:
            print(f'✓ 已导入 {imported}/{len(new_products)} 个产品')
    except Exception as e:
        print(f'  跳过产品 {product["partNumber"]}: {str(e)}')

conn.commit()
print(f'\n✓ 产品导入完成! 共导入 {imported} 个产品')

# Associate with categories
print('\n=== 关联产品到分类 ===\n')

cursor.execute("SELECT id, slug FROM categories WHERE slug IN ('hplc-columns', 'gc-columns', 'guard-columns')")
category_map = {row['slug']: row['id'] for row in cursor.fetchall()}

print('分类映射:')
for slug, cat_id in category_map.items():
    print(f'  {slug}: ID {cat_id}')
print()

# Get imported product IDs
part_numbers = [p['partNumber'] for p in new_products]
placeholders = ','.join(['%s'] * len(part_numbers))
cursor.execute(f"SELECT id, partNumber FROM products WHERE brand = 'Agilent' AND partNumber IN ({placeholders})", part_numbers)
product_id_map = {row['partNumber']: row['id'] for row in cursor.fetchall()}

# Create associations
associations = []
for product in new_products:
    product_id = product_id_map.get(product['partNumber'])
    if not product_id:
        continue
    
    category_id = category_map.get(product['category'])
    if category_id:
        associations.append((product_id, category_id))

print(f'准备关联 {len(associations)} 个产品到分类...')

associated = 0
for product_id, category_id in associations:
    try:
        cursor.execute(
            "INSERT IGNORE INTO product_categories (productId, categoryId) VALUES (%s, %s)",
            (product_id, category_id)
        )
        associated += 1
    except Exception as e:
        print(f'  关联失败: {str(e)}')

conn.commit()
print(f'\n✓ 分类关联完成! 共关联 {associated} 个产品')

# Summary
print('\n=== 导入总结 ===')
print(f'总产品数: {len(records)}')
print(f'成功爬取: {len(success_products)}')
print(f'新增产品: {imported}')
print(f'关联分类: {associated}')
print('\n✓ Agilent产品数据导入完成!')

conn.close()
