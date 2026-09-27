package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.UUID;

@Builder
public record UserResponse(
        UUID userId,
        String username,
        String firstName,
        String lastName,
        String email,
        Collection<? extends GrantedAuthority> authorities,
        boolean deleted,
        boolean enabled,
        boolean accountNonExpired,
        boolean accountNonLocked,
        boolean credentialsNonExpired
) {
}
