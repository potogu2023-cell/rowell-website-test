# 资源中心API扩展文档

## 📋 概述

本文档描述资源中心的扩展API功能，包括文章删除、更新和查询接口。

**更新日期**: 2025-11-08  
**API版本**: v2.0  
**认证方式**: API Key (Bearer Token)

---

## 🔑 API Key信息

**API Key**: `rowell_fff6d961c76a55982da165ba02114e65`

**权限**:
- ✅ `resources:create` - 创建文章
- ✅ `resources:update` - 更新文章
- ✅ `resources:delete` - 删除文章
- ✅ `resources:list` - 查询所有文章（包括draft和archived）

---

## 🌐 API端点

**生产环境**: `https://rowellhplc.com/api/trpc`  
**开发环境**: `https://3000-ipywb5n7uqtmemlvkffh0-dc4281b8.manus-asia.computer/api/trpc`

---

## 📝 API #1: 删除文章 (Soft Delete)

### 端点
```
POST /api/trpc/resources.delete
```

### 认证
```
Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65
```

### 请求体
```json
{
  "json": {
    "id": 30011
  }
}
```

### 响应
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "id": 30011
      }
    }
  }
}
```

### 说明
- 采用**软删除**方式，将文章的`status`设置为`archived`
- 文章不会从数据库中物理删除
- 前端用户无法看到archived状态的文章
- 管理员可以通过list API查询archived文章

### cURL示例
```bash
curl -X POST "https://rowellhplc.com/api/trpc/resources.delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{
    "json": {
      "id": 30011
    }
  }'
```

### JavaScript示例
```javascript
const response = await fetch('https://rowellhplc.com/api/trpc/resources.delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer rowell_fff6d961c76a55982da165ba02114e65'
  },
  body: JSON.stringify({
    json: {
      id: 30011
    }
  })
});

const data = await response.json();
console.log(data.result.data.json); // { success: true, id: 30011 }
```

### Python示例
```python
import requests

