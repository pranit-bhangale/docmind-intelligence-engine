package com.pranit.docmind.auth.infrastructure.security.service.impl;

import com.pranit.docmind.auth.application.constant.Cookie;
import com.pranit.docmind.auth.infrastructure.properties.CookieProperties;
import com.pranit.docmind.auth.infrastructure.security.service.CookieService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class CookieServiceImpl implements CookieService {

    private final CookieProperties properties;

    @Override
    public void attachAccessTokenCookie(final HttpServletResponse response, final String value, final Duration maxAge) {
        addCookie(response, properties.name().accessTokenName(), value, maxAge);
    }

    private void addCookie(final HttpServletResponse response, final String name, final String value, final Duration maxAge) {
        final ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(properties.cookieHttpOnly())
                .secure(properties.cookieSecure())
                .path("/")
                .maxAge(maxAge)
                .sameSite(properties.cookieSameSite());
        final String cookieDomain = properties.cookieDomain();
        if (cookieDomain != null && !cookieDomain.isBlank()) builder.domain(cookieDomain);
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    @Override
    public void attachRefreshTokenCookie(final HttpServletResponse response, final String value, final Duration maxAge) {
        addCookie(response, properties.name().refreshTokenName(), value, maxAge);
    }

    @Override
    public void clearAccessTokenCookie(final HttpServletResponse response) {
        clearCookie(response, properties.name().accessTokenName());
    }

    private void clearCookie(final HttpServletResponse response, final String name) {
        final ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .httpOnly(properties.cookieHttpOnly())
                .secure(properties.cookieSecure())
                .path("/")
                .maxAge(Duration.ZERO)
                .sameSite(properties.cookieSameSite());
        final String cookieDomain = properties.cookieDomain();
        if (cookieDomain != null && !cookieDomain.isBlank()) builder.domain(cookieDomain);
        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    @Override
    public void clearRefreshTokenCookie(final HttpServletResponse response) {
        clearCookie(response, properties.name().refreshTokenName());
    }

    @Override
    public void addNoStoreHeaders(final HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, Cookie.CACHE_CONTROL_NO_STORE);
        response.setHeader(HttpHeaders.PRAGMA, Cookie.PRAGMA_NO_CACHE);
        response.setHeader(HttpHeaders.EXPIRES, Cookie.EXPIRES_IMMEDIATELY);
    }
}
