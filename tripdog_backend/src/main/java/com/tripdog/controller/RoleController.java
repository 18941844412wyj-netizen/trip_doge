package com.tripdog.controller;

import com.tripdog.mapper.RoleMapper;
import com.tripdog.model.entity.RoleDO;
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

    private final RoleMapper roleMapper;

    /**
     * 获取所有启用的角色列表
     */
    @GetMapping
    public List<RoleDO> getActiveRoles() {
        return roleMapper.selectActiveRoles();
    }

    /**
     * 根据ID获取角色详情
     */
    @GetMapping("/{id}")
    public RoleDO getRoleById(@PathVariable Long id) {
        return roleMapper.selectById(id);
    }

    /**
     * 根据code获取角色
     */
    @GetMapping("/code/{code}")
    public RoleDO getRoleByCode(@PathVariable String code) {
        return roleMapper.selectByCode(code);
    }
}