url = "https://rowellhplc.com/api/trpc/resources.delete"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer rowell_fff6d961c76a55982da165ba02114e65"
}
payload = {
    "json": {
        "id": 30011
    }
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print(result["result"]["data"]["json"])  # {'success': True, 'id': 30011}
```

---

## 🔄 API #2: 更新文章

### 端点
```
POST /api/trpc/resources.update
```

### 认证
```
Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65
```

### 请求体（所有字段都是可选的）
```json
{
  "json": {
    "id": 30001,
    "title": "Updated Title",
    "content": "Updated content...",
    "excerpt": "Updated excerpt",
    "coverImage": "https://example.com/cover.jpg",
    "authorName": "ROWELL Team",
    "status": "published",
    "language": "en",
    "categoryName": "Technical Articles",
    "tags": ["HPLC", "Peak Splitting"],
    "featured": true,
    "publishedAt": "2024-04-20T10:00:00Z"
  }
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 文章ID（必填） |
| `title` | string | ❌ | 文章标题 |
| `content` | string | ❌ | Markdown内容 |
| `excerpt` | string | ❌ | 摘要（最多500字符） |
| `coverImage` | string | ❌ | 封面图片URL |
| `authorName` | string | ❌ | 作者名称 |
| `status` | enum | ❌ | 状态: `draft`, `published`, `archived` |
| `language` | string | ❌ | 语言代码: `en`, `zh`, `ru`, `es`, `ar`, `ja`, `pt`, `ko` |
| `categoryName` | string | ❌ | 分类名称（自动创建） |
| `tags` | array | ❌ | 标签数组 |
| `featured` | boolean | ❌ | 是否精选 |
| `publishedAt` | string | ❌ | **发布日期（ISO 8601格式）** |

### 响应
```json
{
  "result": {
    "data": {
      "json": {
        "success": true,
        "id": 30001
      }
    }
  }
}
```

### 使用场景

#### 场景1：调整文章发布日期
```bash
curl -X POST "https://rowellhplc.com/api/trpc/resources.update" \
  -H "Content-Type": "application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{
    "json": {
      "id": 30001,
      "publishedAt": "2024-04-20T10:00:00Z"
    }
  }'
```

#### 场景2：修改文章状态
```bash
curl -X POST "https://rowellhplc.com/api/trpc/resources.update" \
  -H "Content-Type": "application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{
    "json": {
      "id": 30001,
      "status": "archived"
    }
  }'
```

#### 场景3：更新文章内容和标签
```bash
curl -X POST "https://rowellhplc.com/api/trpc/resources.update" \
  -H "Content-Type": "application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{
    "json": {
      "id": 30001,
      "content": "# Updated Content\n\nNew content here...",
      "tags": ["HPLC", "Troubleshooting", "Peak Shape"]
    }
  }'
```

### JavaScript示例
```javascript
const response = await fetch('https://rowellhplc.com/api/trpc/resources.update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer rowell_fff6d961c76a55982da165ba02114e65'
  },
  body: JSON.stringify({
    json: {
      id: 30001,
      publishedAt: "2024-04-20T10:00:00Z"
    }
  })
});

const data = await response.json();
console.log(data.result.data.json); // { success: true, id: 30001 }
```

### Python示例
```python
import requests

url = "https://rowellhplc.com/api/trpc/resources.update"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer rowell_fff6d961c76a55982da165ba02114e65"
}
payload = {
    "json": {
        "id": 30001,
        "publishedAt": "2024-04-20T10:00:00Z"
    }
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()
print(result["result"]["data"]["json"])  # {'success': True, 'id': 30001}
```

---

## 📋 API #3: 查询文章列表

### 端点
```
GET /api/trpc/resources.list?input={encoded_json}
```

### 认证
```
Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65
```

### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | ❌ | 1 | 页码 |
| `pageSize` | number | ❌ | 12 | 每页数量（最大100） |
| `categoryId` | number | ❌ | - | 分类ID筛选 |
| `featured` | boolean | ❌ | - | 是否精选 |
| `language` | string | ❌ | - | 语言代码筛选 |
| `search` | string | ❌ | - | 搜索关键词 |
| `status` | enum | ❌ | `published` | **状态筛选（需要API Key权限）** |

### 响应
```json
{
  "result": {
    "data": {
      "json": {
        "articles": [
          {
            "id": 30001,
            "slug": "peak-splitting-in-hplc",
            "title": "Peak Splitting in HPLC",
            "excerpt": "Learn how to diagnose and fix peak splitting issues...",
            "coverImage": null,
            "authorName": "ROWELL Team",
            "status": "published",
            "language": "en",
            "categoryId": 30001,
            "viewCount": 0,
            "featured": 0,
            "publishedAt": "2024-04-20T10:00:00.000Z",
            "createdAt": "2025-11-08T07:34:08.000Z",
            "updatedAt": "2025-11-08T07:34:08.000Z",
            "category": {
              "id": 30001,
              "name": "Technical Articles",
              "slug": "technical-articles"
            },
            "tags": [
              {
                "id": 30001,
                "name": "HPLC",
                "slug": "hplc"
              }
            ]
          }
        ],
        "total": 10,
        "page": 1,
        "pageSize": 12,
        "totalPages": 1
      }
    }
  }
}
```

### 使用场景

#### 场景1：查询所有已发布的文章
```bash
curl -X GET "https://rowellhplc.com/api/trpc/resources.list?input=%7B%22json%22%3A%7B%22page%22%3A1%2C%22pageSize%22%3A20%7D%7D" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65"
```

#### 场景2：查询所有草稿文章（需要API Key）
```bash
curl -X GET "https://rowellhplc.com/api/trpc/resources.list?input=%7B%22json%22%3A%7B%22status%22%3A%22draft%22%7D%7D" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65"
```

#### 场景3：查询特定语言的文章
```bash
curl -X GET "https://rowellhplc.com/api/trpc/resources.list?input=%7B%22json%22%3A%7B%22language%22%3A%22zh%22%7D%7D" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65"
```

### JavaScript示例
```javascript
const params = new URLSearchParams({
  input: JSON.stringify({
    json: {
      page: 1,
      pageSize: 20,
      status: "published"
    }
  })
});

const response = await fetch(`https://rowellhplc.com/api/trpc/resources.list?${params}`, {
  headers: {
    'Authorization': 'Bearer rowell_fff6d961c76a55982da165ba02114e65'
  }
});

