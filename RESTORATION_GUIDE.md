# ROWELL网站完整恢复指南

## 📋 文档目的

本指南提供在新的Manus任务中完全恢复ROWELL色谱耗材网站的详细步骤。

---

## 🎯 恢复目标

完成本指南后，您将拥有一个与备份时完全一致的网站，包括：

- ✅ 所有源代码和配置
- ✅ 完整的数据库结构
- ✅ 所有产品数据（2,689个产品）
- ✅ 所有分类数据（34个分类）
- ✅ 所有技术文档（82个文件）
- ✅ 所有功能正常运行

---

## 📦 备份包内容

本备份包包含以下文件：

```
rowell-website-backup/
├── RESTORATION_GUIDE.md          # 本文档
├── ENGINEER_HANDOVER_DOCUMENT.md  # 工程师交接文档
├── code/                          # 完整源代码
│   ├── client/                    # 前端代码
│   ├── server/                    # 后端代码
│   ├── drizzle/                   # 数据库Schema
│   ├── package.json               # 依赖配置
│   └── ...
├── database/                      # 数据库备份
│   ├── schema.sql                 # 表结构SQL
│   ├── products.csv               # 产品数据
│   ├── categories.csv             # 分类数据
│   ├── product_categories.csv     # 产品-分类关联
│   └── articles.csv               # 文章数据
└── documentation/                 # 所有技术文档
    ├── CATEGORY_PRODUCT_COUNT_AUTO_UPDATE.md
    ├── PRODUCT_DATA_STATISTICS_REPORT.md
    └── ...（82个文档）
```

---

## 🚀 恢复步骤

### 步骤1：创建新的Manus Web项目

1. 登录Manus平台
2. 点击"Create New Project"
3. 选择"Web App Template (tRPC + Manus Auth + Database)"
4. 项目名称：`rowell-website-test`（或您喜欢的名称）
5. 点击"Create Project"

**预期结果**：
- 新项目已创建
- 开发服务器自动启动
- 数据库已自动创建

---

### 步骤2：恢复源代码

#### 2.1 下载项目代码到本地

```bash
# 通过Manus平台的Code面板下载当前代码
# 或者使用git clone（如果项目已连接Git）
```

#### 2.2 替换为备份代码

```bash
# 解压备份包
cd /path/to/backup
unzip rowell-website-backup.zip

# 复制代码文件到项目目录
cp -r code/* /path/to/rowell-website-test/

# 或者直接在Manus平台的Code面板中上传文件
```

#### 2.3 安装依赖

```bash
cd /path/to/rowell-website-test
pnpm install
```

**预期结果**：
- 所有源代码文件已恢复
- 依赖包已安装
- 无错误信息

---

### 步骤3：恢复数据库结构

#### 3.1 使用Drizzle推送Schema（推荐）

```bash
cd /path/to/rowell-website-test
pnpm db:push
```

这将根据`drizzle/schema.ts`自动创建所有表。

#### 3.2 或者手动执行SQL（备选方案）

1. 打开Manus平台的Database面板
2. 点击"Execute SQL"
3. 复制`database/schema.sql`的内容
4. 粘贴并执行

**预期结果**：
- 19个表已创建
- 无错误信息

**验证**：
```sql
SHOW TABLES;
-- 应该看到19个表
```

---

### 步骤4：导入产品数据

#### 4.1 准备导入脚本

在项目根目录创建`restore_data.mjs`：

```javascript
import { drizzle } from 'drizzle-orm/mysql2';
import { products, categories, productCategories, articles } from './drizzle/schema.ts';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const db = drizzle(process.env.DATABASE_URL);

// 导入分类
console.log('Importing categories...');
const categoriesData = parse(readFileSync('./database/categories.csv'), {
  columns: true,
  skip_empty_lines: true
});
await db.insert(categories).values(categoriesData);
console.log(`✓ Imported ${categoriesData.length} categories`);

// 导入产品
console.log('Importing products...');
const productsData = parse(readFileSync('./database/products.csv'), {
  columns: true,
  skip_empty_lines: true
});
// 分批导入（每批500个）
for (let i = 0; i < productsData.length; i += 500) {
  const batch = productsData.slice(i, i + 500);
  await db.insert(products).values(batch);
  console.log(`✓ Imported ${i + batch.length}/${productsData.length} products`);
}

// 导入产品-分类关联
console.log('Importing product-category associations...');
const productCategoriesData = parse(readFileSync('./database/product_categories.csv'), {
  columns: true,
  skip_empty_lines: true
});
for (let i = 0; i < productCategoriesData.length; i += 1000) {
  const batch = productCategoriesData.slice(i, i + 1000);
  await db.insert(productCategories).values(batch);
  console.log(`✓ Imported ${i + batch.length}/${productCategoriesData.length} associations`);
}

// 导入文章
console.log('Importing articles...');
const articlesData = parse(readFileSync('./database/articles.csv'), {
  columns: true,
  skip_empty_lines: true
});
await db.insert(articles).values(articlesData);
console.log(`✓ Imported ${articlesData.length} articles`);

console.log('✓ All data imported successfully!');
```

#### 4.2 执行导入

```bash
node restore_data.mjs
```

**预期结果**：
```
Importing categories...
✓ Imported 34 categories
Importing products...
✓ Imported 500/2689 products
✓ Imported 1000/2689 products
...
✓ Imported 2689/2689 products
Importing product-category associations...
✓ Imported 1000/3000+ associations
...
✓ All data imported successfully!
```

**验证**：
```sql
SELECT COUNT(*) FROM products;        -- 应该是2689
SELECT COUNT(*) FROM categories;      -- 应该是34
SELECT COUNT(*) FROM product_categories;  -- 应该是3000+
SELECT COUNT(*) FROM articles;        -- 应该是31
```

