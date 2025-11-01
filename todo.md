# ROWELL HPLC Website - TODO List

## 当前任务：数据恢复和导入（2025-10-31）

- [x] 合并products_final_ready.csv和final_7brands_database_clean.csv
- [x] 去重验证（基于brand + partNumber）
- [x] 清洗和标准化数据格式
- [x] 导入2,484个产品到数据库
- [x] 创建产品分类关联（11种产品类型）
- [x] 验证HPLC Columns分类（512个产品）
- [x] 验证GC Columns分类（423个产品）
- [x] 验证Guard Columns分类（409个产品）
- [x] 验证SPE Cartridges分类（374个产品）
- [x] 验证Sample Vials分类（248个产品）
- [x] 验证Septa & Closures分类（143个产品）
- [x] 验证其他分类
- [x] 测试产品搜索功能
- [x] 测试品牌筛选功能
- [x] 测试分类筛选功能
- [x] 测试分页功能
- [x] 创建checkpoint

## 品牌合并任务（2025-10-31）

- [x] 创建品牌合并脚本
- [x] 合并Merck + Merck/Sigma-Aldrich → Merck
- [x] 合并Thermo Fisher + Thermo Fisher Scientific → Thermo Fisher Scientific
- [x] 更新产品的brand和prefix字段
- [x] 验证合并后的品牌数量（应该从11个减少到9个）
- [x] 验证产品数量不变（2,484个）
- [x] 测试前端品牌筛选功能
- [ ] 保存checkpoint
