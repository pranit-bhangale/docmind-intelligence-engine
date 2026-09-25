package com.pranit.docmind.auth.infrastructure.security.service.impl;

import com.pranit.docmind.auth.infrastructure.properties.CookieProperties;
import com.pranit.docmind.auth.infrastructure.security.service.ResolveAccessToken;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
public final class ResolveAccessTokenImpl implements ResolveAccessToken {

    private final CookieProperties properties;

    @Override
    public String getAccessTokenFromRequest(final HttpServletRequest request) {
        log.info("Fetching access token from request");
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(cookie -> properties.name().accessTokenName().equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse(null);
    }
}
