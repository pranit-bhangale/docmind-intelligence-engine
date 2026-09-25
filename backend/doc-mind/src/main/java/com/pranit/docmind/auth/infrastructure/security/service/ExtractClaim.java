package com.pranit.docmind.auth.infrastructure.security.service;

import io.jsonwebtoken.Claims;

import java.util.UUID;

public interface ExtractClaim {

    String getUsernameFromAccessToken(Claims claims);

    UUID getUserIdFromRefreshToken(Claims claims);

    String getTenantIdFromAccessToken(Claims claims);

    UUID getUserIdFromAccessToken(Claims claims);

    String getJtiFromRefreshToken(Claims claims);

    Claims validateAndParseToken(String token);

    boolean isRefreshToken(Claims claims);

    boolean isAccessToken(Claims claims);
}
