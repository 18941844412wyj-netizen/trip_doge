package com.tripdog.ai;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Configuration;

import com.tripdog.ai.assistant.ChatAssistant;
import com.tripdog.ai.embedding.RetrieverFactory;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.input.PromptTemplate;
import dev.langchain4j.rag.DefaultRetrievalAugmentor;
import dev.langchain4j.rag.RetrievalAugmentor;
import dev.langchain4j.rag.content.injector.DefaultContentInjector;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import static com.tripdog.common.Constants.INJECT_TEMPLATE;

/**
 * @author: iohw
 * @date: 2025/9/24 22:21
 * @description:
 */
@Configuration
@RequiredArgsConstructor
public class AssistantService {
    final StreamingChatLanguageModel chatLanguageModel;
    final RetrieverFactory retrieverFactory;
    final CustomerChatMemoryProvider chatMemoryProvider;

    public ChatAssistant getAssistant(Long roleId, Long userId) {
        RetrievalAugmentor retrievalAugmentor = DefaultRetrievalAugmentor.builder()
            .contentRetriever(retrieverFactory.getRetriever(roleId, userId))
            .contentInjector(DefaultContentInjector.builder()
                .promptTemplate(PromptTemplate.from("{{userMessage}}" + INJECT_TEMPLATE + "{{contents}}"))
                .build())
            .build();

        return AiServices.builder(ChatAssistant.class)
            .streamingChatLanguageModel(chatLanguageModel)
            .retrievalAugmentor(retrievalAugmentor)
            .chatMemoryProvider(chatMemoryProvider)
            .build();
    }

}