---

### 步骤5：验证网站功能

#### 5.1 启动开发服务器

```bash
pnpm dev
```

#### 5.2 访问网站

打开浏览器，访问：`https://3000-xxx.manus-asia.computer`

#### 5.3 功能检查清单

| 功能 | 检查项 | 状态 |
|------|--------|------|
| **首页** | 页面正常加载 | [ ] |
| **产品列表** | 显示2689个产品 | [ ] |
| **分类导航** | 显示34个分类，包含产品数量 | [ ] |
| **产品筛选** | 品牌、粒径等筛选器工作正常 | [ ] |
| **产品详情** | 点击产品查看详情页 | [ ] |
| **AI顾问** | AI产品推荐功能正常 | [ ] |
| **询价功能** | 添加到询价清单正常 | [ ] |
| **USP标准** | USP页面显示正常 | [ ] |
| **资源中心** | 显示31篇文章 | [ ] |
| **用户登录** | Manus OAuth登录正常 | [ ] |

#### 5.4 数据完整性检查

```sql
-- 检查分类产品数量是否正确
SELECT 
  c.nameEn,
  COUNT(DISTINCT pc.productId) as productCount
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.categoryId
GROUP BY c.id
ORDER BY productCount DESC;

-- 检查品牌分布
SELECT 
  brand,
  COUNT(*) as productCount
FROM products
GROUP BY brand
ORDER BY productCount DESC;

-- 检查空分类
SELECT 
  c.nameEn
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.categoryId
WHERE pc.productId IS NULL;
```

---

### 步骤6：创建初始Checkpoint

1. 打开Manus平台的Checkpoint面板
2. 点击"Save Checkpoint"
3. 描述：`Initial restore from backup - 2025-11-08`
4. 点击"Save"

**重要**：这个Checkpoint是您的"安全点"，如果后续操作出错，可以回滚到这里。

---

## 🔧 故障排查

### 问题1：数据库连接失败

**症状**：
```
Error: connect ECONNREFUSED
```

**解决方案**：
1. 检查`DATABASE_URL`环境变量是否正确
2. 在Manus平台的Settings → Secrets中验证
3. 重启开发服务器

### 问题2：产品数据导入失败

**症状**：
```
Error: Duplicate entry '...' for key 'PRIMARY'
```

**解决方案**：
1. 清空表：`TRUNCATE TABLE products;`
2. 重新导入数据

### 问题3：分类产品数量为0

**症状**：所有分类显示0个产品

**原因**：产品-分类关联数据未导入

**解决方案**：
1. 检查`product_categories`表是否有数据
2. 如果没有，重新导入`database/product_categories.csv`

### 问题4：前端页面空白

**症状**：浏览器显示空白页面

**解决方案**：
1. 打开浏览器控制台查看错误信息
2. 检查是否有JavaScript错误
3. 确认`pnpm install`已成功执行
4. 重启开发服务器

---

## 📊 恢复验证清单

使用此清单确认恢复是否完整：

### 代码恢复
- [ ] 所有源代码文件已恢复（client/, server/, drizzle/等）
- [ ] `package.json`已恢复
- [ ] 依赖已安装（node_modules/存在）
- [ ] 开发服务器可以启动
- [ ] 无TypeScript编译错误

### 数据库恢复
- [ ] 19个表已创建
- [ ] products表有2689条记录
- [ ] categories表有34条记录
- [ ] product_categories表有3000+条记录
- [ ] articles表有31条记录
- [ ] users表已创建（可能为空）

### 功能验证
- [ ] 首页正常显示
- [ ] 产品列表显示2689个产品
- [ ] 分类导航显示34个分类
- [ ] 分类产品数量正确（如HPLC Columns: 523）
- [ ] 产品筛选器工作正常
- [ ] 产品详情页显示正常
- [ ] AI产品顾问可以使用
- [ ] 询价功能正常
- [ ] USP标准页面正常
- [ ] 资源中心显示31篇文章

### 文档恢复
- [ ] ENGINEER_HANDOVER_DOCUMENT.md已阅读
- [ ] 所有技术文档已恢复（82个文件）
- [ ] todo.md已恢复

### Checkpoint
- [ ] 已创建初始Checkpoint
- [ ] Checkpoint描述清晰

---

## 🎓 恢复后的下一步

### 1. 熟悉项目

- 阅读`ENGINEER_HANDOVER_DOCUMENT.md`
- 浏览代码结构
- 理解核心功能实现

### 2. 检查待办事项

- 打开`todo.md`
- 了解当前进行中的任务
- 规划下一步工作

### 3. 测试所有功能

- 逐一测试功能检查清单中的每一项
- 记录任何问题或异常
- 如有需要，参考故障排查章节

### 4. 开始维护工作

- 处理待办事项
- 与爬虫团队协作导入新数据
- 优化和改进网站功能

---

## 📞 需要帮助？

如果在恢复过程中遇到问题：

1. **检查故障排查章节**：本文档包含常见问题的解决方案
2. **查看工程师交接文档**：`ENGINEER_HANDOVER_DOCUMENT.md`包含详细的技术细节
3. **联系Manus技术支持**：https://help.manus.im

---

## ✅ 恢复完成确认

完成所有步骤后，请确认：

- ✅ 所有验证清单项已勾选
- ✅ 网站功能完全正常
- ✅ 已创建初始Checkpoint
- ✅ 已阅读工程师交接文档
- ✅ 理解项目结构和核心功能

**恭喜！您已成功恢复ROWELL网站！** 🎉

---

**最后更新**: 2025-11-08  
**备份版本**: 1.0  
**Checkpoint ID**: 7f879baa
