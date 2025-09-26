package com.tripdog.ai;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.tripdog.ai.assistant.ChatAssistant;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.RequiredArgsConstructor;

/**
 * @author: iohw
 * @date: 2025/9/24 22:21
 * @description:
 */
@Configuration
@RequiredArgsConstructor
public class AssistantService {
    final ChatLanguageModel chatLangModel;
    final StreamingChatLanguageModel chatLanguageModel;
    final ChatMemoryStore chatMemoryStore;

    @Bean
    ChatAssistant chatAssistant() {
        return AiServices.builder(ChatAssistant.class)
            .streamingChatLanguageModel(chatLanguageModel)
            .chatMemoryProvider(id -> MessageWindowChatMemory.builder()
                .id(id)
                .maxMessages(20)
                .chatMemoryStore(chatMemoryStore)
                .build())
            .build();
    }

}
