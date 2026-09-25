package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.RegistrationService;
import com.pranit.docmind.auth.domain.dto.RegistrationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/register")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Registration Management",
        description = "Endpoints for registering new users and administrators."
)
public class RegistrationController {

    private final RegistrationService registrationService;

    @Operation(
            summary = "Register new user",
            description = "Creates a new user account and initiates the account verification process."
    )
    @PostMapping(version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> registerNewUserByAdmin(@Valid @RequestBody RegistrationRequest request) {
        this.registrationService.registerNewUserByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
