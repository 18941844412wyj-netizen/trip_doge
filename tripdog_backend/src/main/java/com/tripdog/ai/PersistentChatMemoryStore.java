package com.tripdog.ai;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

import com.alibaba.dashscope.tokenizers.Tokenizer;
import com.alibaba.dashscope.tokenizers.TokenizerFactory;
import com.tripdog.ai.compress.CompressionService;
import com.tripdog.common.Constants;
import com.tripdog.mapper.ChatHistoryMapper;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.builder.ConversationBuilder;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.CustomMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.ToolExecutionResultMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @author: iohw
 * @date: 2025/4/13 10:35
 * @description:
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PersistentChatMemoryStore implements ChatMemoryStore {
    final ChatHistoryMapper chatHistoryMapper;
    private final Tokenizer tokenizer = TokenizerFactory.qwen();
    private final String USER = "user";
    private final String ASSISTANT = "assistant";
    private final String SYSTEM = "system";
    private final CompressionService compressionService;

    @Override
    public List<ChatMessage> getMessages(Object o) {
        String conversationId = (String) o;
        List<ChatHistoryDO> chatHistoryDOS = chatHistoryMapper.selectAllById(conversationId);
        List<ChatMessage> chatMessages = new ArrayList<>();
        for (ChatHistoryDO d : chatHistoryDOS) {
            switch (d.getRole()) {
                case USER:
                    chatMessages.add(UserMessage.from(d.getContent()));
                    break;
                case ASSISTANT:
                    chatMessages.add(AiMessage.from(d.getContent()));
                    break;
                case SYSTEM:
                    chatMessages.add(SystemMessage.from(d.getContent()));
                    break;
            }
        }
        // 压缩处理
        return compressionService.compress(chatMessages);
    }

    @Override
    public void updateMessages(Object o, List<ChatMessage> list) {
        String conversationId = o.toString();
        ChatMessage latestMessage = list.getLast();
        String role = getRoleFromMessage(latestMessage);
        String message = getContentMessage(latestMessage);

        // 触发多轮改写/长期记忆生成
        List<ChatMessage> historyMessages = list.subList(1, list.size() - 1);
        // TODO: 可在这里调用multiTurnRewriteService分析historyMessages
        //multiTurnRewriteService.rewrite(message, historyMessages);

        ChatHistoryDO chatHistoryDO;
        if (Constants.USER.equals(role)) {
            chatHistoryDO = ConversationBuilder.buildUserMessage(conversationId, message);
        } else if (Constants.ASSISTANT.equals(role)) {
            chatHistoryDO = ConversationBuilder.buildAssistantMessage(conversationId, message);
        } else {
            chatHistoryDO = ConversationBuilder.buildSystemMessage(conversationId, message);
        }

        chatHistoryMapper.insert(chatHistoryDO);
    }

    @Override
    public void deleteMessages(Object o) {
        String conversationId = o.toString();
        chatHistoryMapper.deleteByConversationId(conversationId);
    }


    private String getRoleFromMessage(ChatMessage message) {
        if (message instanceof SystemMessage) {
            return SYSTEM;
        } else if (message instanceof UserMessage) {
            return USER;
        } else if (message instanceof AiMessage) {
            return ASSISTANT;
        }else if (message instanceof ToolExecutionResultMessage) {
            return "tool";
        } else if (message instanceof CustomMessage) {
            return "custom";
        }
        throw new IllegalArgumentException("Unknown message type: " + message.getClass().getName());
    }

    private String getContentMessage(ChatMessage message) {
        if (message instanceof SystemMessage) {
            return ((SystemMessage) message).text();
        } else if (message instanceof UserMessage) {

            return ((UserMessage) message).singleText();
        } else if (message instanceof AiMessage) {
            return ((AiMessage) message).text();
        }else if (message instanceof ToolExecutionResultMessage) {
            // todo 适配function call
            ToolExecutionResultMessage toolMsg = (ToolExecutionResultMessage) message;
            return String.format("{id: %s, tool_name: %s, execution_result: %s}",
                    toolMsg.id(), toolMsg.toolName(), toolMsg.text());
        } else if (message instanceof CustomMessage) {
            // 自定义消息可能需要JSON序列化
            return ((CustomMessage) message).toString();
        }
        throw new IllegalArgumentException("Unknown message type: " + message.getClass().getName());
    }

}
