package com.pranit.docmind.auth.domain.dto;

import lombok.Builder;

@Builder
public record VerificationResponse(
        String message
) {
}
