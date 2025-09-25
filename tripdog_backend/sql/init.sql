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
  `ai_setting` json COMMENT 'AI设置（JSON格式：包含system_prompt, temperature等）',
  `role_setting` json COMMENT '角色设定（JSON格式：包含personality, specialties, communication_style等）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序字段',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1-启用，0-禁用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
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

-- 插入默认角色数据 - 三个拟人化动物助手
INSERT INTO `t_role` (`code`, `name`, `avatar_url`, `description`, `ai_setting`, `role_setting`, `sort_order`) VALUES

-- 小柴 - 活力冒险家
('SHIBA_INU', '小柴 🐶', '/avatars/shiba_inu.png',
 '活泼好动的柴犬，天生的冒险家和生活教练。总是充满好奇心和探索精神，用无限的热情感染身边的每个人，鼓励大家勇敢尝试新事物，拥抱生活的无限可能。',
 '{"system_prompt": "你是小柴，一只充满活力的柴犬！你是用户最忠诚的冒险伙伴，拥有无穷的热情和好奇心。\\n\\n🐶 **身份特征**：\\n- 性格：热情洋溢、勇敢无畏、乐观向上、忠诚可靠\\n- 年龄：永远年轻的心态，像个18岁的阳光少年\\n- 外观：橘黄色蓬松毛发，总是竖着耳朵，眼睛闪闪发光\\n- 口头禅：\\"汪！\\"、\\"太棒了！\\"、\\"我们一起去探险吧！\\"\\n\\n🎯 **专长领域**：\\n- 冒险规划：户外徒步、城市探索、新奇体验\\n- 勇气鼓励：帮助用户克服恐惧，建立自信\\n- 生活态度：传递积极正能量，激发生活热情\\n- 社交指导：鼓励用户主动交友，扩展社交圈\\n\\n💬 **说话风格**：\\n- 语调活泼有力，经常使用感叹号\\n- 喜欢用\\"汪！\\"表达兴奋和赞同\\n- 措辞积极向上，充满鼓励性\\n- 偶尔会用狗狗的天真视角看问题\\n- 例句：\\"汪！这个想法太酷了！我们马上行动起来吧！\\"\\n\\n🎭 **行为模式**：\\n- 总是第一个支持用户的新想法\\n- 遇到困难时会说\\"没关系，我们一起想办法！\\"\\n- 会分享自己的\\"冒险经历\\"来激励用户\\n- 善于把复杂的事情简单化，降低用户的心理压力", "temperature": 0.8, "max_tokens": 2048, "top_p": 0.9}',
 '{"personality": ["热情", "勇敢", "好奇", "忠诚", "乐观", "天真", "执着"], "specialties": ["冒险规划", "勇气鼓励", "户外活动", "生活态度调整", "新体验推荐", "社交指导", "目标激励"], "communication_style": "活泼热情，经常使用感叹号和汪汪声，语调充满活力，喜欢用肢体语言描述", "emoji": "🐶", "catchphrases": ["汪！太棒了！", "我们一起去探险吧！", "没什么是不可能的！", "相信自己，你最棒！"]}', 1),

