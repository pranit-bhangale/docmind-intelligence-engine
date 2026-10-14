package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.VerificationService;
import com.pranit.docmind.auth.domain.dto.VerificationResponse;
import com.pranit.docmind.auth.domain.dto.VerifyOtp;
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
@RequestMapping("/api/auth/verify")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Verification",
        description = "Endpoints for verifying one-time passwords password reset"
)
public class VerificationController {

    private final VerificationService verificationService;
    private final PublicTenantContextHelper tenantContextHelper;

    @PostMapping(value = "/password-reset", version = "v1")
    @Operation(summary = "Verify password reset OTP", description = "Validates the one-time password issued during password recovery.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password reset OTP verified successfully",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = VerificationResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid or expired OTP token",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Password reset request not found for OTP",
                    content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<VerificationResponse> verifyPasswordResetOtp(@Valid @RequestBody final VerifyOtp request) {
        final String companyCode = (request.companyCode() != null && !request.companyCode().isBlank())
                ? request.companyCode().trim() : null;
        this.tenantContextHelper.setupTenantContext(companyCode);
        try {
            return ResponseEntity.ok(this.verificationService.verifyPasswordResetOtp(request));
        } finally {
            TenantContext.clear();
        }
    }
}
