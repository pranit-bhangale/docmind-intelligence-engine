package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.LogoutService;
import com.pranit.docmind.auth.domain.entity.RefreshToken;
import com.pranit.docmind.auth.domain.repository.RefreshTokenRepository;
import com.pranit.docmind.auth.infrastructure.properties.CookieProperties;
import com.pranit.docmind.auth.infrastructure.security.service.CookieService;
import com.pranit.docmind.auth.infrastructure.security.service.ExtractClaim;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogoutServiceImpl implements LogoutService {

    private final CookieProperties cookieProperties;
    private final ExtractClaim extractClaim;
    private final RefreshTokenRepository refreshTokenRepository;
    private final CookieService cookieService;

    @Override
    public Optional<String> readRefreshTokenFromRequest(final HttpServletRequest request) {
        return readCookie(request, this.cookieProperties.name().refreshTokenName());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void revokedRefreshToken(final String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return;
        final Claims claims;
        try {
            claims = this.extractClaim.validateAndParseToken(refreshToken);
        } catch (JwtException ex) {
            return;
        }
        if (!this.extractClaim.isRefreshToken(claims)) {
            return;
        }
        final String jti = this.extractClaim.getJtiFromRefreshToken(claims);
        final UUID userId = this.extractClaim.getUserIdFromRefreshToken(claims);
        if (jti == null || jti.isBlank() || userId == null) return;
        final RefreshToken token = this.refreshTokenRepository.findByJtiForUpdate(jti).orElse(null);
        if (token == null) return;
        if (token.getUser() == null || !token.getUser().getUserId().equals(userId)) {
            log.warn("Refresh token ownership validation failed");
            return;
        }
        this.refreshTokenRepository.revokeAllByUserId(userId);
        log.info("User logged out userId: {}", userId);
    }

    @Override
    public Optional<String> readAccessTokenFromRequest(final HttpServletRequest request) {
        return readCookie(request, cookieProperties.name().accessTokenName());
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void revokedAccessToken(final String accessToken) {
        if (accessToken == null || accessToken.isBlank()) return;
        final Claims claims;
        try {
            claims = this.extractClaim.validateAndParseToken(accessToken);
        } catch (JwtException ex) {
            log.debug("Invalid access token during logout");
            return;
        }
        if (!this.extractClaim.isAccessToken(claims)) return;
        final UUID userId = this.extractClaim.getUserIdFromAccessToken(claims);
        if (userId == null) return;
        this.refreshTokenRepository.revokeAllByUserId(userId);
        log.info("Access session revoked userId: {}", userId);
    }

    @Override
    public void clearResponse(final HttpServletResponse response) {
        this.cookieService.clearAccessTokenCookie(response);
        this.cookieService.clearRefreshTokenCookie(response);
        this.cookieService.addNoStoreHeaders(response);
        SecurityContextHolder.clearContext();
    }

    private Optional<String> readCookie(final HttpServletRequest request, final String cookieName) {
        final Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) return Optional.empty();
        return Arrays.stream(cookies)
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }
}
