import mysql.connector
import csv
import os

# Database connection
conn = mysql.connector.connect(
    host=os.environ.get('DB_HOST', 'localhost'),
    database=os.environ.get('DB_NAME'),
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASSWORD')
)

batches = [
    (1, 'Avantor', 'Avantor补充'),
    (2, 'Waters', 'Waters补充'),
    (3, 'Thermo Fisher Scientific', 'Thermo Fisher补充'),
    (4, 'Daicel', 'Daicel补充'),
    (5, 'ACE', 'ACE全品类'),
    (6, 'Merck', 'Merck全品类'),
    (7, 'YMC', 'YMC全品类'),
    (8, 'Restek', 'Restek全品类'),
    (9, 'Shimadzu', 'Shimadzu全品类'),
]

cursor = conn.cursor()

for batch_id, brand, batch_name in batches:
    query = """
    SELECT productId, partNumber, name
    FROM products
    WHERE brand = %s
    AND (description IS NULL OR LENGTH(description) <= 100)
    ORDER BY partNumber
    """
    
    cursor.execute(query, (brand,))
    results = cursor.fetchall()
    
    print(f"Batch {batch_id} ({batch_name}): {len(results)} products")
    
    filename = f"batch{batch_id}_{brand.lower().replace(' ', '_')}_products.csv"
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Product ID', 'Part Number', 'Product Name'])
        writer.writerows(results)

cursor.close()
conn.close()

print("\nAll batch product lists exported successfully!")
