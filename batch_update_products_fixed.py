import pandas as pd
import mysql.connector
import os
from urllib.parse import urlparse
import re

# Get DATABASE_URL from environment
db_url = os.getenv('DATABASE_URL')

# Parse DATABASE_URL
parsed = urlparse(db_url)
db_user = parsed.username
db_pass = parsed.password
db_host = parsed.hostname
db_port = parsed.port
db_name = parsed.path.lstrip('/').split('?')[0]

print("="*80)
print("BATCH UPDATE SCRIPT - 564 High-Quality Products (FIXED)")
print("="*80)
print(f"\nConnecting to database: {db_host}:{db_port}/{db_name}")

# Connect to database
conn = mysql.connector.connect(
    host=db_host,
    port=db_port,
    user=db_user,
    password=db_pass,
    database=db_name,
    ssl_disabled=False
)
cursor = conn.cursor()

# Read products to update
print("\nReading products to update...")
update_df = pd.read_csv('/home/ubuntu/products_to_update.csv')
print(f"Total products to update: {len(update_df)}")

# Read current database products for comparison
print("\nReading current database products...")
db_df = pd.read_sql("SELECT * FROM products", conn)
print(f"Current database products: {len(db_df)}")

# Product type mapping based on keywords
def classify_product(product_name):
    """Classify product based on name keywords"""
    name_lower = product_name.lower()
    
    # HPLC Columns
    if 'column' in name_lower or 'hplc' in name_lower:
        return 'HPLC Columns'
    # Syringe Filters
    elif 'syringe filter' in name_lower or 'filter' in name_lower:
        return 'Syringe Filters'
    # Vials
    elif 'vial' in name_lower:
        return 'Vials'
    # Septa
    elif 'septa' in name_lower or 'septum' in name_lower:
        return 'Septa'
    # Caps
    elif 'cap' in name_lower or 'closure' in name_lower:
        return 'Caps'
    # Inserts
    elif 'insert' in name_lower:
        return 'Inserts'
    # Syringes
    elif 'syringe' in name_lower and 'filter' not in name_lower:
        return 'Syringes'
    # Sample Preparation
    elif 'spe' in name_lower or 'extraction' in name_lower:
        return 'Sample Preparation'
    # Standards
    elif 'standard' in name_lower or 'reference' in name_lower:
        return 'Standards'
    # Accessories
    elif 'guard' in name_lower or 'holder' in name_lower or 'fitting' in name_lower:
        return 'Accessories'
    # Default
    else:
        return 'Other'

# Prepare update statistics
stats = {
    'total': len(update_df),
    'updated': 0,
    'failed': 0,
    'not_found': 0,
    'by_brand': {},
    'by_type': {}
}

print("\n" + "="*80)
print("STARTING BATCH UPDATE")
print("="*80)

# Update products one by one
for idx, row in update_df.iterrows():
    brand = row['品牌']
    part_number = row['原品牌零件号']
    rowell_name = row['ROWELL产品名称']
    official_name = row['官网产品名称']
    
    # Use official name if available, otherwise use ROWELL name
    new_name = official_name if pd.notna(official_name) and official_name.strip() != '' else rowell_name
    
    # Classify product
    product_type = classify_product(new_name)
    
    # Find product in database
    match_key = f"{brand}|||{part_number}"
    db_match = db_df[db_df['brand'] + '|||' + db_df['partNumber'].fillna('') == match_key]
    
    if len(db_match) == 0:
        print(f"❌ [{idx+1}/{len(update_df)}] Product not found: {brand} - {part_number}")
        stats['not_found'] += 1
        continue
    
    # Convert numpy.int64 to Python int
    product_id = int(db_match.iloc[0]['id'])
    old_name = db_match.iloc[0]['name']
    
    try:
        # Update product
        update_query = """
            UPDATE products 
            SET name = %s, 
                productType = %s,
                updatedAt = NOW()
            WHERE id = %s
        """
        cursor.execute(update_query, (new_name, product_type, product_id))
        
        stats['updated'] += 1
        stats['by_brand'][brand] = stats['by_brand'].get(brand, 0) + 1
        stats['by_type'][product_type] = stats['by_type'].get(product_type, 0) + 1
        
        if (idx + 1) % 50 == 0:
            print(f"✅ [{idx+1}/{len(update_df)}] Updated {stats['updated']} products...")
            conn.commit()
    
    except Exception as e:
        print(f"❌ [{idx+1}/{len(update_df)}] Failed to update product ID {product_id}: {e}")
        stats['failed'] += 1

# Commit final changes
conn.commit()

print("\n" + "="*80)
print("UPDATE COMPLETED")
print("="*80)
print(f"\n📊 Statistics:")
print(f"  Total products to update: {stats['total']}")
print(f"  ✅ Successfully updated: {stats['updated']}")
print(f"  ❌ Failed: {stats['failed']}")
print(f"  ❓ Not found in DB: {stats['not_found']}")

print(f"\n📈 Updates by brand:")
for brand, count in sorted(stats['by_brand'].items(), key=lambda x: x[1], reverse=True):
    print(f"  {brand}: {count}")

print(f"\n📦 Updates by product type:")
for ptype, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True):
    print(f"  {ptype}: {count}")

# Close connection
cursor.close()
conn.close()

print("\n✅ Done!")
