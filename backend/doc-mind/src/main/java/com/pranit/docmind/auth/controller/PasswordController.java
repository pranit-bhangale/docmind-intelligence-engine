package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.PasswordService;
import com.pranit.docmind.auth.domain.dto.ChangeForgotPasswordRequest;
import com.pranit.docmind.auth.domain.dto.ForgotPasswordEmail;
import com.pranit.docmind.auth.domain.dto.PasswordResponse;
import com.pranit.docmind.auth.infrastructure.helper.PublicTenantContextHelper;
import com.pranit.docmind.shared.wrapper.ErrorResponse;
import com.pranit.docmind.tenant.api.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Password Management",
        description = "Endpoints for requesting password reset OTP, resetting forgotten passwords, and changing credentials"
)
public class PasswordController {

    private final PasswordService passwordService;
    private final PublicTenantContextHelper tenantContextHelper;

    @PostMapping(value = "/request-reset", version = "v1")
    @Operation(summary = "Request password reset OTP", description = "Dispatches a secure one-time password to the registered email address for account recovery.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset OTP dispatched successfully",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = PasswordResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation failed for email format",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Account not found with provided email",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PasswordResponse> requestPasswordReset(@Valid @RequestBody final ForgotPasswordEmail request) {
        final String companyCode = (request.companyCode() != null && !request.companyCode().isBlank())
                ? request.companyCode().trim() : null;
        this.tenantContextHelper.setupTenantContext(companyCode);
        try {
            return ResponseEntity.ok(this.passwordService.requestPasswordReset(request));
        } finally {
            TenantContext.clear();
        }
    }

    @PostMapping(value = "/reset", version = "v1")
    @Operation(summary = "Reset forgotten account password", description = "Validates the reset OTP and assigns a newly confirmed password.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Account password reset successfully",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = PasswordResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired OTP token, or weak password",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Account not found",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<PasswordResponse> resetPassword(@Valid @RequestBody final ChangeForgotPasswordRequest request) {
        final String companyCode = (request.companyCode() != null && !request.companyCode().isBlank())
                ? request.companyCode().trim() : null;
        this.tenantContextHelper.setupTenantContext(companyCode);
        try {
            return ResponseEntity.ok(this.passwordService.resetPassword(request));
        } finally {
            TenantContext.clear();
        }
    }
}
