package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

@Builder
public record RoleResponse(
        Long roleId,
        String roleName,
        String roleDescription
) {
}
