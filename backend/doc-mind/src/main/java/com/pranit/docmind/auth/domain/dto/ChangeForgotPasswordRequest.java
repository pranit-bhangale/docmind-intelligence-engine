package com.pranit.docmind.auth.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ChangeForgotPasswordRequest(

        @Email(message = "Invalid email format")
        @NotBlank(message = "Email is required")
        String email,

        @Valid
        PasswordRequest passwordRequest,

        String companyCode
) {
}
