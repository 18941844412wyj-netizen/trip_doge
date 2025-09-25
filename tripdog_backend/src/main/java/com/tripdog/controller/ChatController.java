package com.tripdog.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.req.ChatRequest;
import com.tripdog.model.vo.UserInfoVO;
import com.tripdog.service.ChatService;
import com.tripdog.service.impl.ConversationServiceImpl;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import static com.tripdog.common.Constants.USER_SESSION_KEY;

/**
 * 聊天控制器
 * 实现一个用户对同一角色只有一个持久会话的逻辑
 */
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ConversationServiceImpl conversationServiceImpl;

    /**
     * 与指定角色聊天
     * @param roleId 角色ID
     */
    @PostMapping(value = "/{roleId}", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chat(@PathVariable Long roleId,
                          @RequestBody ChatRequest req,
                            HttpSession session) {

        UserInfoVO userInfoVO = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        Long userId = userInfoVO.getId();

        return chatService.chat(roleId, userId, req);
    }

    /**
     * 重置会话上下文
     * @param roleId 角色ID
     * @param userId 用户ID
     */
    @PostMapping("/{roleId}/reset")
    public Result<Void> resetContext(@PathVariable Long roleId, @RequestParam Long userId) {
        ConversationDO conversation = conversationServiceImpl.findConversationByUserAndRole(userId, roleId);
        if (conversation == null) {
            return Result.error(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        conversationServiceImpl.resetConversationContext(conversation.getConversationId());

        return Result.success();
    }

    /**
     * 获取会话历史
     * @param roleId 角色ID
     */
    @PostMapping("/{roleId}/history")
    public Result<List<ChatHistoryDO>> getHistory(@PathVariable Long roleId, HttpSession session) {
        UserInfoVO userInfo = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        ConversationDO conversation = conversationServiceImpl.findConversationByUserAndRole(userInfo.getId(), roleId);
        if (conversation == null) {
            return Result.success(List.of());
        }

        List<ChatHistoryDO> history = conversationServiceImpl.getContextMessages(conversation.getConversationId(), null);
        return Result.success(history);
    }

}
