import pandas as pd
import mysql.connector
import os
from urllib.parse import urlparse
from datetime import datetime

# Get DATABASE_URL from environment
db_url = os.getenv('DATABASE_URL')

# Parse DATABASE_URL
parsed = urlparse(db_url)
params = dict(param.split('=') for param in parsed.query.split('&')) if parsed.query else {}

db_config = {
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'user': parsed.username,
    'password': parsed.password,
    'database': parsed.path.lstrip('/').split('?')[0],
    'ssl_disabled': False
}

print("="*80)
print("批量更新168个产品")
print("="*80)

# Read CSV file with clean products
csv_df = pd.read_csv('/home/ubuntu/165个产品_无问题_待更新.csv')
print(f"\nCSV产品数: {len(csv_df)}")

# Connect to database
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Read all database products
cursor.execute("SELECT * FROM products")
db_products = cursor.fetchall()
print(f"数据库产品数: {len(db_products)}")

# Create mapping for quick lookup
db_map = {}
for product in db_products:
    brand = product['brand']
    part_number = product['partNumber']
    if part_number:
        key = f"{brand}|||{part_number}"
        if key not in db_map:
            db_map[key] = []
        db_map[key].append(product)

# Match and prepare updates
matched_products = []
unmatched_products = []

for idx, row in csv_df.iterrows():
    brand = row['品牌']
    csv_part_number = str(row['原品牌零件号']).strip()
    official_name = row['官网产品名称']
    
    # Try to match with database
    key = f"{brand}|||{csv_part_number}"
    
    if key in db_map:
        # Found match
        db_product = db_map[key][0]  # Take first match
        matched_products.append({
            'id': db_product['id'],
            'brand': brand,
            'old_part_number': db_product['partNumber'],
            'new_part_number': csv_part_number,
            'old_name': db_product['name'],
            'new_name': official_name,
            'rowell_name': row['ROWELL产品名称']
        })
    else:
        # No match found
        unmatched_products.append({
            'brand': brand,
            'rowell_name': row['ROWELL产品名称'],
            'part_number': csv_part_number,
            'official_name': official_name
        })

print(f"\n✅ 匹配成功: {len(matched_products)} 个产品")
print(f"❌ 未匹配: {len(unmatched_products)} 个产品")

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
    elif 'guard' in name_lower or 'holder' in name_lower or 'fitting' in name_lower or 'tubing' in name_lower:
        return 'Accessories'
    else:
        return 'Other'

# Execute updates
if len(matched_products) > 0:
    print("\n" + "="*80)
    print("开始更新产品...")
    print("="*80)
    
    update_count = 0
    for product in matched_products:
        product_id = product['id']
        new_name = product['new_name']
        new_type = classify_product(new_name)
        
        # Update product
        update_sql = """
            UPDATE products 
            SET name = %s, productType = %s, updatedAt = %s
            WHERE id = %s
        """
        cursor.execute(update_sql, (new_name, new_type, datetime.now(), product_id))
        update_count += 1
        
        if update_count % 20 == 0:
            print(f"  已更新 {update_count} 个产品...")
    
    conn.commit()
    print(f"\n✅ 成功更新 {update_count} 个产品!")

# Save results
results_df = pd.DataFrame(matched_products)
if len(results_df) > 0:
    results_df.to_csv('/home/ubuntu/update_results_168.csv', index=False, encoding='utf-8-sig')
    print(f"✅ 已保存更新结果: /home/ubuntu/update_results_168.csv")

if len(unmatched_products) > 0:
    unmatched_df = pd.DataFrame(unmatched_products)
    unmatched_df.to_csv('/home/ubuntu/unmatched_products_168.csv', index=False, encoding='utf-8-sig')
    print(f"⚠️ 已保存未匹配产品: /home/ubuntu/unmatched_products_168.csv")

# Statistics
print("\n" + "="*80)
print("更新统计")
print("="*80)
print(f"CSV产品总数: {len(csv_df)}")
print(f"匹配成功: {len(matched_products)}")
print(f"未匹配: {len(unmatched_products)}")
print(f"更新成功: {update_count}")

cursor.close()
conn.close()

print("\n✅ 批量更新完成!")
