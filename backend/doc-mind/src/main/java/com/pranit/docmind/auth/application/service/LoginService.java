package com.pranit.docmind.auth.application.service;

import com.pranit.docmind.auth.domain.dto.LoginRequest;
import com.pranit.docmind.auth.domain.dto.LoginResponse;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

public interface LoginService {

    LoginResponse authenticateUser(@Valid LoginRequest request, @Valid HttpServletResponse response);

    UserResponse getCurrentUser();
}
