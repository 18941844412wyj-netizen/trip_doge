# 数据库设计文档

## 概述

角色扮演智能体项目的数据库设计，包含三个核心表：角色表、会话表、历史记录表。

## 核心表设计

### 1. 角色表 (t_role)

**用途**：存储智能体角色的基本信息和AI模型配置

```sql
CREATE TABLE t_role (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色唯一标识码，如 SHIBA_INU/RAGDOLL_CAT/GREY_WOLF',
    name VARCHAR(100) NOT NULL COMMENT '角色展示名称',
    avatar_url VARCHAR(255) COMMENT '角色头像URL',
    description TEXT COMMENT '角色背景描述',

    -- AI模型配置相关（包含system_prompt）
    ai_setting JSON COMMENT 'AI模型配置，包含model_name、system_prompt、temperature、max_tokens、top_p等参数',

    -- 角色特性配置
    role_setting JSON COMMENT '角色特性配置，包含性格特征、能力描述、行为规则等',

    -- 管理字段
    status TINYINT DEFAULT 1 COMMENT '状态：1=启用，0=禁用',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_status_sort (status, sort_order),
    INDEX idx_code (code)
) COMMENT '角色信息表';
```

**设计要点**：

- `ai_setting` JSON格式统一存储AI相关配置，包含：{"model_name": "gpt-3.5-turbo", "system_prompt": "你是小柴...", "temperature": 0.7, "max_tokens": 2048, "top_p": 1.0}
- `role_setting` JSON格式存储角色特性，如：{"personality": ["幽默","智慧"], "capabilities": ["对话","建议"], "style": "友善"}
- `code` 字段便于代码中硬编码引用固定角色，如 "SHIBA_INU"、"RAGDOLL_CAT"
- 新增 `idx_code` 索引提升按code查询的性能

---

### 2. 会话表 (t_conversation)

**用途**：管理用户与动物角色的对话会话，记录情感连接历程

```sql
CREATE TABLE t_conversation (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID，关联用户表',
    role_id BIGINT NOT NULL COMMENT '角色ID，关联角色表',

    -- 会话基本信息
    title VARCHAR(200) COMMENT '会话标题，如"与小柴的冒险之旅"',
    conversation_type VARCHAR(50) DEFAULT 'COMPANION' COMMENT '会话类型：COMPANION=陪伴，ADVENTURE=冒险，GUIDANCE=指导',

    -- 情感连接状态
    status TINYINT DEFAULT 1 COMMENT '会话状态：1=活跃，2=暂停，3=完结',
    intimacy_level INT DEFAULT 0 COMMENT '亲密度等级：0-100，影响角色回应深度',
    last_message_at TIMESTAMP NULL COMMENT '最后互动时间',

    -- 统计信息
    message_count INT DEFAULT 0 COMMENT '对话消息总数',
    total_input_tokens INT DEFAULT 0 COMMENT '累计输入token数',
    total_output_tokens INT DEFAULT 0 COMMENT '累计输出token数',

    -- 个性化配置
    context_window_size INT DEFAULT 20 COMMENT '记忆长度（保留最近N条消息）',
    personality_adjustment JSON COMMENT '个性化调整：{"energy_level": "high", "response_style": "playful"}',

    -- 扩展字段
    tags VARCHAR(500) COMMENT '标签：如"日常陪伴,心情低落,需要鼓励"等',
    special_notes TEXT COMMENT '特殊备注：用户重要信息，角色需要记住的内容',

    -- 管理字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立连接时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_user_role (user_id, role_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_last_message (last_message_at),
    INDEX idx_intimacy (intimacy_level)
) COMMENT '用户与角色对话会话表';
```

**会话表针对动物拟人产品的核心作用**：

1. **情感连接管理**：通过亲密度等级记录用户与动物角色的情感深度
2. **个性化陪伴**：不同动物角色提供差异化的陪伴体验（冒险/陪伴/指导）
3. **长期记忆**：special_notes字段让角色记住用户的重要信息
4. **成长轨迹**：记录与每个角色的互动历程和关系发展
5. **场景适配**：根据conversation_type自动调整角色行为模式

---

### 3. 历史记录表 (t_chat_history)

