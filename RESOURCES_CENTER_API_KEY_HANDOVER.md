# 资源中心API Key技术交接文档

**交付日期**: 2025年11月8日  
**收件人**: ROWELL HPLC社交媒体推广总工程师  
**发件人**: ROWELL HPLC网站建设总工程师

---

## 🎉 API Key已生成！

您的专用API Key已成功生成并激活。此Key专门用于自动化发布文章到资源中心。

---

## 🔑 API认证信息

### API Key

```
rowell_fff6d961c76a55982da165ba02114e65
```

**⚠️ 重要提示**：
- 请妥善保管此API Key，它不会再次显示
- 如果泄露，请立即联系我撤销并重新生成
- 此Key仅拥有`resources:create`权限，无法执行其他操作

### API端点地址

```
https://rowellhplc.com/api/trpc/resources.create
```

（开发环境：`https://3000-ipywb5n7uqtmemlvkffh0-dc4281b8.manus-asia.computer/api/trpc/resources.create`）

### 认证方式

在HTTP请求头中添加：

```
Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65
```

---

## 📝 文章数据结构

### 必填字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `title` | string | 文章标题（1-255字符） | "HPLC Peak Tailing: Causes and Solutions" |
| `content` | string | 完整的Markdown内容 | "# Introduction\n\nPeak tailing is..." |

### 可选字段

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `excerpt` | string | null | 文章摘要（最多500字符） |
| `coverImage` | string | null | 封面图URL |
| `authorName` | string | "ROWELL Team" | 作者名称 |
| `status` | enum | "draft" | 文章状态：`draft`、`published`、`archived` |
| `language` | string | "en" | 语言代码：`en`、`zh`、`es`等 |
| `categoryName` | string | null | 分类名称（自动创建） |
| `tags` | string[] | [] | 标签数组 |
| `featured` | boolean | false | 是否为精选文章 |

---

## 💻 使用示例

### 示例1：使用cURL发布文章

```bash
curl -X POST https://rowellhplc.com/api/trpc/resources.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{"json":{
    "title": "HPLC Peak Tailing: Causes and Solutions",
    "content": "# Introduction\n\nPeak tailing is one of the most common issues in HPLC analysis...\n\n## Causes\n\n1. **Column overload**\n2. **pH mismatch**\n3. **Secondary interactions**\n\n## Solutions\n\n### 1. Optimize mobile phase pH\n...",
    "excerpt": "Learn how to identify and fix peak tailing issues in HPLC chromatography",
    "coverImage": "https://example.com/peak-tailing-cover.jpg",
    "status": "published",
    "language": "en",
    "categoryName": "Technical Articles",
    "tags": ["HPLC", "Peak Tailing", "Troubleshooting"],
    "featured": true
  }}'
```

### 示例2：使用JavaScript/Node.js

```javascript
const apiKey = 'rowell_fff6d961c76a55982da165ba02114e65';
const apiUrl = 'https://rowellhplc.com/api/trpc/resources.create';

const article = {
  title: "HPLC Peak Tailing: Causes and Solutions",
  content: `# Introduction

Peak tailing is one of the most common issues in HPLC analysis...

## Video Tutorial

<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

## Causes

1. **Column overload**
2. **pH mismatch**
3. **Secondary interactions**

## Solutions

### 1. Optimize mobile phase pH
...`,
  excerpt: "Learn how to identify and fix peak tailing issues in HPLC chromatography",
  coverImage: "https://example.com/peak-tailing-cover.jpg",
  status: "published",
  language: "en",
  categoryName: "Technical Articles",
  tags: ["HPLC", "Peak Tailing", "Troubleshooting"],
  featured: true
};

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({ json: article })
});

const result = await response.json();

if (result.result?.data?.success) {
  console.log('✅ Article published successfully!');
  console.log(`Article URL: https://rowellhplc.com${result.result.data.url}`);
  console.log(`Article ID: ${result.result.data.id}`);
  console.log(`Slug: ${result.result.data.slug}`);
} else {
  console.error('❌ Failed to publish article:', result);
}
```

### 示例3：使用Python

```python
import requests
import json

api_key = 'rowell_fff6d961c76a55982da165ba02114e65'
api_url = 'https://rowellhplc.com/api/trpc/resources.create'

