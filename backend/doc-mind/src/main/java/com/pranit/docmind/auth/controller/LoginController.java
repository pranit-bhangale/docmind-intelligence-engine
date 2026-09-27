package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.LoginService;
import com.pranit.docmind.auth.application.service.LogoutService;
import com.pranit.docmind.auth.application.service.TokenService;
import com.pranit.docmind.auth.domain.dto.LoginRequest;
import com.pranit.docmind.auth.domain.dto.LoginResponse;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.auth.exception.UnauthorizedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Authentication & Session",
        description = "Endpoints for user authentication, current identity resolution, token renewal, and session termination."
)
public class LoginController {

    private final LoginService loginService;
    private final TokenService tokenService;
    private final LogoutService logoutService;

    @Operation(
            summary = "Authenticate user credentials",
            description = "Authenticates user login credentials against the tenant database and issues secure access and refresh tokens stored in HttpOnly cookies."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User successfully authenticated"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or validation failure"),
            @ApiResponse(responseCode = "401", description = "Bad credentials or inactive account")
    })
    @PostMapping(value = "/login", version = "v1")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        final LoginResponse loginRespone = loginService.authenticateUser(request, response);
        return ResponseEntity.ok().body(loginRespone);
    }

    @Operation(
            summary = "Get current authenticated user identity",
            description = "Retrieves current user identity details including username, email, assigned roles, active status, and tenant context."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Current user profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized or invalid access token")
    })
    @GetMapping(value = "/me", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok().body(loginService.getCurrentUser());
    }

    @Operation(
            summary = "Refresh access token",
            description = "Validates the HTTP-only refresh token cookie and issues a new access token and refresh token."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Access token refreshed successfully"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid refresh token")
    })
    @PostMapping(value = "/refresh", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<Void> refreshToken(final HttpServletRequest request, final HttpServletResponse response) {
        final String refreshToken = tokenService.readRefreshTokenFromRequest(request)
                .orElseThrow(() -> {
                    log.warn("No refresh token found");
                    return new UnauthorizedException("No refresh token found");
                });
        this.tokenService.generateNewRefreshToken(refreshToken, response);
        return ResponseEntity.ok().build();
    }

    @Operation(
            summary = "Logout user session",
            description = "Revokes active access and refresh tokens, invalidating the session and clearing authentication cookies."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User session logged out successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized or missing token")
    })
    @PostMapping(value = "/logout", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        logoutService.readRefreshTokenFromRequest(request)
                .ifPresent(logoutService::revokedRefreshToken);
        logoutService.readAccessTokenFromRequest(request)
                .ifPresent(logoutService::revokedAccessToken);
        logoutService.clearResponse(response);
        log.info("User logged out successfully");
        return ResponseEntity.ok("Logout successful");
    }

}