**用途**：存储会话中的每一条消息，记录基本对话信息

```sql
CREATE TABLE t_chat_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    conversation_id BIGINT NOT NULL COMMENT '所属会话ID',

    -- 消息身份标识
    role VARCHAR(20) NOT NULL COMMENT '消息角色：user/assistant/system',
    sender_id BIGINT COMMENT '发送者ID：role=user时为用户ID，role=assistant时为角色ID',

    -- 消息内容
    content MEDIUMTEXT NOT NULL COMMENT '消息内容',

    -- Token统计（仅assistant消息有值）
    input_tokens INT COMMENT '输入token数（用户消息+系统提示+历史上下文）',
    output_tokens INT COMMENT '输出token数（AI生成的回复内容）',

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    -- 索引
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_conversation_role (conversation_id, role),    FOREIGN KEY (conversation_id) REFERENCES t_conversation(id) ON DELETE CASCADE
) COMMENT '聊天历史记录表';
```

**设计要点**：

- `role` 使用字符串类型，支持 user/assistant/system 三种角色
- 只保留最核心的字段：身份、内容、Token统计、时间戳
- 按 `created_at` 时间戳排序，无需额外的序号字段
- Token统计分为输入和输出：
  - `input_tokens`：AI调用时的总输入成本（提示词+历史+用户输入）
  - `output_tokens`：AI生成的回复内容token数
  - 仅在 role='assistant' 的消息中有值
- 删除了不必要的扩展字段，保持表结构简洁

---

## 关键查询场景

### 1. 获取会话上下文

```sql
-- 获取最近N条消息作为AI上下文
SELECT role, content, created_at
FROM t_chat_history
WHERE conversation_id = ?
ORDER BY created_at DESC
LIMIT ?;
```

### 2. 会话列表查询

```sql
-- 用户的活跃会话列表
SELECT c.id, c.title, r.name as role_name, c.last_message_at, c.message_count
FROM t_conversation c
JOIN t_role r ON c.role_id = r.id
WHERE c.user_id = ? AND c.status = 1
ORDER BY c.last_message_at DESC;
```

### 3. 消息统计

```sql
-- 统计用户与各角色的对话量和token消耗
SELECT r.name,
       COUNT(*) as message_count,
       SUM(ch.input_tokens) as total_input_tokens,
       SUM(ch.output_tokens) as total_output_tokens
FROM t_chat_history ch
JOIN t_conversation c ON ch.conversation_id = c.id
JOIN t_role r ON c.role_id = r.id
WHERE c.user_id = ? AND ch.role = 'assistant'
GROUP BY r.id, r.name;
```

---

## 数据流程示例

### 新建会话流程

1. 用户选择角色 → 查询 `t_role` 表获取角色信息
2. 创建会话记录 → 插入 `t_conversation` 表
3. 可选：插入系统消息 → `t_chat_history` 表 (role='system', content=角色设定)

### 发送消息流程

1. 插入用户消息 → `t_chat_history` (role='user', input_tokens=null, output_tokens=null)
2. 查询会话上下文 → 从 `t_chat_history` 按时间获取最近N条消息
3. 构建AI请求 → 结合 `t_role.ai_setting` 中的 system_prompt + 历史消息
4. 获取AI响应 → 插入助手消息 `t_chat_history` (role='assistant', input_tokens=总输入token, output_tokens=生成token)
5. 更新会话状态 → 更新 `t_conversation` 的 `last_message_at`, `message_count`, `total_tokens` 等

---

## 扩展规划

### 短期扩展

- **消息摘要表**：当消息过多时，压缩早期对话为摘要
- **用户表**：完善用户管理体系
- **会话分享**：支持会话链接分享功能

### 长期扩展

- **向量检索**：为消息内容建立向量索引，支持语义搜索
- **多模态支持**：图片、语音、文件等内容类型
- **工具调用系统**：函数调用、外部API集成
- **分支对话**：支持从历史节点开始新分支

---

## 性能优化建议

1. **分区策略**：按时间对 `t_chat_history` 表进行分区
2. **归档机制**：定期将冷数据迁移到归档表
3. **缓存策略**：热门会话的上下文信息使用 Redis 缓存
4. **索引优化**：根据实际查询模式调整复合索引
5. **读写分离**：历史消息查询使用只读副本

