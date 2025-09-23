package com.tripdog.controller;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.tripdog.ai.ChatAssistant;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.entity.RoleDO;
import com.tripdog.model.req.ChatRequest;
import com.tripdog.service.ConversationService;
import com.tripdog.mapper.ChatHistoryMapper;
import com.tripdog.mapper.RoleMapper;

import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.TokenStream;
import lombok.RequiredArgsConstructor;

/**
 * 聊天控制器
 * 实现一个用户对同一角色只有一个持久会话的逻辑
 */
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    
    private final StreamingChatLanguageModel chatLanguageModel;
    private final ConversationService conversationService;
    private final ChatHistoryMapper chatHistoryMapper;
    private final RoleMapper roleMapper;

    /**
     * 与指定角色聊天
     * @param roleId 角色ID
     */
    @PostMapping(value = "/{roleId}", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chat(@PathVariable Long roleId, 
                          @RequestBody ChatRequest req) {
        SseEmitter emitter = new SseEmitter(-1L);

        try {
            Long userId = req.getUserId();
            String message = req.getMessage();
            // 1. 获取或创建会话
            ConversationDO conversation = conversationService.getOrCreateConversation(userId, roleId);
            
            // 2. 获取角色信息
            RoleDO role = roleMapper.selectById(roleId);
            if (role == null) {
                emitter.completeWithError(new RuntimeException("角色不存在"));
                return emitter;
            }

            // 3. 保存用户消息
            ChatHistoryDO userMessage = new ChatHistoryDO();
            userMessage.setConversationId(conversation.getId());
            userMessage.setRole("user");
            userMessage.setContent(message);
            userMessage.setSenderId(userId);
            userMessage.setCreatedAt(LocalDateTime.now());
            chatHistoryMapper.insert(userMessage);

            // 4. 获取上下文消息
            List<ChatHistoryDO> contextMessages = conversationService.getContextMessages(
                conversation.getId(), conversation.getContextWindowSize());

            // 5. 构建对话上下文
            StringBuilder contextBuilder = new StringBuilder();
            for (ChatHistoryDO historyMessage : contextMessages) {
                if (!"system".equals(historyMessage.getRole())) {
                    contextBuilder.append(historyMessage.getRole()).append(": ")
                               .append(historyMessage.getContent()).append("\n");
                }
            }
            contextBuilder.append("user: ").append(message);

            // 6. 调用AI生成回复
            ChatAssistant assistant = AiServices.builder(ChatAssistant.class)
                .streamingChatLanguageModel(chatLanguageModel)
                .build();

            // 创建助手消息记录
            ChatHistoryDO assistantMessage = new ChatHistoryDO();
            assistantMessage.setConversationId(conversation.getId());
            assistantMessage.setRole("assistant");
            assistantMessage.setSenderId(roleId);
            assistantMessage.setCreatedAt(LocalDateTime.now());

            StringBuilder responseBuilder = new StringBuilder();
            TokenStream stream = assistant.chat(contextBuilder.toString());

            stream.onPartialResponse((data) -> {
                try {
                    responseBuilder.append(data);
                    emitter.send(SseEmitter.event()
                        .data(data)
                        .id(String.valueOf(System.currentTimeMillis()))
                        .name("message")
                    );
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            }).onCompleteResponse((data) -> {
                try {
                    // 7. 保存助手回复
                    assistantMessage.setContent(responseBuilder.toString());
                    chatHistoryMapper.insert(assistantMessage);

                    // 8. 更新会话统计
                    conversationService.updateConversationStats(conversation.getId(), null, null);

                    emitter.send(SseEmitter.event()
                        .data("[DONE]")
                        .id("done")
                        .name("done"));
                    emitter.complete();
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            }).onError((ex) -> {
                emitter.completeWithError(ex);
            }).start();

        } catch (Exception e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    /**
     * 重置会话上下文
     * @param roleId 角色ID
     * @param userId 用户ID
     */
    @PostMapping("/{roleId}/reset")
    public void resetContext(@PathVariable Long roleId, @RequestParam Long userId) {
        ConversationDO conversation = conversationService.findConversationByUserAndRole(userId, roleId);
        if (conversation != null) {
            conversationService.resetConversationContext(conversation.getId());
        }
    }

    /**
     * 获取会话历史
     * @param roleId 角色ID
     * @param userId 用户ID
     */
    @GetMapping("/{roleId}/history")
    public List<ChatHistoryDO> getHistory(@PathVariable Long roleId, @RequestParam Long userId) {
        ConversationDO conversation = conversationService.findConversationByUserAndRole(userId, roleId);
        if (conversation != null) {
            return conversationService.getContextMessages(conversation.getId(), null);
        }
        return List.of();
    }

}
