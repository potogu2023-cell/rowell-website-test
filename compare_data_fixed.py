import pandas as pd
import mysql.connector
import os
from urllib.parse import urlparse, parse_qs

# Get DATABASE_URL from environment
db_url = os.getenv('DATABASE_URL')

# Parse DATABASE_URL
parsed = urlparse(db_url)
db_user = parsed.username
db_pass = parsed.password
db_host = parsed.hostname
db_port = parsed.port
# Remove query parameters from path
db_name = parsed.path.lstrip('/').split('?')[0]

print(f"Connecting to database: {db_host}:{db_port}/{db_name}")

# Connect to database
conn = mysql.connector.connect(
    host=db_host,
    port=db_port,
    user=db_user,
    password=db_pass,
    database=db_name,
    ssl_disabled=False
)

# Read current database products
print("\nReading database products...")
db_df = pd.read_sql("SELECT * FROM products", conn)
print(f"Database products: {len(db_df)}")

# Read CSV file
print("\nReading CSV file...")
csv_df = pd.read_csv('/home/ubuntu/upload/全部产品验证清单_2438个.csv')
print(f"CSV products: {len(csv_df)}")

# Filter CSV by verification status
print("\nFiltering CSV by verification status...")
csv_consistent = csv_df[csv_df['验证状态'] == '一致']
csv_part_number_fix = csv_df[csv_df['验证状态'] == '零件号需更正']
csv_inconsistent = csv_df[csv_df['验证状态'] == '不一致']
csv_not_found = csv_df[csv_df['验证状态'] == '未找到']

print(f"  - 一致: {len(csv_consistent)}")
print(f"  - 零件号需更正: {len(csv_part_number_fix)}")
print(f"  - 不一致: {len(csv_inconsistent)}")
print(f"  - 未找到: {len(csv_not_found)}")

# Combine high-quality products (一致 + 零件号需更正)
csv_high_quality = pd.concat([csv_consistent, csv_part_number_fix])
print(f"\nHigh-quality products to update: {len(csv_high_quality)}")

# Match products based on brand + partNumber
print("\nMatching products based on brand + 原品牌零件号...")

# Create matching key
db_df['match_key'] = db_df['brand'] + '|||' + db_df['partNumber'].fillna('')
csv_high_quality['match_key'] = csv_high_quality['品牌'] + '|||' + csv_high_quality['原品牌零件号'].fillna('')

# Find matches
matched = csv_high_quality[csv_high_quality['match_key'].isin(db_df['match_key'])]
not_matched = csv_high_quality[~csv_high_quality['match_key'].isin(db_df['match_key'])]

print(f"  - Matched: {len(matched)}")
print(f"  - Not matched: {len(not_matched)}")

# Find products to delete (未找到)
csv_not_found['match_key'] = csv_not_found['品牌'] + '|||' + csv_not_found['原品牌零件号'].fillna('')
to_delete = csv_not_found[csv_not_found['match_key'].isin(db_df['match_key'])]
print(f"\nProducts to delete (未找到): {len(to_delete)}")

# Find products in DB but not in CSV
db_match_keys = set(db_df['match_key'])
csv_all_keys = csv_df['品牌'] + '|||' + csv_df['原品牌零件号'].fillna('')
csv_all_match_keys = set(csv_all_keys)
db_only = db_df[~db_df['match_key'].isin(csv_all_match_keys)]
print(f"Products in DB but not in CSV: {len(db_only)}")

# Generate detailed report
print("\n" + "="*80)
print("COMPARISON REPORT")
print("="*80)

print("\n1. SUMMARY")
print("-"*80)
print(f"Current database products: {len(db_df)}")
print(f"CSV products: {len(csv_df)}")
print(f"  - High-quality (一致 + 零件号需更正): {len(csv_high_quality)}")
print(f"  - Inconsistent (不一致): {len(csv_inconsistent)}")
print(f"  - Not found (未找到): {len(csv_not_found)}")

print("\n2. MATCHING RESULTS")
print("-"*80)
print(f"High-quality products matched in DB: {len(matched)}")
print(f"High-quality products NOT in DB: {len(not_matched)}")
print(f"Products to delete (未找到 & in DB): {len(to_delete)}")
print(f"Products in DB but not in CSV: {len(db_only)}")

print("\n3. AFTER UPDATE PROJECTION")
print("-"*80)
print(f"Products to update: {len(matched)}")
print(f"Products to delete: {len(to_delete)}")
print(f"Products to keep unchanged: {len(db_df) - len(matched) - len(to_delete)}")
print(f"Final product count: {len(db_df) - len(to_delete)}")

print("\n4. BRAND DISTRIBUTION (High-quality products to update)")
print("-"*80)
matched_brands = matched.groupby('品牌').size().sort_values(ascending=False)
for brand, count in matched_brands.items():
    print(f"{brand}: {count}")

# Save detailed lists
print("\n5. SAVING DETAILED LISTS...")
print("-"*80)

# Products to update
matched.to_csv('/home/ubuntu/products_to_update.csv', index=False, encoding='utf-8')
print(f"Products to update saved to: /home/ubuntu/products_to_update.csv ({len(matched)} products)")

# Products to delete
to_delete.to_csv('/home/ubuntu/products_to_delete.csv', index=False, encoding='utf-8')
print(f"Products to delete saved to: /home/ubuntu/products_to_delete.csv ({len(to_delete)} products)")

# Products not matched
not_matched.to_csv('/home/ubuntu/products_not_matched.csv', index=False, encoding='utf-8')
print(f"Products not matched saved to: /home/ubuntu/products_not_matched.csv ({len(not_matched)} products)")

# Products in DB only
db_only.to_csv('/home/ubuntu/products_db_only.csv', index=False, encoding='utf-8')
print(f"Products in DB only saved to: /home/ubuntu/products_db_only.csv ({len(db_only)} products)")

# Inconsistent products (to keep)
csv_inconsistent.to_csv('/home/ubuntu/products_inconsistent_keep.csv', index=False, encoding='utf-8')
print(f"Inconsistent products (keep) saved to: /home/ubuntu/products_inconsistent_keep.csv ({len(csv_inconsistent)} products)")

conn.close()
print("\nDone!")
