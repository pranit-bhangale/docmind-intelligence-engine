package com.pranit.docmind.auth.application.service.impl;

import com.pranit.docmind.auth.application.service.VerificationService;
import com.pranit.docmind.auth.domain.dto.VerificationResponse;
import com.pranit.docmind.auth.domain.dto.VerifyOtp;
import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements VerificationService {

    private final OtpService otpService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public VerificationResponse verifyPasswordResetOtp(final VerifyOtp request) {
        final EmailPurpose type = EmailPurpose.PASSWORD_CHANGE;
        final String email = verifyOtp(request.challengeId(), request.otp(), type);
        log.warn("Otp successfully verified for email: {}", email);
        return VerificationResponse.builder()
                .message("OTP verified successfully")
                .build();
    }

    private String verifyOtp(final String challengeId, final String otp, final EmailPurpose purpose) {
        return this.otpService.verifyOtp(challengeId, otp, purpose);
    }
}
