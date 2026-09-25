package com.pranit.docmind.auth.infrastructure.security.filter;

import com.pranit.docmind.auth.application.service.UserDetailService;
import com.pranit.docmind.auth.infrastructure.helper.SecurityResponse;
import com.pranit.docmind.auth.infrastructure.security.endpoints.PublicEndpointProvider;
import com.pranit.docmind.auth.infrastructure.security.service.ExtractClaim;
import com.pranit.docmind.auth.infrastructure.security.service.ResolveAccessToken;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
@Component
@RequiredArgsConstructor
@NullMarked
public class AuthenticationTokenFilter extends OncePerRequestFilter {

    private final ExtractClaim extractClaim;
    private final PublicEndpointProvider publicEndpointProvider;
    private final UserDetailService userDetailService;
    private final ResolveAccessToken resolveAccessToken;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(final HttpServletRequest request) {
        final String path = request.getRequestURI();
        final boolean publicEndpoint = Arrays.stream(publicEndpointProvider.publicEndpoints())
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
        if (publicEndpoint) {
            log.trace("Skipping authentication filter for public endpoint: {}", path);
        }
        return publicEndpoint;
    }

    /**
     * If Token is Valid then authentication Object is set in Security Context holder where it holds status where client is authenticated or unauthenticated
     */
    @Override
    protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response, final FilterChain filterChain) throws IOException {
        log.debug("Processing authentication for request: {} {}",
                request.getMethod(), request.getRequestURI());
        try {
            final String accessToken = resolveAccessToken.getAccessTokenFromRequest(request);
            if (accessToken == null || accessToken.isBlank()) {
                log.debug("No access token found for request: {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }
            final Authentication existingAuthentication = SecurityContextHolder.getContext().getAuthentication();
            if (existingAuthentication != null && existingAuthentication.isAuthenticated()) {
                log.debug("Request already authenticated: {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }
            final Claims claims = extractClaim.validateAndParseToken(accessToken);
            log.trace("Access token successfully validated for request: {}", request.getRequestURI());
            if (!extractClaim.isAccessToken(claims)) {
                log.warn("Authentication rejected: token is not an access token, request: {}",
                        request.getRequestURI());
                SecurityContextHolder.clearContext();
                SecurityResponse.unauthorized
                        (request, response, "Invalid access token.");
                return;
            }
            final String username = extractClaim.getUsernameFromAccessToken(claims);
            if (username == null || username.isBlank()) {
                log.warn("Authentication rejected: access token has no username, request: {}",
                        request.getRequestURI());
                SecurityContextHolder.clearContext();
                SecurityResponse.unauthorized
                        (request, response, "Invalid access token.");
                return;
            }
            final UserDetails details = userDetailService.loadUserByUsername(username);
            if (!isUserEligibleForAuthentication(details)) {
                log.warn("Authentication rejected: user account is not eligible, username: {}, request: {}",
                        username, request.getRequestURI());
                SecurityContextHolder.clearContext();
                SecurityResponse.unauthorized
                        (request, response, "User account is not eligible for authentication.");
                return;
            }
            authenticate(request, details);
            log.info("User authenticated successfully, username: {}, request: {}",
                    username, request.getRequestURI());
            filterChain.doFilter(request, response);
        } catch (UsernameNotFoundException e) {
            SecurityContextHolder.clearContext();
            log.warn("Authentication rejected: user not found, request: {}", request.getRequestURI());
            SecurityResponse.unauthorized(request, response, "Invalid authentication token.");
        } catch (JwtException e) {
            SecurityContextHolder.clearContext();
            log.warn("Authentication rejected: invalid or expired token, request: {}", request.getRequestURI());
            SecurityResponse.unauthorized(request, response, "Invalid or expired access token.");
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            log.error("Unexpected authentication error, request: {}, message: {}",
                    request.getRequestURI(), e.getMessage(), e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Authentication failed.");
        }
    }

    private boolean isUserEligibleForAuthentication(final UserDetails userDetails) {
        return userDetails.isEnabled()
                && userDetails.isAccountNonExpired()
                && userDetails.isAccountNonLocked()
                && userDetails.isCredentialsNonExpired();
    }

    private void authenticate(final HttpServletRequest request, final UserDetails details) {
        UsernamePasswordAuthenticationToken authentication =
                UsernamePasswordAuthenticationToken.authenticated(
                        details, null, details.getAuthorities()
                );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