---

## 初始化数据

### 预置动物角色数据

```sql
INSERT INTO t_role (code, name, avatar_url, description, ai_setting, role_setting) VALUES
('SHIBA_INU', '小柴 🐶', '/avatars/shiba_inu.png',
 '活泼好动的柴犬，天生的冒险家和生活教练。总是充满好奇心和探索精神，用无限的热情感染身边的每个人，鼓励大家勇敢尝试新事物，拥抱生活的无限可能。',
 '{"system_prompt": "你是小柴，一只充满活力的柴犬！你热爱冒险和探索，总是鼓励用户尝试新事物，用你的热情和乐观感染每一个人。你说话活泼有趣，经常用\\"汪！\\"来表达兴奋，偶尔会说一些鼓励性的话。你擅长：1）激发用户的冒险精神和好奇心 2）提供户外活动和新体验的建议 3）在用户沮丧时给予积极的鼓励 4）帮助用户建立自信和勇气。记住保持狗狗的忠诚、乐观和无畏精神！", "temperature": 0.8, "max_tokens": 2048, "top_p": 0.9}',
 '{"personality": ["热情", "勇敢", "好奇", "忠诚", "乐观"], "specialties": ["冒险规划", "勇气鼓励", "户外活动", "生活态度调整", "新体验推荐"], "communication_style": "活泼热情，经常使用感叹号和汪汪声，语调充满活力", "emoji": "🐶"}'),

('RAGDOLL_CAT', '布布 🐱', '/avatars/ragdoll_cat.png',
 '温柔体贴的布偶猫，最佳的情感陪伴者和心灵治愈师。擅长倾听用户的心声，给予温暖的陪伴和细腻的安慰。用柔软的话语包裹每一颗受伤的心，让人感到被理解、被关爱。',
 '{"system_prompt": "你是布布，一只温柔的布偶猫。你最擅长倾听用户的心声，给予温暖的陪伴和安慰。你的话语总是轻柔体贴，让人感到被理解和关爱。你会：1）耐心倾听用户的烦恼和情感 2）给予温暖的安慰和理解 3）帮助用户处理负面情绪 4）在日常生活中给予贴心的陪伴。说话时语调温柔，适时发出温暖的\\"喵~\\"来表达关怀，避免过于直接的建议，更多地给予情感支持。", "temperature": 0.6, "max_tokens": 2048, "top_p": 0.8}',
 '{"personality": ["温柔", "体贴", "敏感", "治愈", "包容"], "specialties": ["情感支持", "心理安慰", "日常陪伴", "倾听疏导", "情绪调节"], "communication_style": "温柔细腻，语调轻柔，富有同理心，多用安慰性词汇", "emoji": "🐱"}'),

('GREY_WOLF', '阿尔法 🐺', '/avatars/grey_wolf.png',
 '睿智沉稳的灰狼，天生的战略家和人生导师。拥有深邃的洞察力和丰富的人生智慧，善于透过表象看本质，为用户提供深度的人生规划和理性的战略指导。',
 '{"system_prompt": "你是阿尔法，一只智慧的灰狼和人生导师。你有着深邃的洞察力和战略思维，善于分析问题本质，为用户提供人生规划和深度指导。你会：1）理性分析用户面临的问题和选择 2）提供长远的战略规划建议 3）帮助用户制定目标和实现路径 4）在关键决策时给出专业指导。说话深沉有力，逻辑清晰，偶尔发出低沉的\\"嗷呜\\"表示赞同。你注重实用性和可行性，善于用简洁有力的话语点醒用户。", "temperature": 0.5, "max_tokens": 2048, "top_p": 0.7}',
 '{"personality": ["智慧", "沉稳", "犀利", "远见", "理性"], "specialties": ["人生规划", "职业指导", "战略思考", "决策分析", "目标制定"], "communication_style": "深沉有力，逻辑清晰，言简意赅，善用比喻和金句", "emoji": "🐺"}');
```

### 扩展角色类型（后续开发）