article = {
    'title': 'HPLC Peak Tailing: Causes and Solutions',
    'content': '''# Introduction

Peak tailing is one of the most common issues in HPLC analysis...

## Video Tutorial

<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>

## Causes

1. **Column overload**
2. **pH mismatch**
3. **Secondary interactions**

## Solutions

### 1. Optimize mobile phase pH
...''',
    'excerpt': 'Learn how to identify and fix peak tailing issues in HPLC chromatography',
    'coverImage': 'https://example.com/peak-tailing-cover.jpg',
    'status': 'published',
    'language': 'en',
    'categoryName': 'Technical Articles',
    'tags': ['HPLC', 'Peak Tailing', 'Troubleshooting'],
    'featured': True
}

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {api_key}'
}

response = requests.post(api_url, headers=headers, json={'json': article})
result = response.json()

if result.get('result', {}).get('data', {}).get('success'):
    print('✅ Article published successfully!')
    print(f"Article URL: https://rowellhplc.com{result['result']['data']['url']}")
    print(f"Article ID: {result['result']['data']['id']}")
    print(f"Slug: {result['result']['data']['slug']}")
else:
    print('❌ Failed to publish article:', result)
```

---

## 🎯 API响应格式

### 成功响应

```json
{
  "result": {
    "data": {
      "success": true,
      "id": 1,
      "slug": "hplc-peak-tailing-causes-and-solutions",
      "url": "/resources/hplc-peak-tailing-causes-and-solutions"
    }
  }
}
```

### 错误响应

```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

常见错误代码：
- `UNAUTHORIZED`: 未提供API Key或API Key无效
- `FORBIDDEN`: API Key没有`resources:create`权限
- `BAD_REQUEST`: 请求数据格式错误
- `INTERNAL_SERVER_ERROR`: 服务器内部错误

---

## 📊 数据库表结构（参考）

```sql
CREATE TABLE `resources` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `slug` varchar(255) UNIQUE NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `excerpt` varchar(500),
  `coverImage` varchar(500),
  `authorName` varchar(100) DEFAULT 'ROWELL Team',
  `status` enum('draft', 'published', 'archived') DEFAULT 'draft',
  `language` varchar(10) DEFAULT 'en',
  `categoryId` int,
  `viewCount` int DEFAULT 0,
  `featured` boolean DEFAULT false,
  `publishedAt` datetime,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔒 安全最佳实践

1. **不要在前端代码中暴露API Key**
   - API Key应该只在服务器端使用
   - 不要提交到Git仓库

2. **使用环境变量存储API Key**
   ```bash
   export ROWELL_API_KEY="rowell_fff6d961c76a55982da165ba02114e65"
   ```

3. **定期轮换API Key**
   - 建议每6个月更换一次API Key
   - 如果怀疑泄露，立即联系我撤销

4. **监控API使用情况**
   - 系统会记录每次API Key的使用时间
   - 如发现异常使用，请立即报告

---

## 🆘 故障排查

### 问题1：401 Unauthorized

**原因**：API Key无效或未提供

**解决方案**：
- 检查Authorization header格式：`Bearer rowell_xxx...`
- 确认API Key完整且正确
- 确认API Key未被撤销

### 问题2：403 Forbidden

**原因**：API Key没有`resources:create`权限

**解决方案**：
- 联系我检查API Key权限配置

### 问题3：400 Bad Request

**原因**：请求数据格式错误

**解决方案**：
- 检查JSON格式是否正确
- 确认必填字段（title、content）已提供
- 检查字段类型是否匹配

### 问题4：文章未显示在网站上

**原因**：文章状态为`draft`

**解决方案**：
- 确保`status`字段设置为`"published"`

---

## 📞 技术支持

如有任何问题，请随时联系我：

- **开发团队**: ROWELL HPLC网站建设总工程师
- **联系方式**: 通过Manus AI任务系统

---

## ✅ 下一步行动

1. ✅ **保存API Key**到您的密码管理器或环境变量
2. ✅ **测试API调用**：使用上面的示例代码发布一篇测试文章
3. ✅ **配置自动化系统**：将API Key集成到您的内容发布流程
4. ✅ **开始发布**：发布首批10篇文章

祝发布顺利！🚀
