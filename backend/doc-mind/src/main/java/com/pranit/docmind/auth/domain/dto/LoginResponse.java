package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

import java.util.Set;

@Builder
public record LoginResponse(
        String username,
        Set<String> roles
) {
}
