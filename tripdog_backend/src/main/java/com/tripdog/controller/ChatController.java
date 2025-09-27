package com.tripdog.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.alibaba.dashscope.exception.ApiException;
import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.model.dto.ChatReqDTO;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.ChatHistoryDO;
import com.tripdog.model.vo.UserInfoVO;
import com.tripdog.service.ChatService;
import com.tripdog.service.impl.ConversationServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import static com.tripdog.common.Constants.USER_SESSION_KEY;

/**
 * 聊天控制器
 * 实现一个用户对同一角色只有一个持久会话的逻辑
 */
@Tag(name = "智能对话", description = "与AI角色进行对话的相关接口，支持SSE流式响应")
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
    @Operation(summary = "与AI角色对话", description = "与指定的AI角色进行实时对话，返回SSE流式响应")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功建立SSE连接，返回流式对话内容"),
            @ApiResponse(responseCode = "10200", description = "角色不存在"),
            @ApiResponse(responseCode = "10105", description = "用户未登录")
    })
    @PostMapping(value = "/{roleId}", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chat(@Parameter(description = "角色ID", required = true) @PathVariable Long roleId,
                          @RequestBody ChatReqDTO req,
                            HttpSession session) {

        UserInfoVO userInfoVO = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        if(userInfoVO == null) {
            throw new RuntimeException(ErrorCode.USER_NOT_LOGIN.getMessage());
        }
        Long userId = userInfoVO.getId();

        return chatService.chat(roleId, userId, req);
    }

    /**
     * 重置会话上下文
     * @param roleId 角色ID
     */
    @Operation(summary = "重置会话上下文", description = "清空与指定角色的对话历史，重新开始对话")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "重置成功"),
            @ApiResponse(responseCode = "10300", description = "对话不存在"),
            @ApiResponse(responseCode = "10105", description = "用户未登录")
    })
    @PostMapping("/{roleId}/reset")
    public Result<Void> resetContext(@Parameter(description = "角色ID", required = true) @PathVariable Long roleId, HttpSession session) {
        UserInfoVO userInfoVO = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        if(userInfoVO == null) {
            return Result.error(ErrorCode.USER_NOT_LOGIN);
        }
        Long userId = userInfoVO.getId();
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
    @Operation(summary = "获取对话历史", description = "获取与指定角色的聊天历史记录")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "成功获取历史记录"),
            @ApiResponse(responseCode = "10105", description = "用户未登录")
    })
    @PostMapping("/{roleId}/history")
    public Result<List<ChatHistoryDO>> getHistory(@Parameter(description = "角色ID", required = true) @PathVariable Long roleId, HttpSession session) {
        UserInfoVO userInfo = (UserInfoVO) session.getAttribute(USER_SESSION_KEY);
        if(userInfo == null) {
            return Result.error(ErrorCode.USER_NOT_LOGIN);
        }
        ConversationDO conversation = conversationServiceImpl.findConversationByUserAndRole(userInfo.getId(), roleId);
        if (conversation == null) {
            return Result.success(List.of());
        }

        List<ChatHistoryDO> history = conversationServiceImpl.getContextMessages(conversation.getConversationId(), null);
        return Result.success(history);
    }

}
