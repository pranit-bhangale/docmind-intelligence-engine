package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.RegistrationService;
import com.pranit.docmind.auth.domain.dto.RegistrationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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
        name = "User Registration",
        description = "Endpoints for administrator-driven user registration within tenant organizations."
)
public class RegistrationController {

    private final RegistrationService registrationService;

    @Operation(
            summary = "Register new user by administrator",
            description = "Creates a new user account within the requesting administrator's tenant context with assigned roles and credentials."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or validation error"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires admin privileges"),
            @ApiResponse(responseCode = "409", description = "User or email already exists")
    })
    @PostMapping(version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN')")
    public ResponseEntity<Void> registerNewUserByAdmin(@Valid @RequestBody RegistrationRequest request) {
        this.registrationService.registerNewUserByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
