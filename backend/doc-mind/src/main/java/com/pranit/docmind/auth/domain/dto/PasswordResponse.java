package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

@Builder
public record PasswordResponse(
        String challengeId,
        String message
) {
}
