package com.tripdog.model.converter;

import com.tripdog.model.entity.RoleDO;
import com.tripdog.model.vo.RoleInfoVO;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * 角色映射器
 */
@Mapper
public interface RoleConverter {

    RoleConverter INSTANCE = Mappers.getMapper(RoleConverter.class);

    /**
     * RoleDO转RoleInfoVO
     */
    RoleInfoVO toRoleInfoVO(RoleDO roleDO);

    /**
     * RoleDO列表转RoleInfoVO列表
     */
    List<RoleInfoVO> toRoleInfoVOList(List<RoleDO> roleDOList);
}
