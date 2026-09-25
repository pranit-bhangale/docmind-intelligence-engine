package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

@Builder
public record UpdateUserRequest(
        String username,
        String email,
        String firstName,
        String lastName
) {
}
