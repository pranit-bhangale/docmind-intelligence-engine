package com.pranit.docmind.auth.controller;

import com.pranit.docmind.auth.application.service.LoginService;
import com.pranit.docmind.auth.application.service.LogoutService;
import com.pranit.docmind.auth.application.service.TokenService;
import com.pranit.docmind.auth.domain.dto.LoginRequest;
import com.pranit.docmind.auth.domain.dto.LoginResponse;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.auth.exception.UnauthorizedException;
import io.swagger.v3.oas.annotations.Operation;
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
        name = "Authentication",
        description = "Endpoints for user authentication, token refresh, and logout."
)
public class LoginController {

    private final LoginService loginService;
    private final TokenService tokenService;
    private final LogoutService logoutService;

    /**
     * api authenticateUser(username,password) --> call authentication manager --> call authentication provider --> call userDetailService --> call database to fetch data
     * once data is validated then security context holder confirms that request is authenticated
     * after that Access token is generated for client and send back to client
     * in HttpOnlyCookie
     */
    @Operation(
            summary = "Authenticate user",
            description = "Authenticates the user and sets the access and refresh tokens in secure HTTP-only cookies."
    )
    @PostMapping(value = "/login", version = "v1")
    public ResponseEntity<LoginResponse> authenticateUser(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        final LoginResponse loginRespone = loginService.authenticateUser(request, response);
        return ResponseEntity.ok().body(loginRespone);
    }

    @GetMapping(value = "/me", version = "v1")
    @PreAuthorize("hasAnyRole('COMPANY_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'USER')")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok().body(loginService.getCurrentUser());
    }

    @Operation(
            summary = "Refresh access token",
            description = "Validates the refresh token and generates a new access and refresh token."
    )
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
            summary = "Logout user",
            description = "Revokes the user's access and refresh tokens and clears the authentication cookies."
    )
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
