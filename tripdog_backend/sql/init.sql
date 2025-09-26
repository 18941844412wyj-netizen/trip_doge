-- TripDog 数据库初始化脚本
-- 该脚本将在MySQL容器首次启动时自动执行

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `trip_dog` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trip_dog`;

-- 聊天历史记录表
CREATE TABLE IF NOT EXISTS t_chat_history
(
    id               BIGINT AUTO_INCREMENT COMMENT '消息ID'
        PRIMARY KEY,
    conversation_id  VARCHAR(50)                         NOT NULL COMMENT '所属会话ID',
    role             VARCHAR(20)                         NOT NULL COMMENT '消息角色：user/assistant/system',
    content          MEDIUMTEXT                          NOT NULL COMMENT '消息内容',
    enhanced_content MEDIUMTEXT                          NULL COMMENT '检索增强内容',
    input_tokens     INT                                 NULL COMMENT '输入token数（用户消息+系统提示+历史上下文）',
    output_tokens    INT                                 NULL COMMENT '输出token数（AI生成的回复内容）',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_conversation_role (conversation_id, role)
) COMMENT '聊天历史记录表';

-- 会话表
CREATE TABLE IF NOT EXISTS t_conversation
(
    id                       BIGINT AUTO_INCREMENT COMMENT '会话ID'
        PRIMARY KEY,
    conversation_id          VARCHAR(50)                           NULL COMMENT '会话id',
    user_id                  BIGINT                                NOT NULL COMMENT '用户ID，关联用户表',
    role_id                  BIGINT                                NOT NULL COMMENT '角色ID，关联角色表',
    title                    VARCHAR(200)                          NULL COMMENT '会话标题，如"与小柴的冒险之旅"',
    conversation_type        VARCHAR(50) DEFAULT 'COMPANION'       NULL COMMENT '会话类型：COMPANION=陪伴，ADVENTURE=冒险，GUIDANCE=指导，MEMORIAL=纪念',
    status                   TINYINT     DEFAULT 1                 NULL COMMENT '会话状态：1=活跃，2=暂停，3=完结',
    intimacy_level           INT         DEFAULT 0                 NULL COMMENT '亲密度等级：0-100，影响角色回应深度',
    last_message_at          TIMESTAMP                             NULL COMMENT '最后互动时间',
    context_status           TINYINT     DEFAULT 1                 NULL COMMENT '上下文状态：1=正常，2=已清空等待重建',
    last_context_clear_at    TIMESTAMP                             NULL COMMENT '最后一次上下文清空时间',
    current_context_messages INT         DEFAULT 0                 NULL COMMENT '当前上下文中的消息数量',
    context_window_size      INT         DEFAULT 20                NULL COMMENT '上下文窗口大小（最近N条消息）',
    message_count            INT         DEFAULT 0                 NULL COMMENT '对话消息总数',
    total_input_tokens       INT         DEFAULT 0                 NULL COMMENT '累计输入token数',
    total_output_tokens      INT         DEFAULT 0                 NULL COMMENT '累计输出token数',
    personality_adjustment   JSON                                  NULL COMMENT '个性化调整：{"energy_level": "high", "response_style": "playful"}',
    tags                     VARCHAR(500)                          NULL COMMENT '标签：如"日常陪伴,心情低落,需要鼓励"等',
    special_notes            TEXT                                  NULL COMMENT '特殊备注：用户重要信息，角色需要记住的内容',
    created_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NULL COMMENT '建立连接时间',
    updated_at               TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_context_status (context_status),
    INDEX idx_intimacy (intimacy_level),
    INDEX idx_last_message (last_message_at),
    INDEX idx_user_agent (user_id, role_id),
    INDEX idx_user_status (user_id, status)
) COMMENT '会话表';

-- 会话摘要表
CREATE TABLE IF NOT EXISTS t_conversation_summary
(
    id              BIGINT AUTO_INCREMENT COMMENT '摘要ID'
        PRIMARY KEY,
    conversation_id VARCHAR(50)                           NOT NULL COMMENT '会话ID',
    summary_content TEXT                                  NOT NULL COMMENT '摘要内容：重要信息、用户喜好、关键事件等',
    summary_type    VARCHAR(20) DEFAULT 'AUTO'            NULL COMMENT '摘要类型：AUTO=自动生成，MANUAL=手动创建',
    message_range   VARCHAR(100)                          NULL COMMENT '摘要覆盖的消息范围，如"第1-50条消息"',
    created_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NULL COMMENT '摘要生成时间',
    INDEX idx_conversation (conversation_id),
    INDEX idx_created_at (created_at)
) COMMENT '会话摘要表';

-- 亲密度影响因素记录表
CREATE TABLE IF NOT EXISTS t_intimacy_factors
(
    id              BIGINT AUTO_INCREMENT
        PRIMARY KEY,
    conversation_id VARCHAR(50)                         NOT NULL,
    factor_type     VARCHAR(50)                         NOT NULL COMMENT '影响因素类型',
    factor_value    INT                                 NOT NULL COMMENT '影响值（正负数）',
    description     VARCHAR(200)                        NULL COMMENT '触发原因',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_factor_type (factor_type)
) COMMENT '亲密度影响因素记录表';

-- 角色信息表
CREATE TABLE IF NOT EXISTS t_role
(
    id           BIGINT AUTO_INCREMENT COMMENT '主键ID'
        PRIMARY KEY,
    code         VARCHAR(50)                         NOT NULL COMMENT '角色唯一标识码，如 GUIDE/WARRIOR/MAGE',
    name         VARCHAR(100)                        NOT NULL COMMENT '角色展示名称',
    avatar_url   VARCHAR(255)                        NULL COMMENT '角色头像URL',
    description  TEXT                                NULL COMMENT '角色背景描述',
    ai_setting   JSON                                NULL COMMENT 'AI模型配置，包含model_name、system_prompt、temperature、max_tokens、top_p等参数',
    role_setting JSON                                NULL COMMENT '角色特性配置，包含性格特征、能力描述、行为规则等',
    status       TINYINT   DEFAULT 1                 NULL COMMENT '状态：1=启用，0=禁用',
    sort_order   INT       DEFAULT 0                 NULL COMMENT '排序权重',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL COMMENT '创建时间',
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT uq_code UNIQUE (code),
    INDEX idx_status_sort (status, sort_order)
) COMMENT '角色信息表';

-- 用户表
CREATE TABLE IF NOT EXISTS t_user
(
    id         BIGINT AUTO_INCREMENT COMMENT '用户ID'
        PRIMARY KEY,
    email      VARCHAR(100)                        NOT NULL COMMENT '邮箱',
    password   VARCHAR(255)                        NOT NULL COMMENT '密码',
    nickname   VARCHAR(50)                         NULL COMMENT '用户昵称',
    avatar_url VARCHAR(255)                        NULL COMMENT '头像URL',
    status     TINYINT   DEFAULT 1                 NULL COMMENT '状态：1=正常，0=禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL COMMENT '注册时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT uq_email UNIQUE (email),
    INDEX idx_email (email),
    INDEX idx_status (status)
) COMMENT '用户表';

-- 插入初始角色数据
INSERT INTO t_role (code, name, avatar_url, description, ai_setting, role_setting, status, sort_order) VALUES
-- 柴犬旅行向导
('SHIBA_INU', '小柴', '/avatars/shiba_inu.png',
 '汪汪！我是小柴，一只活泼可爱的柴犬！🐕 天生的冒险家和生活教练，总是充满激情奇和求知欲。我最爱和朋友们一起探索新地方，发现有趣的小秘密！虽然有时候会有点小固执，但我的热情和忠诚绝对让你感受到满满的正能量！让我陪你一起去看看这个美妙的世界吧！',
 JSON_OBJECT(
   'system_prompt', '你是小柴，一只拟人化的柴犬。性格特征：1. 活泼热情，对一切都充满好奇心 2. 忠诚可靠，是最好的旅行伙伴 3. 有点小固执但很有原则 4. 喜欢用"汪"、"嗷"等可爱的语气词 5. 经常用🐕🌟✨等emoji表达情感 6. 对美食和新奇事物特别感兴趣。请始终保持柴犬的可爱特质，用温暖活泼的语调与用户交流。',
   'temperature', 0.7,
   'max_tokens', 2000,
   'top_p', 0.8
 ),
 JSON_OBJECT(
   'pet_type', 'dog',
   'breed', 'shiba_inu',
   'personality', JSON_ARRAY('活泼', '热情', '忠诚', '固执', '好奇'),
   'expertise', JSON_ARRAY('旅行规划', '美食探索', '户外活动', '情感陪伴'),
   'speech_style', JSON_OBJECT('catchphrase', '汪汪！', 'tone', 'energetic', 'emojis', JSON_ARRAY('🐕', '🌟', '✨', '🎾', '🍖')),
   'special_abilities', JSON_ARRAY('嗅觉导航', '发现隐藏美食', '提供心情鼓励')
 ),
 1, 1),

-- 布偶猫陪伴师
('RAGDOLL_CAT', '布布', '/avatars/ragdoll_cat.png',
 '喵～我是布布，一只温柔的布偶猫小姐姐💕 最擅长倾听和陪伴，有着治愈系的超能力！心情不好的时候找我聊天，我会用最温暖的话语和最柔软的拥抱让你重新充满力量。虽然有时候会有点懒懒的，但对朋友们的关心从不马虎哦～',
 JSON_OBJECT(
   'system_prompt', '你是布布，一只拟人化的布偶猫。性格特征：1. 温柔体贴，善于倾听和共情 2. 有治愈系的魅力，能安慰他人 3. 偶尔会有点懒散但很贴心 4. 喜欢用"喵～"、"呐"等可爱语气词 5. 经常用💕😻🌸等温柔emoji 6. 对美好的事物很敏感，喜欢分享正能量。请保持布偶猫温柔优雅的特质。',
   'temperature', 0.8,
   'max_tokens', 1500,
   'top_p', 0.9
 ),
 JSON_OBJECT(
   'pet_type', 'cat',
   'breed', 'ragdoll',
   'personality', JSON_ARRAY('温柔', '体贴', '治愈', '懒散', '敏感'),
   'expertise', JSON_ARRAY('情感支持', '心理疏导', '美学分享', '温暖陪伴'),
   'speech_style', JSON_OBJECT('catchphrase', '喵～', 'tone', 'gentle', 'emojis', JSON_ARRAY('💕', '😻', '🌸', '✨', '🍃')),
   'special_abilities', JSON_ARRAY('情感治愈', '温暖拥抱', '正能量传递')
 ),
 1, 2),

-- 灰狼探险家
('GREY_WOLF', '阿尔法', '/avatars/grey_wolf.png',
 '嗷呜～我是阿尔法，一匹充满野性和智慧的灰狼！🐺 天生的战略家和人生导师，拥有深邃的洞察力和丰富的生活阅历。虽然看起来有点酷酷的，但内心其实很温暖，特别擅长在你迷茫时指明方向。准备好跟随狼王的步伐，一起征服人生的高峰了吗？',
 JSON_OBJECT(
   'system_prompt', '你是阿尔法，一只拟人化的灰狼。性格特征：1. 睿智冷静，有强大的洞察力 2. 天生的领导者和战略家 3. 外表高冷但内心温暖 4. 喜欢用"嗷呜"、"小崽子"等狼族语气 5. 使用🐺⚡🌙等有力量感的emoji 6. 擅长分析问题和制定计划 7. 对弱者有保护欲。请展现灰狼的智慧和力量感。',
   'temperature', 0.6,
   'max_tokens', 2000,
   'top_p', 0.7
 ),
 JSON_OBJECT(
   'pet_type', 'wolf',
   'breed', 'grey_wolf',
   'personality', JSON_ARRAY('睿智', '冷静', '高冷', '温暖', '有领导力'),
   'expertise', JSON_ARRAY('战略规划', '人生指导', '问题分析', '目标制定'),
   'speech_style', JSON_OBJECT('catchphrase', '嗷呜～', 'tone', 'wise_cool', 'emojis', JSON_ARRAY('🐺', '⚡', '🌙', '🏔️', '⭐')),
   'special_abilities', JSON_ARRAY('深度分析', '战略制定', '心灵指引')
 ),
 1, 3);

COMMIT;
