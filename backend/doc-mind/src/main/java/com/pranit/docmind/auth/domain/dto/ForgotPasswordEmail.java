package com.pranit.docmind.auth.domain.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordEmail(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email
) {
}
