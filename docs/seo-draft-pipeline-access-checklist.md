# ROWELL SEO草稿流水线：账户接入与运行清单

**状态：** 等待账户侧最小权限接入；代码默认禁用，未连接GSC、Gemini或生产数据库写入。

## 1. Google Cloud与Search Console

创建专用服务账号，建议显示名称为 `rowell-gsc-seo-draft-readonly`。该身份不需要、也不应获得项目Owner、Editor、Storage、BigQuery或任何写入权限。

在Google Cloud项目中启用 **Google Search Console API**。在Search Console的 `https://www.rowellhplc.com/` 属性中，将服务账号邮箱添加为 **Full** 或至少能够执行Search Analytics查询的读取身份；不得授予站点所有权、DNS或索引提交相关权限。仅允许代码请求 `https://www.googleapis.com/auth/webmasters.readonly`。

为服务账号生成一个JSON密钥。密钥只可一次下载，且不得提交到Git、放入`.env`、聊天消息、日志、报告、浏览器控制台或客户端包。部署时将JSON文件整体进行Base64编码后写入Render的受保护环境变量 `GSC_SERVICE_ACCOUNT_JSON_B64`，原始文件随后应从本地临时位置删除。

需要确认Search Console property ID。若该属性是URL-prefix属性，则值应精确为：

```text
https://www.rowellhplc.com/
```

若实际使用的是Domain property，则必须改用Google控制台中显示的 `sc-domain:...` 值，不能猜测。

## 2. Gemini API

在业务方拥有并启用计费的Google AI Studio或Google Cloud项目中创建专用API key，建议名称为 `rowell-seo-draft-worker`。将其限制为生成式语言服务相关API，并尽可能限制到Render运行出口或受控服务；不要把浏览器用、开发用和生产任务用API key混用。

该密钥仅写入Render服务端环境变量：

```text
GEMINI_API_KEY
```

可选模型变量：

```text
GEMINI_MODEL=gemini-2.5-flash
```

模型变更前必须验证其支持JSON结构化输出，并在staging以严格schema测试通过。

## 3. Render环境变量

以下变量需在**独立周度任务**中设置；主Web Service仅需要数据库与管理员会话变量，不需要Gemini或GSC凭据，除非未来业务方明确需要管理员页读取外部结果（当前设计不需要）。

| 变量 | 示例形态 | 作用 |
|---|---|---|
| `DATABASE_URL` | Render受保护连接字符串 | 仅供任务读取产品并写入SEO草稿/审计表；不在代码或日志中输出。 |
| `GSC_SITE_URL` | `https://www.rowellhplc.com/` | Search Console property ID，必须与控制台精确一致。 |
| `GSC_SERVICE_ACCOUNT_JSON_B64` | Base64文本 | 专用只读服务账号JSON整体编码；不使用单独私钥变量。 |
| `GEMINI_API_KEY` | 受保护密钥 | 仅用于服务端草稿生成。 |
| `GEMINI_MODEL` | `gemini-2.5-flash` | 可审核的模型选择。 |
| `SEO_DRAFT_PIPELINE_ENABLED` | `false`（初始） | 总开关；只有凭据、试运行和管理员审核准备完成后才改为`true`。 |
| `SEO_DRAFT_MAX_CANDIDATES` | `5` | 单次最多候选数，硬上限10。 |
| `SEO_DRAFT_MIN_IMPRESSIONS` | `50` | 低点击候选的最小展示阈值。 |
| `SEO_DRAFT_MAX_CLICKS` | `0` | 高展示零点击优先；变更须有业务审查。 |
| `SEO_DRAFT_GSC_ROW_LIMIT` | `5000` | GSC API读取上限，硬上限25,000。 |

## 4. 独立周度任务配置

Render构建命令：

```text
pnpm install --frozen-lockfile && pnpm run build:seo-draft
```

Render启动命令：

```text
pnpm run start:seo-draft
```

建议计划：**每周一 01:15 UTC**，对应上海时间周一09:15。Render Cron表达式使用UTC：

```text
15 1 * * 1
```

任务每次启动后只会：确保草稿审计表存在、读取GSC最终Web搜索28天窗口、选择不在实验保护清单内的活动PDP、读取已验证产品字段、请求Gemini生成JSON草稿、执行服务端双重QA、写入草稿或拒绝记录、退出。

任务不会：写入`products`、更新URL/图片/状态/规格、修改Sitemap/robots/JSON-LD、发邮件、读取客户留言、提交Google索引、创建Offer、输出密钥或绕过管理员审批。

## 5. 人工批准与生产写入

本基础实现还未部署管理员批准界面。后续批准功能将仅对`pending_review`草稿开放，并在同一事务中重新核验：草稿状态、活动状态、slug、品牌、料号、canonical URL、当前meta值、14条实验页排除、标题/描述长度及合规词拦截。任意一项失败即整批回滚；发布后必须公开SSR回读，且Product JSON-LD继续无Offer。

