package com.tripdog.service.impl;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.tripdog.ai.AssistantService;
import com.tripdog.ai.assistant.ChatAssistant;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.entity.RoleDO;
import com.tripdog.model.req.ChatRequest;
import com.tripdog.service.ChatService;
import com.tripdog.mapper.ChatHistoryMapper;
import com.tripdog.mapper.RoleMapper;

import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.TokenStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 聊天服务实现类
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final StreamingChatLanguageModel chatLanguageModel;
    private final ConversationServiceImpl conversationServiceImpl;
    private final ChatHistoryMapper chatHistoryMapper;
    private final RoleMapper roleMapper;
    private final ChatAssistant assistant;

    @Override
    public SseEmitter chat(Long roleId, Long userId, ChatRequest chatRequest) {
        SseEmitter emitter = new SseEmitter(-1L);

        try {
            String message = chatRequest.getMessage();

            // 1. 获取或创建会话
            ConversationDO conversation = conversationServiceImpl.getOrCreateConversation(userId, roleId);

            // 2. 获取角色信息
            RoleDO role = roleMapper.selectById(roleId);
            if (role == null) {
                emitter.completeWithError(new RuntimeException("角色不存在"));
                return emitter;
            }

            StringBuilder responseBuilder = new StringBuilder();
            TokenStream stream = assistant.chat(conversation.getConversationId(), chatRequest.getMessage());

            stream.onPartialResponse((data) -> {
                try {
                    responseBuilder.append(data);
                    emitter.send(SseEmitter.event()
                        .data(data)
                        .id(String.valueOf(System.currentTimeMillis()))
                        .name("message")
                    );
                } catch (IOException e) {
                    log.error("发送SSE部分响应失败", e);
                    emitter.completeWithError(e);
                }
            }).onCompleteResponse((data) -> {
                try {

                    // 8. 更新会话统计
                    conversationServiceImpl.updateConversationStats(conversation.getConversationId(), null, null);

                    emitter.send(SseEmitter.event()
                        .data("[DONE]")
                        .id(String.valueOf(System.currentTimeMillis()))
                        .name("done"));
                    emitter.complete();
                } catch (IOException e) {
                    log.error("发送SSE完成响应失败", e);
                    emitter.completeWithError(e);
                }
            }).onError((ex) -> {
                log.error("AI聊天流处理异常", ex);
                emitter.completeWithError(ex);
            }).start();

        } catch (Exception e) {
            log.error("聊天服务处理异常", e);
            emitter.completeWithError(e);
        }

        return emitter;
    }
}
