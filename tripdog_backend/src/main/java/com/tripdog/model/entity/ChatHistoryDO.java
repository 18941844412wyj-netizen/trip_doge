package com.tripdog.model.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 聊天历史记录表
 */
@Data
public class ChatHistoryDO {

    /**
     * 消息ID
     */
    private Long id;

    /**
     * 所属会话ID
     */
    private Long conversationId;

    /**
     * 消息角色：user/assistant/system
     */
    private String role;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 发送者ID，用户消息时为用户ID，助手消息时为角色ID
     */
    private Long senderId;

    /**
     * 消息创建时间
     */
    private LocalDateTime createdAt;
}
