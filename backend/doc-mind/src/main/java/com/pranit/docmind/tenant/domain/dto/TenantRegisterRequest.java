package com.pranit.docmind.tenant.domain.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record TenantRegisterRequest(
        @NotBlank(message = "Company name should not be empty")
        String companyName,
        @NotBlank(message = "Company code should not be empty")
        String companyCode,
        @NotBlank(message = "Email should not be empty")
        String email,
        @NotBlank(message = "Admin full name should not be empty")
        String adminFullName,
        @NotBlank(message = "Admin email should not be empty")
        String adminEmail,
        @NotBlank(message = "Admin username should not be empty")
        String adminUsername,
        @NotBlank(message = "Admin password should not be empty")
        String adminPassword
) {
}
