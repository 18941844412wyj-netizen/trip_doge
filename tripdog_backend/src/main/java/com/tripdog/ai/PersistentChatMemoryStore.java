package com.tripdog.ai;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.springframework.stereotype.Component;

import com.alibaba.dashscope.tokenizers.Tokenizer;
import com.alibaba.dashscope.tokenizers.TokenizerFactory;
import com.tripdog.mapper.ChatHistoryMapper;
import com.tripdog.model.entity.ChatHistoryDO;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageDeserializer;
import dev.langchain4j.data.message.ChatMessageSerializer;
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
            }
        }
        return chatMessages;
    }

    @Override
    public void updateMessages(Object o, List<ChatMessage> list) {
        String conversationId = o.toString();
        ChatMessage latestMessage = list.getLast();
        String role = getRoleFromMessage(latestMessage);
        String message = getContentMessage(latestMessage);
        ChatHistoryDO chatHistoryDO = new ChatHistoryDO();
        chatHistoryDO.setConversationId(conversationId);
        chatHistoryDO.setRole(role);
        chatHistoryDO.setContent(message);
        chatHistoryDO.setCreatedAt(LocalDateTime.now());

        chatHistoryMapper.insert(chatHistoryDO);
    }

    @Override
    public void deleteMessages(Object o) {
        String conversationId = o.toString();
        chatHistoryMapper.deleteByConversationId(conversationId);
    }


    private String getRoleFromMessage(ChatMessage message) {
        if (message instanceof SystemMessage) {
            return "system";
        } else if (message instanceof UserMessage) {
            return "user";
        } else if (message instanceof AiMessage) {
            return "assistant";
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
