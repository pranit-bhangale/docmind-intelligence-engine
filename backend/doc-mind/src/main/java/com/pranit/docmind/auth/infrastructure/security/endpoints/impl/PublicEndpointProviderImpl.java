package com.pranit.docmind.auth.infrastructure.security.endpoints.impl;

import com.pranit.docmind.auth.infrastructure.security.endpoints.PublicEndpointProvider;
import org.springframework.stereotype.Service;

@Service
public class PublicEndpointProviderImpl implements PublicEndpointProvider {

    private static final String[] PUBLIC_ENDPOINTS = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/actuator/health",
            "/api/auth/login",
            "/api/tenants/register",
            "/api/auth/password/request-reset",
            "/api/auth/password/reset",
            "/api/auth/verify/password-reset"
    };

    @Override
    public String[] publicEndpoints() {
        return PUBLIC_ENDPOINTS;
    }
}
