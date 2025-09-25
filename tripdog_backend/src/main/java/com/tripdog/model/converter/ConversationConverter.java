package com.tripdog.model.converter;

import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 会话和聊天历史映射器
 */
@Mapper
public interface ConversationConverter {

    ConversationConverter INSTANCE = Mappers.getMapper(ConversationConverter.class);

    // 这里可以根据需要添加会话相关的VO转换方法
    // 例如：ConversationVO toConversationVO(ConversationDO conversationDO);

    // 聊天历史相关转换
    // 例如：ChatHistoryVO toChatHistoryVO(ChatHistoryDO chatHistoryDO);
}
