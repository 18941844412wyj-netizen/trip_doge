package com.tripdog.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.tripdog.mapper.RoleMapper;
import com.tripdog.model.converter.RoleConverter;
import com.tripdog.model.entity.RoleDO;
import com.tripdog.model.vo.RoleInfoVO;
import com.tripdog.service.RoleService;

import lombok.RequiredArgsConstructor;

/**
 * @author: iohw
 * @date: 2025/9/24 20:31
 * @description:
 */
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {
    final RoleMapper roleMapper;

    @Override
    public List<RoleInfoVO> getRoleInfoList() {
        List<RoleDO> roleDOS = roleMapper.selectActiveRoles();
        return RoleConverter.INSTANCE.toRoleInfoVOList(roleDOS);
    }
}
