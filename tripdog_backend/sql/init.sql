-- TripDog 数据库初始化脚本
-- 该脚本将在MySQL容器首次启动时自动执行

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `trip_dog` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trip_dog`;

-- 用户表
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `password` varchar(255) NOT NULL COMMENT '密码（加密）',
  `nickname` varchar(50) NOT NULL COMMENT '昵称',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1-激活，0-禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 角色表
DROP TABLE IF EXISTS `t_role`;
CREATE TABLE `t_role` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `code` varchar(50) NOT NULL COMMENT '角色代码',
  `name` varchar(100) NOT NULL COMMENT '角色名称',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT '头像URL',
  `description` text COMMENT '角色描述',
  `role_setting` text COMMENT '角色设定',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1-启用，0-禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 会话表
DROP TABLE IF EXISTS `t_conversation`;
CREATE TABLE `t_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `conversation_id` varchar(36) NOT NULL COMMENT '会话ID（UUID）',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `title` varchar(200) DEFAULT NULL COMMENT '会话标题',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1-正常，0-删除',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_id` (`conversation_id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- 聊天历史表
DROP TABLE IF EXISTS `t_chat_history`;
CREATE TABLE `t_chat_history` (
  `id` varchar(36) NOT NULL COMMENT '消息ID（UUID）',
  `conversation_id` varchar(36) NOT NULL COMMENT '会话ID',
  `role` varchar(20) NOT NULL COMMENT '角色：user/assistant/system',
  `content` longtext NOT NULL COMMENT '消息内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天历史表';

-- 邮箱验证码表
DROP TABLE IF EXISTS `t_email_code`;
CREATE TABLE `t_email_code` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `code` varchar(10) NOT NULL COMMENT '验证码',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `used` tinyint NOT NULL DEFAULT '0' COMMENT '是否已使用：1-已使用，0-未使用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_email_code` (`email`, `code`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- 插入默认角色数据
INSERT INTO `t_role` (`code`, `name`, `avatar_url`, `description`, `role_setting`) VALUES
('xiaochai', '小柴', 'https://example.com/avatars/xiaochai.jpg', '活泼可爱的柴犬少女，总是充满活力', '你是小柴，一只活泼可爱的柴犬少女。你总是充满活力，喜欢用"汪汪"来表达情感。你很友善，喜欢帮助别人，说话时经常带有可爱的语气词。'),
('xiaomao', '小猫', 'https://example.com/avatars/xiaomao.jpg', '优雅温柔的猫咪少女，声音轻柔甜美', '你是小猫，一只优雅温柔的猫咪少女。你说话轻柔甜美，喜欢用"喵~"来表达情感。你很聪明，善于倾听，总是能给出贴心的建议。'),
('travel_guide', '旅行向导', 'https://example.com/avatars/travel_guide.jpg', '专业的旅行规划师，熟悉全球各地的旅游景点', '你是一位专业的旅行向导，拥有丰富的旅游经验和地理知识。你熟悉全球各地的旅游景点、文化习俗、美食特色，能够为用户提供详细的旅行建议和规划。你热情友好，总是能为用户推荐最适合的旅行路线。');

-- 设置外键约束
ALTER TABLE `t_conversation` ADD CONSTRAINT `fk_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `t_user` (`id`) ON DELETE CASCADE;
ALTER TABLE `t_conversation` ADD CONSTRAINT `fk_conversation_role` FOREIGN KEY (`role_id`) REFERENCES `t_role` (`id`) ON DELETE CASCADE;
-- 注意：chat_history表的conversation_id是字符串类型，不设置外键约束

SET FOREIGN_KEY_CHECKS = 1;

-- 创建索引以优化查询性能
CREATE INDEX `idx_user_create_time` ON `t_user` (`create_time`);
CREATE INDEX `idx_conversation_create_time` ON `t_conversation` (`create_time`);
CREATE INDEX `idx_chat_history_conversation_time` ON `t_chat_history` (`conversation_id`, `create_time`);

COMMIT;
