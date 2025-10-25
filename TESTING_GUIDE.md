# ROWELL HPLC 测试网站 - 功能测试指南

## Phase A Sub-task 1: 客户注册系统和询价系统

### 已实现的功能

#### 1. 用户认证系统
- ✅ 邮箱+密码注册
- ✅ 登录/登出
- ✅ 用户资料管理
- ✅ 邮箱验证（占位符）
- ✅ 密码重置（占位符）

#### 2. 购物车/询价系统
- ✅ "Add to Inquiry" 按钮（仅对已登录用户可见）
- ✅ 购物车管理（添加、修改数量、删除）
- ✅ 询价清单提交
- ✅ 询价历史查看
- ✅ 询价详情查看

#### 3. Excel 生成和邮件通知
- ✅ 自动生成 Excel 格式询价单
- ✅ 发送询价通知到 info@rowellhplc.com（占位符）
- ✅ 发送确认邮件给客户（占位符）

---

## 测试流程

### 步骤 1: 用户注册
1. 访问网站首页
2. 点击右上角 "Register" 按钮
3. 填写注册表单：
   - **必填项**：姓名、邮箱、密码、公司、电话
   - **可选项**：国家、行业、采购角色、年采购量
4. 提交注册
5. 预期结果：显示成功消息，自动跳转到登录页面

### 步骤 2: 用户登录
1. 在登录页面输入邮箱和密码
2. 点击 "Login" 按钮
3. 预期结果：
   - 成功登录后跳转到首页
   - 导航栏显示 "Inquiry Cart" 按钮和用户下拉菜单
   - 右上角显示用户名

### 步骤 3: 浏览产品并添加到询价清单
1. 点击导航栏的 "Products"
2. 浏览产品列表（88个产品）
3. 使用搜索和品牌筛选功能
4. 在产品卡片上点击 "Add to Inquiry" 按钮
5. 预期结果：
   - 显示成功提示 "Product added to inquiry cart!"
   - 导航栏的 Inquiry Cart 按钮显示数量徽章

### 步骤 4: 管理询价清单
1. 点击导航栏的 "Inquiry Cart" 按钮
2. 查看已添加的产品
3. 修改产品数量
4. 删除不需要的产品
5. 预期结果：
   - 可以正常修改数量
   - 可以删除产品
   - 实时更新购物车

### 步骤 5: 提交询价
1. 在询价清单页面填写询价表单：
   - 紧急程度（Normal/Urgent/Very Urgent）
   - 预算范围（可选）
   - 应用说明（可选）
   - 交付地址（可选）
   - 其他备注（可选）
2. 点击 "Submit Inquiry" 按钮
3. 预期结果：
   - 显示成功消息，包含询价编号（如 INQ-20250125-001）
   - 自动跳转到询价历史页面
   - 购物车被清空
   - 服务器控制台显示 Excel 生成和邮件发送日志

### 步骤 6: 查看询价历史
1. 点击用户下拉菜单中的 "Inquiry History"
2. 查看所有询价记录
3. 点击某个询价查看详情
4. 预期结果：
   - 显示所有询价记录（按时间倒序）
   - 每个询价显示状态、紧急程度、产品数量
   - 点击后右侧显示详细信息（客户信息、产品清单、备注等）

### 步骤 7: 管理用户资料
1. 点击用户下拉菜单中的 "Profile"
2. 查看当前用户信息
3. 修改用户信息（姓名、公司、电话等）
4. 点击 "Update Profile" 按钮
5. 预期结果：
   - 显示成功消息
   - 用户信息更新成功

### 步骤 8: 登出
1. 点击用户下拉菜单中的 "Logout"
2. 预期结果：
   - 退出登录
   - 跳转到首页
   - 导航栏显示 "Login" 和 "Register" 按钮
   - 产品页面不再显示 "Add to Inquiry" 按钮

---

## 数据库验证

### 检查用户表
```sql
SELECT * FROM users ORDER BY createdAt DESC LIMIT 10;
```

### 检查购物车表
```sql
SELECT c.*, p.productId, p.brand 
FROM cart c 
LEFT JOIN products p ON c.productId = p.id 
ORDER BY c.createdAt DESC;
```

### 检查询价表
```sql
SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 10;
```

### 检查询价项目表
```sql
SELECT ii.*, p.productId, p.brand 
FROM inquiry_items ii 
LEFT JOIN products p ON ii.productId = p.id 
ORDER BY ii.createdAt DESC;
```

---

## 已知限制和待实现功能

### 当前限制
1. **邮件发送**：当前为占位符实现，仅打印日志。生产环境需要配置真实邮件服务（SendGrid、AWS SES 等）
2. **邮箱验证**：当前已禁用邮箱验证检查，用户注册后可直接登录
3. **密码重置**：API 已实现，但前端页面未创建
4. **WhatsApp 集成**：未实现

### Phase A 后续任务
1. **Sub-task 2**: 管理后台（管理员查看询价、更新状态、添加报价）
2. **Sub-task 3**: 数据分析功能（询价统计、热门产品、客户分析）
3. **Sub-task 4**: 邮件模板优化和真实邮件服务集成
4. **Sub-task 5**: WhatsApp 联系链接集成

---

## 技术栈

### 后端
- **框架**: Express + tRPC
- **数据库**: PostgreSQL (Drizzle ORM)
- **认证**: JWT + Session Cookie
- **Excel 生成**: ExcelJS

### 前端
- **框架**: React + Wouter (路由)
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS
- **状态管理**: TanStack Query (通过 tRPC)

### 数据库表结构
- `users` - 用户表（包含注册信息、公司信息等）
- `products` - 产品表（88个产品）
- `categories` - 分类表
- `product_categories` - 产品分类关联表
- `cart` - 购物车表
- `inquiries` - 询价表
- `inquiry_items` - 询价项目表

---

## 服务器日志示例

### 成功提交询价后的日志
```
[Email] Inquiry email notification:
  To: info@rowellhplc.com
  Subject: New Inquiry INQ-20250125-001 from John Doe
  Inquiry Number: INQ-20250125-001
  Customer: John Doe (john@example.com)
  Company: ABC Corp
  Total Items: 3
  Excel attachment size: 15234 bytes

[Email] Customer confirmation email:
  To: john@example.com
  Subject: Inquiry INQ-20250125-001 Received
  Customer: John Doe
  Inquiry Number: INQ-20250125-001
```

---

## 下一步建议

1. **测试完整流程**：按照上述步骤完整测试一遍
2. **检查数据库**：验证数据是否正确保存
3. **UI/UX 优化**：根据实际使用体验进行调整
4. **配置邮件服务**：集成真实邮件服务（如需要）
5. **开始 Phase A Sub-task 2**：实现管理后台功能

