package com.pranit.docmind.auth.application.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Optional;

public interface TokenService {

    Optional<String> readRefreshTokenFromRequest(HttpServletRequest request);

    void generateNewRefreshToken(String refreshToken, HttpServletResponse response);
}
