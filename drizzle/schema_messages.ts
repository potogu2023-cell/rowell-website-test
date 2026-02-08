import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, index } from "drizzle-orm/mysql-core";

// 客户留言/询价表
export const customerMessages = mysqlTable("customer_messages", {
  id: int().autoincrement().notNull().primaryKey(),
  
  // 留言类型：inquiry(询价), message(留言), quote_request(报价请求)
  type: mysqlEnum(['inquiry', 'message', 'quote_request']).notNull(),
  
  // 客户信息
  name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  phone: varchar({ length: 50 }),
  company: varchar({ length: 255 }),
  
  // 留言内容
  subject: varchar({ length: 255 }),
  message: text().notNull(),
  
  // 产品信息（如果是产品相关）
  productId: varchar({ length: 50 }),
  productName: varchar({ length: 255 }),
  productPartNumber: varchar({ length: 100 }),
  
  // 状态管理
  status: mysqlEnum(['new', 'read', 'replied', 'closed']).default('new').notNull(),
  
  // IP和用户代理（用于防垃圾）
  ipAddress: varchar({ length: 45 }),
  userAgent: text(),
  
  // 时间戳
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  repliedAt: timestamp({ mode: 'string' }),
},
(table) => [
  index("idx_customer_messages_type").on(table.type),
  index("idx_customer_messages_status").on(table.status),
  index("idx_customer_messages_email").on(table.email),
  index("idx_customer_messages_createdAt").on(table.createdAt),
  index("idx_customer_messages_productId").on(table.productId),
]);
