package com.tripdog.model.req;

import lombok.Data;

/**
 * @author: iohw
 * @date: 2025/9/23 23:45
 * @description:
 */
@Data
public class ChatRequest {
    private Long userId;
    private String roleId;
    private String message;
}
