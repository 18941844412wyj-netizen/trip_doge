-- 修改相关表结构，将所有ID字段改为UUID
-- 1. 修改 t_conversation 表：id 字段改为 VARCHAR(36)
-- 2. 修改 t_chat_history 表：删除 sender_id 字段，id 和 conversation_id 改为 VARCHAR(36)
-- 3. 修改 t_intimacy_factors 表：conversation_id 改为 VARCHAR(36)

-- 备份原表数据（可选）
-- CREATE TABLE t_conversation_backup AS SELECT * FROM t_conversation;
-- CREATE TABLE t_chat_history_backup AS SELECT * FROM t_chat_history;
-- CREATE TABLE t_intimacy_factors_backup AS SELECT * FROM t_intimacy_factors;

-- 1. 重新创建 t_conversation 表
DROP TABLE IF EXISTS t_conversation_new;
CREATE TABLE t_conversation_new (
    id VARCHAR(36) NOT NULL COMMENT '会话ID - UUID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    title VARCHAR(255) COMMENT '会话标题',
    conversation_type VARCHAR(50) DEFAULT 'COMPANION' COMMENT '会话类型：COMPANION=陪伴，ADVENTURE=冒险，GUIDANCE=指导',
    status INTEGER DEFAULT 1 COMMENT '会话状态：1=活跃，2=暂停，3=完结',
    intimacy_level INTEGER DEFAULT 0 COMMENT '亲密度等级：0-100',
    last_message_at TIMESTAMP COMMENT '最后互动时间',
    message_count INTEGER DEFAULT 0 COMMENT '对话消息总数',
    total_input_tokens INTEGER DEFAULT 0 COMMENT '累计输入token数',
    total_output_tokens INTEGER DEFAULT 0 COMMENT '累计输出token数',
    context_window_size INTEGER DEFAULT 20 COMMENT '记忆长度（保留最近N条消息）',
    personality_adjustment LONGTEXT COMMENT '个性化调整JSON',
    tags VARCHAR(500) COMMENT '标签',
    special_notes LONGTEXT COMMENT '特殊备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户与角色对话会话表';

-- 2. 重新创建 t_chat_history 表
DROP TABLE IF EXISTS t_chat_history_new;
CREATE TABLE t_chat_history_new (
    id VARCHAR(36) NOT NULL COMMENT '消息ID - UUID',
    conversation_id VARCHAR(36) NOT NULL COMMENT '所属会话ID',
    role VARCHAR(20) NOT NULL COMMENT '消息角色：user/assistant/system',
    content LONGTEXT NOT NULL COMMENT '消息内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '消息创建时间',
    PRIMARY KEY (id),
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_conversation_id (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天历史记录表';

-- 3. 重新创建 t_intimacy_factors 表
DROP TABLE IF EXISTS t_intimacy_factors_new;
CREATE TABLE t_intimacy_factors_new (
    id BIGINT AUTO_INCREMENT COMMENT '主键ID',
    conversation_id VARCHAR(36) NOT NULL COMMENT '会话ID',
    factor_type VARCHAR(50) NOT NULL COMMENT '影响因素类型',
    factor_value INTEGER NOT NULL COMMENT '影响因素数值',
    description VARCHAR(255) COMMENT '影响因素描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    PRIMARY KEY (id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_factor_type (factor_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='亲密度影响因素记录表';

-- 如果需要迁移已有数据，需要为每条记录生成UUID（这里只是示例，实际执行时需要根据具体情况调整）
-- INSERT INTO t_conversation_new (id, user_id, role_id, title, conversation_type, status, intimacy_level, last_message_at, message_count, total_input_tokens, total_output_tokens, context_window_size, personality_adjustment, tags, special_notes, created_at, updated_at)
-- SELECT UUID(), user_id, role_id, title, conversation_type, status, intimacy_level, last_message_at, message_count, total_input_tokens, total_output_tokens, context_window_size, personality_adjustment, tags, special_notes, created_at, updated_at FROM t_conversation;

-- INSERT INTO t_chat_history_new (id, conversation_id, role, content, created_at)
-- SELECT UUID(), (SELECT uuid_new.id FROM t_conversation_new uuid_new JOIN t_conversation old ON old.user_id = uuid_new.user_id AND old.role_id = uuid_new.role_id WHERE old.id = t_chat_history.conversation_id), role, content, created_at FROM t_chat_history;

-- INSERT INTO t_intimacy_factors_new (id, conversation_id, factor_type, factor_value, description, created_at)
-- SELECT id, (SELECT uuid_new.id FROM t_conversation_new uuid_new JOIN t_conversation old ON old.user_id = uuid_new.user_id AND old.role_id = uuid_new.role_id WHERE old.id = t_intimacy_factors.conversation_id), factor_type, factor_value, description, created_at FROM t_intimacy_factors;

-- 删除原表，重命名新表
DROP TABLE IF EXISTS t_conversation;
DROP TABLE IF EXISTS t_chat_history;
DROP TABLE IF EXISTS t_intimacy_factors;

RENAME TABLE t_conversation_new TO t_conversation;
RENAME TABLE t_chat_history_new TO t_chat_history;
RENAME TABLE t_intimacy_factors_new TO t_intimacy_factors;
