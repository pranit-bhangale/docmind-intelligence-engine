package com.pranit.docmind.auth.application.service;


import com.pranit.docmind.auth.domain.dto.RoleResponse;

import java.util.List;

@FunctionalInterface
public interface RoleService {

    List<RoleResponse> findAllRoles();
}
