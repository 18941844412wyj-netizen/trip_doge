package com.tripdog.service;

import com.tripdog.mapper.ConversationMapper;
import com.tripdog.mapper.ChatHistoryMapper;
import com.tripdog.mapper.RoleMapper;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.entity.RoleDO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 会话服务类
 * 实现一个用户对同一角色只有一个持久会话的逻辑
 */
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationMapper conversationMapper;
    private final ChatHistoryMapper chatHistoryMapper;
    private final RoleMapper roleMapper;

    /**
     * 获取或创建用户与角色的会话
     * 如果会话不存在，则自动创建
     */
    @Transactional
    public ConversationDO getOrCreateConversation(Long userId, Long roleId) {
        // 先尝试查找已存在的会话
        ConversationDO existingConversation = findConversationByUserAndRole(userId, roleId);
        if (existingConversation != null) {
            return existingConversation;
        }

        // 会话不存在，创建新会话
        return createNewConversation(userId, roleId);
    }

    /**
     * 查找用户与角色的会话
     */
    public ConversationDO findConversationByUserAndRole(Long userId, Long roleId) {
        ConversationDO queryParam = new ConversationDO();
        queryParam.setUserId(userId);
        queryParam.setRoleId(roleId);
        
        List<ConversationDO> conversations = conversationMapper.selectConversationList(queryParam);
        return conversations.isEmpty() ? null : conversations.get(0);
    }

    /**
     * 创建新会话
     */
    private ConversationDO createNewConversation(Long userId, Long roleId) {
        // 获取角色信息
        RoleDO role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new RuntimeException("角色不存在: " + roleId);
        }

        // 创建会话
        ConversationDO conversation = new ConversationDO();
        conversation.setUserId(userId);
        conversation.setRoleId(roleId);
        conversation.setTitle("与" + role.getName() + "的对话");
        conversation.setConversationType("COMPANION");
        conversation.setStatus(1); // 活跃状态
        conversation.setIntimacyLevel(0); // 初始亲密度
        conversation.setMessageCount(0);
        conversation.setTotalInputTokens(0);
        conversation.setTotalOutputTokens(0);
        conversation.setContextWindowSize(20); // 默认记忆20条消息
        conversation.setCreatedAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());

        conversationMapper.insert(conversation);
        return conversation;
    }

    /**
     * 重置会话上下文
     * 不删除历史记录，而是插入重置标记
     */
    @Transactional
    public void resetConversationContext(Long conversationId) {
        // 插入上下文重置标记
        ChatHistoryDO resetMessage = new ChatHistoryDO();
        resetMessage.setConversationId(conversationId);
        resetMessage.setRole("system");
        resetMessage.setContent("[CONTEXT_RESET]");
        resetMessage.setSenderId(null);
        resetMessage.setCreatedAt(LocalDateTime.now());
        
        chatHistoryMapper.insert(resetMessage);

        // 更新会话信息
        ConversationDO conversation = new ConversationDO();
        conversation.setId(conversationId);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationMapper.updateById(conversation);
    }

    /**
     * 获取会话的上下文消息（排除重置点之前的消息）
     */
    public List<ChatHistoryDO> getContextMessages(Long conversationId, Integer limit) {
        // 获取所有消息
        ChatHistoryDO queryParam = new ChatHistoryDO();
        queryParam.setConversationId(conversationId);
        List<ChatHistoryDO> allMessages = chatHistoryMapper.selectChatHistoryList(queryParam);

        // 找到最后一个重置点
        int lastResetIndex = -1;
        for (int i = allMessages.size() - 1; i >= 0; i--) {
            if ("[CONTEXT_RESET]".equals(allMessages.get(i).getContent())) {
                lastResetIndex = i;
                break;
            }
        }

        // 获取重置点之后的消息
        List<ChatHistoryDO> contextMessages;
        if (lastResetIndex >= 0) {
            contextMessages = allMessages.subList(lastResetIndex + 1, allMessages.size());
        } else {
            contextMessages = allMessages;
        }

        // 限制消息数量
        if (limit != null && contextMessages.size() > limit) {
            int start = contextMessages.size() - limit;
            contextMessages = contextMessages.subList(start, contextMessages.size());
        }

        return contextMessages;
    }

    /**
     * 更新会话统计信息
     */
    @Transactional
    public void updateConversationStats(Long conversationId, Integer inputTokens, Integer outputTokens) {
        ConversationDO conversation = conversationMapper.selectById(conversationId);
        if (conversation != null) {
            conversation.setMessageCount(conversation.getMessageCount() + 1);
            conversation.setTotalInputTokens(conversation.getTotalInputTokens() + (inputTokens != null ? inputTokens : 0));
            conversation.setTotalOutputTokens(conversation.getTotalOutputTokens() + (outputTokens != null ? outputTokens : 0));
            conversation.setLastMessageAt(LocalDateTime.now());
            conversation.setUpdatedAt(LocalDateTime.now());
            
            conversationMapper.updateById(conversation);
        }
    }
}
