package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.PasswordService;
import com.pranit.docmind.auth.domain.dto.ChangeForgotPasswordRequest;
import com.pranit.docmind.auth.domain.dto.ForgotPasswordEmail;
import com.pranit.docmind.auth.domain.dto.PasswordRequest;
import com.pranit.docmind.auth.domain.dto.PasswordResponse;
import com.pranit.docmind.auth.domain.entity.User;
import com.pranit.docmind.auth.domain.repository.RefreshTokenRepository;
import com.pranit.docmind.auth.domain.repository.UserRepository;
import com.pranit.docmind.auth.exception.PasswordNotMatchingException;
import com.pranit.docmind.auth.exception.PasswordValidationException;
import com.pranit.docmind.auth.exception.UserNotExistsException;
import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public PasswordResponse requestPasswordReset(final ForgotPasswordEmail request) {
        final String email = request.email();
        final EmailPurpose purpose = EmailPurpose.PASSWORD_CHANGE;
        final String challengeId = this.userRepository.findByEmail(email)
                .map(user -> {
                    final String id = this.otpService.sendOtp(user.getEmail(), purpose);
                    log.info("Forgot password OTP requested for userId: {}", user.getUserId());
                    return id;
                })
                .orElse(null);

        return PasswordResponse.builder()
                .challengeId(challengeId)
                .message("If the email is registered an OTP has been sent to your email.")
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public PasswordResponse resetPassword(final ChangeForgotPasswordRequest request) {
        validatePasswordMatch(request.passwordRequest());
        final String email = request.email().trim().toLowerCase();
        final User user = findUserByEmail(email);
        if (this.passwordEncoder.matches(request.passwordRequest().password(), user.getPassword())) {
            throw new PasswordValidationException("New password cannot be same as old password");
        }
        user.setPassword(this.passwordEncoder.encode(request.passwordRequest().password()));
        invalidateUserSession(user.getUserId());
        log.info("Forgot password reset completed successfully for userId: {}", user.getUserId());
        return PasswordResponse.builder()
                .message("Password changed successfully")
                .build();
    }

    private void validatePasswordMatch(final PasswordRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new PasswordNotMatchingException("Password and confirm password do not match");
        }
    }

    private User findUserByEmail(final String email) {
        return this.userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User with email {} not found", email);
                    return new UserNotExistsException("User not found");
                });
    }

    private void invalidateUserSession(final UUID userId) {
        this.refreshTokenRepository.revokeAllByUserId(userId);
    }
}
