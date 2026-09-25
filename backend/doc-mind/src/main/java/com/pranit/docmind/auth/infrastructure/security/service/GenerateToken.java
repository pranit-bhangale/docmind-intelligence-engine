package com.pranit.docmind.auth.infrastructure.security.service;


import com.pranit.docmind.auth.domain.model.UserDetail;

public interface GenerateToken {

    String generateAccessToken(UserDetail userDetail);

    String generateRefreshToken(UserDetail userDetail, String jti);
}
