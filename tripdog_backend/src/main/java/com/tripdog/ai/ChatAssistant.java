package com.tripdog.ai;

import dev.langchain4j.service.TokenStream;

/**
 * @author: iohw
 * @date: 2025/9/22 23:13
 * @description:
 */
public interface ChatAssistant {
    TokenStream chat(String message);
}
