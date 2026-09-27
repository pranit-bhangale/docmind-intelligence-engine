package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.LoginService;
import com.pranit.docmind.auth.application.service.RestoreUserAccount;
import com.pranit.docmind.auth.domain.dto.LoginRequest;
import com.pranit.docmind.auth.domain.dto.LoginResponse;
import com.pranit.docmind.auth.domain.dto.UserResponse;
import com.pranit.docmind.auth.domain.entity.RefreshToken;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.model.UserDetail;
import com.pranit.docmind.auth.domain.repository.RefreshTokenRepository;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.exception.UnauthorizedException;
import com.pranit.docmind.auth.infrastructure.helper.Generate;
import com.pranit.docmind.auth.infrastructure.properties.TokenProperties;
import com.pranit.docmind.auth.infrastructure.security.service.CookieService;
import com.pranit.docmind.auth.infrastructure.security.service.GenerateToken;
import com.pranit.docmind.shared.helper.SecurityContext;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoginServiceImpl implements LoginService {

    private final AuthenticationManager authenticationManager;
    private final TokenProperties tokenProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final GenerateToken generateToken;
    private final CookieService cookieService;
    private final UserRepository userRepository;
    private final RestoreUserAccount restoreUserAccount;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public LoginResponse authenticateUser(final LoginRequest request, final HttpServletResponse response) {
        final UserDetail authenticatedUser = authenticate(request);
        final UserDetail userDetail = restoreIfRequired(authenticatedUser);
        final String jti = Generate.generateJti();
        final Instant now = Instant.now();
        saveRefreshToken(userDetail, jti, now);
        final String accessToken = this.generateToken.generateAccessToken(userDetail);
        final String refreshToken = this.generateToken.generateRefreshToken(userDetail, jti);
        attachCookies(response, accessToken, refreshToken);
        log.info("User logged in successfully userId: {}", userDetail.userId());
        return LoginResponse.builder()
                .username(userDetail.username())
                .roles(extractRoles(userDetail))
                .build();
    }

    @Override
    public UserResponse getCurrentUser() {
        final UserDetail principal = SecurityContext.getUserDetail();
        return UserResponse.builder()
                .userId(principal.userId())
                .username(principal.username())
                .firstName(principal.firstName())
                .lastName(principal.lastName())
                .email(principal.email())
                .authorities(principal.authorities())
                .deleted(principal.deleted())
                .enabled(principal.enabled())
                .accountNonExpired(principal.accountNonExpired())
                .accountNonLocked(principal.accountNonLocked())
                .credentialsNonExpired(principal.credentialsNonExpired())
                .build();
    }

    private UserDetail authenticate(final LoginRequest request) {
        try {
            final Authentication authentication = this.authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.username(),
                            request.password())
            );

            if (!(authentication.getPrincipal() instanceof UserDetail userDetail)) {
                log.warn("Authentication returned invalid principal");
                throw new UnauthorizedException("Invalid authentication principal");
            }
            return userDetail;
        } catch (BadCredentialsException exception) {
            log.debug("Authentication failed");
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    private UserDetail restoreIfRequired(final UserDetail user) {
        if (!user.deleted()) return user;
        this.restoreUserAccount.restoreUserAccount(user.userId());
        return user.restored();
    }

    private void saveRefreshToken(final UserDetail userDetail, final String jti, final Instant now) {
        final User user = this.userRepository.getReferenceById(userDetail.userId());
        final RefreshToken refreshToken = RefreshToken.builder()
                .jti(jti)
                .user(user)
                .expiresAt(now.plusSeconds(this.tokenProperties.refreshToken().expiration()))
                .revoked(false)
                .build();
        this.refreshTokenRepository.save(refreshToken);
    }

    private void attachCookies(final HttpServletResponse response, final String accessToken, final String refreshToken) {
        final Duration accessTokenTtl = Duration.ofSeconds(this.tokenProperties.accessToken().expiration());
        final Duration refreshTokenTtl = Duration.ofSeconds(this.tokenProperties.refreshToken().expiration());
        this.cookieService.attachAccessTokenCookie(response, accessToken, accessTokenTtl);
        this.cookieService.attachRefreshTokenCookie(response, refreshToken, refreshTokenTtl);
        this.cookieService.addNoStoreHeaders(response);
    }

    private Set<String> extractRoles(final UserDetail user) {
        return user.authorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .filter(authority -> authority.startsWith("ROLE_"))
                .collect(Collectors.toUnmodifiableSet());
    }
}