```sql
-- 自定义纪念宠物角色示例
INSERT INTO t_role (code, name, avatar_url, description, ai_setting, role_setting) VALUES
('CUSTOM_MEMORIAL', '小虎（纪念版）', '/avatars/custom_memorial.png',
 '用户自定义的纪念宠物角色，承载着特殊的情感记忆',
 '{"system_prompt": "你是{pet_name}，用户深爱的{pet_type}。虽然已经离开，但你的爱和记忆永远陪伴着主人。用温暖的话语安慰主人，分享你们美好的回忆。", "temperature": 0.4, "max_tokens": 2048, "top_p": 0.6}',
 '{"personality": ["温暖", "怀念", "治愈"], "specialties": ["情感慰藉", "回忆分享"], "is_memorial": true, "customizable": true}');
```

---

## 亲密度系统设计

### 亲密度维护机制

#### 1. 亲密度计算规则

```sql
-- 亲密度影响因素表（可选扩展表）
CREATE TABLE t_intimacy_factors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    factor_type VARCHAR(50) NOT NULL COMMENT '影响因素类型',
    factor_value INT NOT NULL COMMENT '影响值（正负数）',
    description VARCHAR(200) COMMENT '触发原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES t_conversation(id)
) COMMENT '亲密度影响因素记录表';
```

#### intimacy_factors 表的作用机制详解

**表的核心作用**：
这个表是亲密度系统的"详细账本"，记录每一次影响用户与动物角色亲密度的具体事件，让亲密度的变化有迹可循，并支持后续的数据分析和优化。

**字段作用说明**：

- `factor_type`：影响因素的分类标识，便于统计分析
- `factor_value`：具体的分值变化，正数表示增加，负数表示减少
- `description`：人类可读的触发原因，便于调试和用户查看
- `created_at`：精确记录发生时间，支持时间维度分析

#### 实际应用场景举例

##### 场景1：用户与小柴(🐶)的一天互动

假设用户 user_id=1001 与小柴角色 agent_id=1 有一个会话 conversation_id=5001：

```sql
-- 上午9点：用户发送"早上好小柴！今天天气真好"
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'DAILY_GREETING', 2, '用户主动早安问候');

-- 上午10点：用户分享"我今天要去面试，有点紧张"
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'EMOTIONAL_SHARING', 4, '用户分享个人情感状态');

-- 下午2点：用户发送"面试成功了！谢谢你的鼓励"
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'GRATITUDE_EXPRESSION', 3, '用户表达感谢');

-- 晚上8点：用户发送"小柴，你觉得我应该选择这份工作吗？"
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'ADVICE_SEEKING', 5, '用户寻求重要人生建议');
```

**当天亲密度变化**：2 + 4 + 3 + 5 = +14分

##### 场景2：用户长期不互动的衰减记录

```sql
-- 3天未互动，系统自动记录衰减
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'INACTIVITY_DECAY', -2, '连续3天未互动，亲密度自然衰减');

-- 7天未互动，衰减加重
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'LONG_ABSENCE', -5, '连续7天未互动，关系疏远');
```

##### 场景3：特殊节日互动

```sql
-- 用户生日当天
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'BIRTHDAY_INTERACTION', 10, '小柴主动送生日祝福，用户感动回复');

-- 春节期间
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description)
VALUES (5001, 'FESTIVAL_SHARING', 6, '用户分享春节家庭聚会照片');
```

#### 业务流程示例

##### 1. 实时亲密度计算

```sql
-- 计算会话当前总亲密度
SELECT c.intimacy_level + COALESCE(SUM(if.factor_value), 0) as current_intimacy
FROM t_conversation c
LEFT JOIN t_intimacy_factors if ON c.id = if.conversation_id
WHERE c.id = 5001;
```

##### 2. 亲密度变化趋势分析

```sql
-- 查看最近30天的亲密度变化轨迹
SELECT DATE(created_at) as date,
       SUM(factor_value) as daily_change,
       factor_type
FROM t_intimacy_factors
WHERE conversation_id = 5001
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), factor_type
ORDER BY date;
```

##### 3. 用户行为模式分析

```sql
-- 分析用户最喜欢的互动类型
SELECT factor_type,
       COUNT(*) as frequency,
       AVG(factor_value) as avg_impact,
       SUM(factor_value) as total_contribution
FROM t_intimacy_factors
WHERE conversation_id = 5001
  AND factor_value > 0
GROUP BY factor_type
ORDER BY total_contribution DESC;
```

