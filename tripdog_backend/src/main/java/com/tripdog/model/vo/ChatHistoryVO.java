package com.tripdog.model.vo;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 聊天历史VO
 *
 * @author: iohw
 * @date: 2025/9/26
 */
@Data
public class ChatHistoryVO {

    /**
     * 聊天历史ID
     */
    private Long id;

    /**
     * 会话ID
     */
    private String conversationId;

    /**
     * 角色ID
     */
    private Long roleId;

    /**
     * 消息类型（user/assistant/system）
     */
    private String messageType;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 输入令牌数
     */
    private Integer inputTokens;

    /**
     * 输出令牌数
     */
    private Integer outputTokens;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;
}
