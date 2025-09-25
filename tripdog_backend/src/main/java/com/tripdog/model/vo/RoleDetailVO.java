package com.tripdog.model.vo;

import lombok.Data;

/**
 * 角色详情VO - 包含完整的角色配置信息
 *
 * @author: iohw
 * @date: 2025/9/25
 */
@Data
public class RoleDetailVO {

    /**
     * 角色ID
     */
    private Long id;

    /**
     * 角色代码
     */
    private String code;

    /**
     * 角色名称
     */
    private String name;

    /**
     * 头像URL
     */
    private String avatarUrl;

    /**
     * 角色描述
     */
    private String description;

    /**
     * 系统提示词
     */
    private String systemPrompt;

    /**
     * 性格特征
     */
    private String[] personality;

    /**
     * 专长领域
     */
    private String[] specialties;

    /**
     * 沟通风格
     */
    private String communicationStyle;

    /**
     * 代表表情符号
     */
    private String emoji;

    /**
     * 常用口头禅
     */
    private String[] catchphrases;

    /**
     * AI模型参数 - temperature
     */
    private Double temperature;

    /**
     * AI模型参数 - max_tokens
     */
    private Integer maxTokens;

    /**
     * AI模型参数 - top_p
     */
    private Double topP;

    /**
     * 排序顺序
     */
    private Integer sortOrder;
}