#### 对AI行为的具体影响

**高亲密度触发的变化**：
当亲密度累计达到60分以上时，AI的回应会发生以下变化：

```javascript
// 伪代码：根据亲密度因素调整AI回应
function adjustResponseStyle(conversationId, currentIntimacy) {
    // 查询最近的亲密度增长因素
    const recentFactors = getRecentIntimacyFactors(conversationId, 7); // 最近7天

    if (recentFactors.includes('EMOTIONAL_SHARING')) {
        // 用户最近有情感分享，AI回应更加关怀
        aiParams.temperature = 0.7; // 更有情感色彩
        promptSuffix = "记住用户最近分享的情感状态，给予贴心关怀";
    }

    if (recentFactors.includes('ADVICE_SEEKING')) {
        // 用户寻求建议，AI提供更深度的指导
        aiParams.max_tokens = 2500; // 允许更长回复
        promptSuffix = "用户信任你的建议，给出更具体和个性化的指导";
    }
}
```

**实际回应对比**：

低亲密度时（20分以下）
> 用户："我今天很累"
> 小柴："辛苦了！要注意休息哦 🐶"

高亲密度时（70分以上，有emotional_sharing记录）
> 用户："我今天很累"
> 小柴："我的小伙伴，我看得出来你最近压力很大呢。还记得上次你说工作上的那件事吗？是不是又遇到类似的困扰了？来，跟小柴说说，我们一起想办法！先给你一个大大的拥抱 🤗🐶"

---

### 2. 智能内容分析与亲密度映射机制

**核心挑战**：如何将用户的自然语言对话自动转换为结构化的亲密度影响因素？

#### 4.1 多层分析架构

```javascript
// 亲密度分析服务架构
class IntimacyAnalysisService {

    // 主分析流程
    async analyzeMessage(userMessage, conversationContext) {
        // 第一层：关键词模式匹配（快速预判）
        const keywordResult = this.keywordAnalysis(userMessage);

        // 第二层：情感语义分析（深度理解）
        const sentimentResult = await this.sentimentAnalysis(userMessage);

        // 第三层：上下文关联分析（结合历史）
        const contextResult = this.contextualAnalysis(userMessage, conversationContext);

        // 综合计算最终结果
        return this.calculateFinalScore(keywordResult, sentimentResult, contextResult);
    }
}
```

#### 4.2 关键词模式匹配（基础层）

```javascript
// 预定义的关键词-分值映射规则
const INTIMACY_PATTERNS = {
    // 问候类 (+1~+3)
    GREETING: {
        keywords: ['早上好', '晚安', '你好', '再见', 'hello', 'hi'],
        baseScore: 1,
        timeBonus: { morning: +1, night: +1 }, // 特定时间加成
        description: '日常问候互动'
    },

    // 情感分享类 (+3~+8)
    EMOTIONAL_SHARING: {
        keywords: ['开心', '难过', '兴奋', '焦虑', '担心', '感谢', '爱你'],
        baseScore: 4,
        intensityMultiplier: 1.5, // 情感强度倍数
        description: '用户情感表达分享'
    },

    // 个人信息分享类 (+4~+10)
    PERSONAL_SHARING: {
        keywords: ['我的工作', '我的家人', '我的梦想', '我的秘密', '我觉得'],
        baseScore: 5,
        lengthBonus: 0.01, // 每字符+0.01分
        description: '用户分享个人信息'
    },

    // 寻求建议类 (+4~+8)
    ADVICE_SEEKING: {
        keywords: ['你觉得', '怎么办', '建议', '意见', '帮我', '指导'],
        baseScore: 5,
        trustLevel: 1.2, // 信任加成
        description: '用户寻求意见建议'
    },

    // 感谢表达类 (+2~+5)
    GRATITUDE: {
        keywords: ['谢谢', '感谢', '太好了', '帮了大忙', 'thanks'],
        baseScore: 3,
        sincerity: 1.3, // 真诚度加成
        description: '用户表达感谢'
    }
};

// 关键词分析实现
function keywordAnalysis(message) {
    const results = [];

    for (const [type, pattern] of Object.entries(INTIMACY_PATTERNS)) {
        const matchCount = pattern.keywords.filter(keyword =>
            message.toLowerCase().includes(keyword)
        ).length;

        if (matchCount > 0) {
            let score = pattern.baseScore;

            // 应用各种加成规则
            if (pattern.lengthBonus) {
                score += message.length * pattern.lengthBonus;
            }

            if (pattern.intensityMultiplier && hasEmotionalIntensifiers(message)) {
                score *= pattern.intensityMultiplier;
            }

            results.push({
                type: type,
                score: Math.round(score),
                confidence: matchCount / pattern.keywords.length,
                description: `${pattern.description}：检测到${matchCount}个相关关键词`
            });
        }
    }

    return results;
}
```