const data = await response.json();
console.log(data.result.data.json.articles);
```

### Python示例
```python
import requests
import json
from urllib.parse import urlencode

url = "https://rowellhplc.com/api/trpc/resources.list"
headers = {
    "Authorization": "Bearer rowell_fff6d961c76a55982da165ba02114e65"
}
params = {
    "input": json.dumps({
        "json": {
            "page": 1,
            "pageSize": 20,
            "status": "published"
        }
    })
}

response = requests.get(url, params=params, headers=headers)
result = response.json()
articles = result["result"]["data"]["json"]["articles"]
print(f"Found {len(articles)} articles")
```

---

## 🌐 多语言支持

### 支持的语言

| 语言 | 代码 | 说明 |
|------|------|------|
| 英文 | `en` | 默认语言 |
| 中文 | `zh` | 简体中文 |
| 俄语 | `ru` | Русский |
| 西班牙语 | `es` | Español |
| 阿拉伯语 | `ar` | العربية |
| 日语 | `ja` | 日本語 |
| 葡萄牙语 | `pt` | Português |
| 韩语 | `ko` | 한국어 |

### 前端语言筛选

资源中心页面会根据用户选择的语言自动筛选显示对应语言的文章：

- 用户选择英文 → 显示 `language = 'en'` 的文章
- 用户选择中文 → 显示 `language = 'zh'` 的文章
- 用户选择俄语 → 显示 `language = 'ru'` 的文章
- 依此类推

### 发布多语言文章示例

```bash
# 发布中文版本
curl -X POST "https://rowellhplc.com/api/trpc/resources.create" \
  -H "Content-Type": "application/json" \
  -H "Authorization: Bearer rowell_fff6d961c76a55982da165ba02114e65" \
  -d '{
    "json": {
      "title": "HPLC峰分裂：诊断与终极解决方案",
      "content": "在高效液相色谱（HPLC）中...",
      "excerpt": "学习如何诊断和修复HPLC峰分裂问题",
      "language": "zh",
      "status": "published",
      "categoryName": "技术文章",
      "tags": ["HPLC", "峰分裂", "故障排除"],
      "publishedAt": "2024-04-25T10:00:00Z"
    }
  }'
```

---

## 🔒 安全最佳实践

1. **保护API Key**: 不要在公开的代码仓库中暴露API Key
2. **使用HTTPS**: 始终使用HTTPS协议发送请求
3. **错误处理**: 实现适当的错误处理和重试机制
4. **速率限制**: 建议每分钟最多10次删除/更新操作

---

## ❌ 错误处理

### 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|---------|------|---------|
| `UNAUTHORIZED` | API Key无效或缺失 | 检查Authorization header |
| `FORBIDDEN` | API Key权限不足 | 确认API Key有对应权限 |
| `NOT_FOUND` | 文章不存在 | 检查文章ID是否正确 |
| `BAD_REQUEST` | 请求参数错误 | 检查请求体格式 |

### 错误响应示例
```json
{
  "error": {
    "json": {
      "message": "API key does not have resources:delete permission",
      "code": "FORBIDDEN"
    }
  }
}
```

---

## 📞 技术支持

如有任何问题，请通过Manus AI任务系统联系开发团队。

---

## 📋 Checklist

- [x] `resources.delete` API已开发并测试
- [x] `resources.update` API已开发并测试（支持publishedAt）
- [x] `resources.list` API已增强（支持status筛选）
- [x] API Key权限已扩展（update, delete, list）
- [x] 数据库字段已确认（publishedAt, language已存在）
- [x] 前端语言筛选逻辑已实现
- [x] 支持8种语言（en, zh, ru, es, ar, ja, pt, ko）
- [x] API文档已更新

---

**文档版本**: 2.0  
**最后更新**: 2025-11-08  
**维护者**: ROWELL HPLC开发团队
