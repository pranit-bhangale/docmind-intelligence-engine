package com.pranit.docmind.auth.infrastructure.security.filter;

import com.pranit.docmind.auth.infrastructure.helper.SecurityResponse;
import com.pranit.docmind.auth.infrastructure.security.endpoints.PublicEndpointProvider;
import com.pranit.docmind.auth.infrastructure.security.service.ExtractClaim;
import com.pranit.docmind.auth.infrastructure.security.service.ResolveAccessToken;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.api.TenantSchemaResolver;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
@Component
@RequiredArgsConstructor
@NullMarked
public class TenantFilter extends OncePerRequestFilter {

    private final ExtractClaim extractClaim;
    private final ResolveAccessToken resolveAccessToken;
    private final TenantSchemaResolver tenantSchemaResolver;
    private final PublicEndpointProvider publicEndpointProvider;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(final HttpServletRequest request) {
        final String path = request.getRequestURI();
        final boolean publicEndpoint = Arrays.stream(publicEndpointProvider.publicEndpoints())
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
        if (publicEndpoint) {
            log.trace("Skipping tenant filter for public endpoint: {}", path);
        }
        return publicEndpoint;
    }

    @Override
    protected void doFilterInternal(
            final HttpServletRequest request,
            final HttpServletResponse response,
            final FilterChain filterChain) throws ServletException, IOException {
        log.debug("Processing tenant for request: {} {}",
                request.getMethod(), request.getRequestURI());
        try {
            final String accessToken = resolveAccessToken.getAccessTokenFromRequest(request);
            if (accessToken == null || accessToken.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }
            final Claims claims = extractClaim.validateAndParseToken(accessToken);
            if (!extractClaim.isAccessToken(claims)) {
                log.debug("Skipping tenant resolution: token is not an access token");
                filterChain.doFilter(request, response);
                return;
            }
            final String tenantId = extractClaim.getTenantIdFromAccessToken(claims);
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContext.setCurrentTenant(tenantId);
                final String schema = tenantSchemaResolver.resolveTenantSchema(tenantId);
                TenantContext.setCurrentSchema(schema);
                log.debug("Tenant context initialized for tenant: {}, schema: {}", tenantId, schema);
            }
            filterChain.doFilter(request, response);
        } catch (JwtException e) {
            log.warn("Tenant resolution rejected: invalid or expired token, request: {}",
                    request.getRequestURI());
            SecurityResponse.unauthorized(request, response, "Invalid or expired access token.");
        } finally {
            TenantContext.clear();
        }
    }
}