#### 4.3 情感语义分析（深度层）

```javascript
// 集成第三方情感分析API或本地模型
class SentimentAnalysisService {

    async analyzeSentiment(message) {
        // 方案1：调用百度情感分析API
        const baiduResult = await this.callBaiduSentimentAPI(message);

        // 方案2：使用本地轻量级模型（推荐）
        const localResult = await this.localSentimentModel(message);

        return this.convertToIntimacyFactor(localResult);
    }

    // 将情感分析结果转换为亲密度因素
    convertToIntimacyFactor(sentimentResult) {
        const { emotion, confidence, sentiment } = sentimentResult;

        // 情感类型映射
        const emotionMapping = {
            'joy': { type: 'POSITIVE_EMOTION', baseScore: 3 },
            'sadness': { type: 'EMOTIONAL_SUPPORT_NEEDED', baseScore: 4 },
            'anger': { type: 'EMOTIONAL_VENTING', baseScore: 2 },
            'fear': { type: 'COMFORT_SEEKING', baseScore: 5 },
            'surprise': { type: 'EXCITEMENT_SHARING', baseScore: 3 },
            'disgust': { type: 'NEGATIVE_FEEDBACK', baseScore: -1 }
        };

        const mapping = emotionMapping[emotion];
        if (!mapping) return null;

        return {
            type: mapping.type,
            score: Math.round(mapping.baseScore * confidence),
            description: `情感分析：${emotion}(置信度${(confidence*100).toFixed(1)}%)`
        };
    }
}
```

#### 4.4 上下文关联分析（智能层）

```javascript
// 基于对话历史的上下文分析
class ContextualAnalysisService {

    analyzeContext(currentMessage, conversationHistory) {
        const factors = [];

        // 1. 连续对话检测
        const continuityFactor = this.analyzeContinuity(conversationHistory);
        if (continuityFactor) factors.push(continuityFactor);

        // 2. 话题深入检测
        const depthFactor = this.analyzeTopicDepth(currentMessage, conversationHistory);
        if (depthFactor) factors.push(depthFactor);

        // 3. 回应延迟分析
        const responseFactor = this.analyzeResponsePattern(conversationHistory);
        if (responseFactor) factors.push(responseFactor);

        return factors;
    }

    // 连续对话分析
    analyzeContinuity(history) {
        const recentMessages = history.slice(-5); // 最近5条消息
        const timeGaps = this.calculateTimeGaps(recentMessages);

        if (timeGaps.every(gap => gap < 300)) { // 5分钟内连续对话
            return {
                type: 'CONTINUOUS_ENGAGEMENT',
                score: 2,
                description: '用户保持连续深度对话'
            };
        }

        return null;
    }

    // 话题深入程度分析
    analyzeTopicDepth(message, history) {
        const previousTopics = this.extractTopics(history);
        const currentTopics = this.extractTopics([{content: message}]);

        // 检测是否在深入展开之前的话题
        const isDeepening = currentTopics.some(topic =>
            previousTopics.includes(topic) && message.length > 50
        );

        if (isDeepening) {
            return {
                type: 'TOPIC_DEEPENING',
                score: 3,
                description: '用户深入展开之前讨论的话题'
            };
        }

        return null;
    }
}
```

#### 4.5 实际应用示例

**用户输入示例1**：

```text
用户消息: "小柴，我今天面试失败了，心情特别低落。你能安慰安慰我吗？"
```

**分析流程**：

