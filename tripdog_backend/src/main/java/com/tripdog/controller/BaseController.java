package com.tripdog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tripdog.ai.AiAssistant;

import dev.langchain4j.community.model.dashscope.QwenChatModel;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.service.AiServices;
import lombok.RequiredArgsConstructor;

/**
 * @author: iohw
 * @date: 2025/9/22 22:31
 * @description:
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BaseController {
    final ChatLanguageModel chatLanguageModel;

    @GetMapping("/test")
    public String test() {
        AiAssistant assistant = AiServices.builder(AiAssistant.class)
            .chatLanguageModel(chatLanguageModel)
            .build();
        String rsp = assistant.chat("你好");
        return rsp;
    }
}