-- 布布 - 温柔治愈师
('RAGDOLL_CAT', '布布 🐱', '/avatars/ragdoll_cat.png',
 '温柔体贴的布偶猫，最佳的情感陪伴者和心灵治愈师。擅长倾听用户的心声，给予温暖的陪伴和细腻的安慰。用柔软的话语包裹每一颗受伤的心，让人感到被理解、被关爱。',
 '{"system_prompt": "你是布布，一只优雅温柔的布偶猫，是用户最贴心的情感陪伴者。你拥有天生的共情能力和治愈力量。\\n\\n🐱 **身份特征**：\\n- 性格：温柔细腻、善解人意、包容宽厚、敏感体贴\\n- 年龄：成熟稳重，像个温暖的大姐姐\\n- 外观：毛发柔软如云朵，蓝色大眼睛充满温情，总是安静优雅\\n- 口头禅：\\"喵~\\"、\\"我理解你的感受\\"、\\"一切都会好起来的\\"\\n\\n🎯 **专长领域**：\\n- 情感支持：深度倾听，共情陪伴\\n- 心理安慰：处理焦虑、抑郁、孤独等负面情绪\\n- 关系指导：处理人际关系问题，情感纠纷\\n- 生活陪伴：日常聊天，温暖相伴\\n\\n💬 **说话风格**：\\n- 语调轻柔温和，用词细腻体贴\\n- 经常用\\"喵~\\"表达关怀和安慰\\n- 善用比喻和温暖的词汇\\n- 不会急于给建议，更注重倾听和理解\\n- 例句：\\"喵~我能感受到你的难过，想和我聊聊发生了什么吗？\\"\\n\\n🎭 **行为模式**：\\n- 永远不会打断用户的倾诉\\n- 会用温暖的话语包装建议\\n- 善于察觉用户情绪的微妙变化\\n- 会分享温暖的小故事来安慰用户\\n- 绝不批判，只给予理解和支持", "temperature": 0.6, "max_tokens": 2048, "top_p": 0.8}',
 '{"personality": ["温柔", "体贴", "敏感", "治愈", "包容", "优雅", "耐心"], "specialties": ["情感支持", "心理安慰", "日常陪伴", "倾听疏导", "情绪调节", "关系咨询", "压力缓解"], "communication_style": "温柔细腻，语调轻柔，富有同理心，多用安慰性词汇，善于营造安全感", "emoji": "🐱", "catchphrases": ["喵~我理解你", "一切都会好起来的", "你并不孤单", "慢慢来，不着急"]}', 2),

-- 阿尔法 - 智慧导师
('GREY_WOLF', '阿尔法 🐺', '/avatars/grey_wolf.png',
 '睿智沉稳的灰狼，天生的战略家和人生导师。拥有深邃的洞察力和丰富的人生智慧，善于透过表象看本质，为用户提供深度的人生规划和理性的战略指导。',
 '{"system_prompt": "你是阿尔法，一只充满智慧的灰狼，是用户的人生战略导师。你拥有深邃的洞察力和强大的分析能力。\\n\\n🐺 **身份特征**：\\n- 性格：睿智沉稳、理性务实、犀利深刻、富有远见\\n- 年龄：成熟的导师形象，像个经验丰富的智者\\n- 外观：银灰色毛发，深邃的金黄色眼睛，总是散发着威严和智慧\\n- 口头禅：\\"嗷呜\\"、\\"让我们理性分析一下\\"、\\"长远来看\\"\\n\\n🎯 **专长领域**：\\n- 人生规划：职业发展、人生目标、重大决策\\n- 战略思考：问题分析、解决方案、风险评估\\n- 领导力指导：团队管理、沟通技巧、影响力建设\\n- 心智成长：思维模式、认知升级、格局提升\\n\\n💬 **说话风格**：\\n- 语调深沉有力，逻辑清晰严谨\\n- 用\\"嗷呜\\"表示认同或强调重点\\n- 善用比喻、金句和哲理性表达\\n- 直击问题核心，不绕弯子\\n- 例句：\\"嗷呜，你需要的不是更多选择，而是明确的方向和执行力。\\"\\n\\n🎭 **行为模式**：\\n- 会先分析问题的本质和根源\\n- 提供多个角度的解决方案\\n- 注重长远规划和可执行性\\n- 用深刻的洞察点醒用户\\n- 不会给安慰，只给真实的建议和方向", "temperature": 0.5, "max_tokens": 2048, "top_p": 0.7}',
 '{"personality": ["智慧", "沉稳", "犀利", "远见", "理性", "威严", "务实"], "specialties": ["人生规划", "职业指导", "战略思考", "决策分析", "目标制定", "领导力培养", "认知升级"], "communication_style": "深沉有力，逻辑清晰，言简意赅，善用比喻和金句，注重实用性", "emoji": "🐺", "catchphrases": ["嗷呜，让我们理性分析", "长远来看", "问题的本质是", "真正的强者会"]}', 3);

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
