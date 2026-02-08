-- 创建客户留言/询价表
CREATE TABLE IF NOT EXISTS `customer_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('inquiry', 'message', 'quote_request') NOT NULL COMMENT '留言类型',
  `name` VARCHAR(100) NOT NULL COMMENT '客户姓名',
  `email` VARCHAR(255) NOT NULL COMMENT '客户邮箱',
  `phone` VARCHAR(50) COMMENT '客户电话',
  `company` VARCHAR(255) COMMENT '公司名称',
  `subject` VARCHAR(255) COMMENT '主题',
  `message` TEXT NOT NULL COMMENT '留言内容',
  `productId` VARCHAR(50) COMMENT '产品ID',
  `productName` VARCHAR(255) COMMENT '产品名称',
  `productPartNumber` VARCHAR(100) COMMENT '产品Part Number',
  `status` ENUM('new', 'read', 'replied', 'closed') NOT NULL DEFAULT 'new' COMMENT '状态',
  `ipAddress` VARCHAR(45) COMMENT 'IP地址',
  `userAgent` TEXT COMMENT '用户代理',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `repliedAt` TIMESTAMP NULL COMMENT '回复时间',
  
  INDEX `idx_customer_messages_type` (`type`),
  INDEX `idx_customer_messages_status` (`status`),
  INDEX `idx_customer_messages_email` (`email`),
  INDEX `idx_customer_messages_createdAt` (`createdAt`),
  INDEX `idx_customer_messages_productId` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户留言和询价表';
