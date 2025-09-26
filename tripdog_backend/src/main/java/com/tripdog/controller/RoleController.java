package com.tripdog.controller;

import com.tripdog.common.Constants;
import com.tripdog.common.ErrorCode;
import com.tripdog.common.Result;
import com.tripdog.mapper.ConversationMapper;
import com.tripdog.model.entity.ConversationDO;
import com.tripdog.model.entity.RoleDO;
import com.tripdog.model.vo.RoleInfoVO;
import com.tripdog.model.vo.RoleDetailVO;
import com.tripdog.model.vo.UserInfoVO;
import com.tripdog.service.ConversationService;
import com.tripdog.service.RoleService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 角色控制器
 */
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final ConversationService conversationService;
    private final ConversationMapper conversationMapper;

    /**
     * 获取用户与角色对话列表
     */
    @PostMapping("/list")
    public Result<List<RoleInfoVO>> getActiveRoles(HttpSession session) {
        UserInfoVO userInfo = (UserInfoVO) session.getAttribute(Constants.USER_SESSION_KEY);

        // 检查所有角色是否已创建好对话
        List<RoleInfoVO> roleInfoList = roleService.getRoleInfoList();
        roleInfoList.forEach(roleInfoVO -> {
            ConversationDO conversation = conversationService.findConversationByUserAndRole(
                userInfo.getId(), roleInfoVO.getId());
            if(conversation == null) {
                conversation = conversationService.getOrCreateConversation(userInfo.getId(), roleInfoVO.getId());
            }
            roleInfoVO.setConversationId(conversation.getConversationId());
        });

        return Result.success(roleInfoList);
    }

    /**
     * 获取角色详情
     *
     * @param roleId 角色ID
     * @return 角色详情信息
     */
    // @GetMapping("/{roleId}/detail")
    // public Result<RoleDetailVO> getRoleDetail(@PathVariable Long roleId) {
    //     RoleDetailVO roleDetail = roleService.getRoleDetailById(roleId);
    //     if (roleDetail == null) {
    //         return Result.error(ErrorCode.NOT_FOUND_ERROR, "角色不存在");
    //     }
    //     return Result.success(roleDetail);
    // }

}
