package com.pranit.docmind.auth.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record LoginRequest(
        @NotBlank(message = "Username should not be empty")
        String username,
        @NotBlank(message = "Password should not be empty")
        String password
) {
}
