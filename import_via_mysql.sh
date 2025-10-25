#!/bin/bash
# 从环境变量中提取数据库连接信息
source .env.local

# 解析 DATABASE_URL
# 格式: mysql://user:password@host:port/database
DB_URL=$(echo $DATABASE_URL | sed 's/mysql:\/\///')
DB_USER=$(echo $DB_URL | cut -d: -f1)
DB_PASS=$(echo $DB_URL | cut -d: -f2 | cut -d@ -f1)
DB_HOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo $DB_URL | cut -d: -f2 | cut -d/ -f1)
DB_NAME=$(echo $DB_URL | cut -d/ -f2 | cut -d? -f1)

echo "数据库信息:"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# 导入数据
echo "开始导入产品数据..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < /home/ubuntu/import_products.sql

if [ $? -eq 0 ]; then
    echo "产品数据导入成功！"
else
    echo "产品数据导入失败！"
    exit 1
fi
