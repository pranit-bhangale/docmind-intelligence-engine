package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

@Builder
public record UpdatePasswordRequest(
        String oldPassword,
        String newPassword,
        String confirmPassword
) {
}
