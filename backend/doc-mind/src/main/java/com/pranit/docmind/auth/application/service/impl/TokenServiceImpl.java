package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.TokenService;
import com.pranit.docmind.auth.application.service.UserDetailService;
import com.pranit.docmind.auth.domain.entity.RefreshToken;
import com.pranit.docmind.auth.domain.model.UserDetail;
import com.pranit.docmind.auth.domain.repository.RefreshTokenRepository;
import com.pranit.docmind.auth.exception.TokenExpiredException;
import com.pranit.docmind.auth.exception.TokenOwnerException;
import com.pranit.docmind.auth.exception.UnauthorizedException;
import com.pranit.docmind.auth.infrastructure.helper.Generate;
import com.pranit.docmind.auth.infrastructure.properties.CookieProperties;
import com.pranit.docmind.auth.infrastructure.properties.TokenProperties;
import com.pranit.docmind.auth.infrastructure.security.service.CookieService;
import com.pranit.docmind.auth.infrastructure.security.service.ExtractClaim;
import com.pranit.docmind.auth.infrastructure.security.service.GenerateToken;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.api.TenantSchemaResolver;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final GenerateToken generateToken;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ExtractClaim extractClaim;
    private final CookieService cookieService;
    private final CookieProperties cookieProperties;
    private final TokenProperties tokenProperties;
    private final UserDetailService userDetailService;
    private final TenantSchemaResolver tenantSchemaResolver;

    @Override
    public Optional<String> readRefreshTokenFromRequest(final HttpServletRequest request) {
        final Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) return Optional.empty();
        return Arrays.stream(cookies)
                .filter(cookie -> this.cookieProperties.name().refreshTokenName().equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void generateNewRefreshToken(final String refreshToken, final HttpServletResponse response) {
        final Claims claims = this.extractClaim.validateAndParseToken(refreshToken);
        if (!this.extractClaim.isRefreshToken(claims)) {
            throw new UnauthorizedException("Invalid token");
        }
        final String tenantId = this.extractClaim.getTenantIdFromAccessToken(claims);
        final boolean contextSetHere;
        if (TenantContext.getCurrentSchema() == null) {
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContext.setCurrentTenant(tenantId);
                TenantContext.setCurrentSchema(this.tenantSchemaResolver.resolveTenantSchema(tenantId));
            } else {
                TenantContext.setCurrentTenant(null);
                TenantContext.setCurrentSchema("auth");
            }
            contextSetHere = true;
        } else {
            contextSetHere = false;
        }
        try {
            rotateToken(claims, response);
        } finally {
            if (contextSetHere) {
                TenantContext.clear();
            }
        }
    }

    private void rotateToken(final Claims claims, final HttpServletResponse response) {
        final String jti = this.extractClaim.getJtiFromRefreshToken(claims);
        final UUID userId = this.extractClaim.getUserIdFromRefreshToken(claims);
        if (jti == null || jti.isBlank() || userId == null) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        final RefreshToken existingToken = this.refreshTokenRepository.findByJtiForUpdate(jti)
                .orElseThrow(() -> {
                    log.warn("Refresh token not found jti: {}", jti);
                    return new UnauthorizedException("Invalid refresh token");
                });
        validateOwnership(existingToken, userId);
        if (existingToken.isRevoked()) {
            log.warn("Refresh token reuse detected userId: {}", userId);
            refreshTokenRepository.revokeAllByUserId(userId);
            throw new UnauthorizedException("Token reuse detected");
        }
        final Instant now = Instant.now();
        if (!existingToken.getExpiresAt().isAfter(now)) {
            log.debug("Refresh token expired userId: {}", userId);
            existingToken.setRevoked(true);
            throw new TokenExpiredException("Refresh token expired");
        }
        final UserDetail userDetail = (UserDetail) this.userDetailService.loadUserByUsername(existingToken.getUser().getUsername());
        final String newJti = Generate.jti();
        final Duration accessTokenTtl = Duration.ofSeconds(tokenProperties.accessToken().expiration());
        final Duration refreshTokenTtl = Duration.ofSeconds(tokenProperties.refreshToken().expiration());
        final String newAccessToken = this.generateToken.generateAccessToken(userDetail);
        final String newRefreshToken = this.generateToken.generateRefreshToken(userDetail, newJti);
        existingToken.setRevoked(true);
        existingToken.setReplacedByToken(newJti);
        final RefreshToken rotatedToken = RefreshToken.builder()
                .jti(newJti)
                .user(existingToken.getUser())
                .expiresAt(now.plus(refreshTokenTtl))
                .revoked(false)
                .build();
        this.refreshTokenRepository.save(rotatedToken);
        this.cookieService.attachAccessTokenCookie(response, newAccessToken, accessTokenTtl);
        this.cookieService.attachRefreshTokenCookie(response, newRefreshToken, refreshTokenTtl);
        this.cookieService.addNoStoreHeaders(response);
        log.info("Refresh token rotated userId={}", userId);
    }

    private void validateOwnership(final RefreshToken refreshToken, final UUID userId) {
        if (refreshToken.getUser() == null) {
            log.warn("Refresh token has no user");
            throw new UnauthorizedException("Invalid refresh token");
        }
        if (!refreshToken.getUser().getUserId().equals(userId)) {
            log.warn("Refresh token ownership validation failed");
            throw new TokenOwnerException("Invalid refresh token");
        }
    }
}