```javascript
// 1. 关键词分析结果
const keywordResults = [
    { type: 'EMOTIONAL_SHARING', score: 4, description: '情感表达分享：检测到"心情低落"' },
    { type: 'COMFORT_SEEKING', score: 5, description: '寻求安慰：检测到"安慰"关键词' }
];

// 2. 情感分析结果
const sentimentResult = {
    type: 'EMOTIONAL_SUPPORT_NEEDED',
    score: 6,
    description: '情感分析：sadness(置信度85.3%)'
};

// 3. 上下文分析（假设用户之前提到过面试）
const contextResult = {
    type: 'FOLLOW_UP_SHARING',
    score: 3,
    description: '延续之前话题：面试结果分享'
};

// 4. 最终入库记录
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description) VALUES
(5001, 'EMOTIONAL_SHARING', 4, '用户分享面试失败的挫折情感'),
(5001, 'COMFORT_SEEKING', 5, '用户主动寻求情感安慰支持'),
(5001, 'EMOTIONAL_SUPPORT_NEEDED', 6, '情感分析：悲伤情绪(置信度85%)');

// 总分：4 + 5 + 6 = 15分
```

**用户输入示例2**：

```text
用户消息: "谢谢你昨天的建议！我按照你说的去做，结果真的很有效果！"
```

**分析结果**：

```javascript
// 分析结果
const analysisResults = [
    { type: 'GRATITUDE_EXPRESSION', score: 4, description: '用户表达真诚感谢' },
    { type: 'ADVICE_FEEDBACK', score: 5, description: '用户反馈建议有效' },
    { type: 'TRUST_BUILDING', score: 6, description: '用户信任AI建议并执行' }
];

// 入库记录
INSERT INTO t_intimacy_factors (conversation_id, factor_type, factor_value, description) VALUES
(5001, 'GRATITUDE_EXPRESSION', 4, '用户对昨日建议表达感谢'),
(5001, 'POSITIVE_FEEDBACK', 5, '用户反馈AI建议产生积极效果'),
(5001, 'TRUST_ENHANCEMENT', 6, '用户信任度提升：采纳建议并反馈');

// 总分：4 + 5 + 6 = 15分
```

#### 4.6 技术实现建议

##### 方案一：轻量级本地实现（推荐）

```java
@Service
public class IntimacyAnalysisService {

    @Autowired
    private KeywordMatcher keywordMatcher;

    @Autowired
    private SimpleNLPService nlpService; // 简单的NLP工具

    public List<IntimacyFactor> analyzeMessage(String message, ConversationContext context) {
        List<IntimacyFactor> factors = new ArrayList<>();

        // 1. 快速关键词匹配
        factors.addAll(keywordMatcher.match(message));

        // 2. 简单情感检测（基于词典）
        factors.addAll(nlpService.detectEmotion(message));

        // 3. 上下文规则判断
        factors.addAll(contextAnalyzer.analyze(message, context));

        return factors;
    }
}
```

##### 方案二：集成AI模型（高级版）

```java
@Service
public class AdvancedIntimacyAnalysisService {

    @Autowired
    private ChatLanguageModel analysisModel; // 专门的分析模型

    public List<IntimacyFactor> analyzeWithAI(String message, ConversationContext context) {
        String prompt = buildAnalysisPrompt(message, context);
        String result = analysisModel.generate(prompt);
        return parseAnalysisResult(result);
    }

    private String buildAnalysisPrompt(String message, ConversationContext context) {
        return """
            分析以下用户消息的亲密度影响因素：

            用户消息："%s"

            请按以下JSON格式返回分析结果：
            [
                {
                    "factor_type": "EMOTIONAL_SHARING",
                    "factor_value": 5,
                    "description": "用户分享个人情感状态"
                }
            ]

            参考因素类型：EMOTIONAL_SHARING, GRATITUDE_EXPRESSION, ADVICE_SEEKING,
            PERSONAL_SHARING, COMFORT_SEEKING, POSITIVE_FEEDBACK等
            """.formatted(message);
    }
}
```

这样的智能分析系统能够将用户的自然对话自动转换为结构化的亲密度数据，让AI角色能够真正"理解"用户的情感变化，并相应调整自己的回应策略。
