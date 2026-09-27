package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.RoleService;
import com.pranit.docmind.auth.domain.dto.RoleResponse;
import com.pranit.docmind.auth.domain.entity.Role;
import com.pranit.docmind.auth.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public List<RoleResponse> findAllRoles() {
        final List<Role> roles = roleRepository.findAll();
        return roles.stream()
                .map(this::mapToRoleResponse)
                .toList();
    }

    private RoleResponse mapToRoleResponse(final Role role) {
        return RoleResponse.builder()
                .roleId(role.getRoleId())
                .roleName(role.getName())
                .roleDescription(role.getDescription())
                .build();
    }
}
