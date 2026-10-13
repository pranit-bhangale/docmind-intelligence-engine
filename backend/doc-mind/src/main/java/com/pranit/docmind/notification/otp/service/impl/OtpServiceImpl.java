package com.pranit.docmind.notification.otp.service.impl;

import com.pranit.docmind.auth.infrastructure.helper.Generate;
import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.EmailRouter;
import com.pranit.docmind.notification.api.OtpEvent;
import com.pranit.docmind.notification.api.OtpService;
import com.pranit.docmind.notification.api.OtpStatus;
import com.pranit.docmind.notification.otp.exception.OTPValidationException;
import com.pranit.docmind.notification.otp.service.OtpGeneration;
import com.pranit.docmind.notification.redis.model.OtpVault;
import com.pranit.docmind.notification.redis.service.RedisOtpStore;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final int MAX_ATTEMPTS = 3;
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    private static final Duration LOCK_DURATION = Duration.ofMinutes(10);
    private final RedisOtpStore redisOtpStore;
    private final PasswordEncoder passwordEncoder;
    private final OtpGeneration otpGeneration;
    private final EmailRouter emailRouter;

    @Override
    public String sendOtp(final String email, final EmailPurpose purpose) {
        if (redisOtpStore.isOtpRequestLocked(email)) {
            throw new OTPValidationException("OTP requests are temporarily blocked. " + "Try again later.");
        }
        final String challengeId = Generate.challengeId();
        final String otp = otpGeneration.generateOtp();
        final String otpHash = passwordEncoder.encode(otp);
        final Instant expiresAt = Instant.now().plus(OTP_TTL);
        final OtpVault vault = OtpVault.builder()
                .email(email)
                .otp(otpHash)
                .purpose(purpose)
                .status(OtpStatus.PENDING)
                .challengeId(challengeId).expiresAt(expiresAt)
                .verifiedAt(null)
                .build();
        redisOtpStore.saveChallenge(challengeId, vault, OTP_TTL);
        redisOtpStore.setCurrentChallenge(email, purpose, challengeId, OTP_TTL);
        final OtpEvent data = OtpEvent.builder()
                .eventId(Generate.eventId())
                .email(email)
                .otp(otp)
                .build();
        emailRouter.send(data, purpose);
        return challengeId;
    }

    @Override
    public String verifyOtp(final String challengeId, final String otp, final EmailPurpose purpose) {
        final OtpVault vault = redisOtpStore.getChallenge(challengeId, purpose)
                .orElseThrow(() -> new OTPValidationException("OTP expired or invalid"));
        final String email = vault.email();
        if (vault.expiresAt() == null || !vault.expiresAt().isAfter(Instant.now())) {
            redisOtpStore.deleteChallenge(challengeId, purpose);
            throw new OTPValidationException("OTP expired or invalid");
        }
        if (!redisOtpStore.isCurrentChallenge(email, purpose, challengeId)) {
            throw new OTPValidationException("OTP expired or invalid");
        }
        if (vault.status() != OtpStatus.PENDING) {
            throw new OTPValidationException("OTP is no longer valid");
        }

        if (!passwordEncoder.matches(otp, vault.otp())) {
            handleFailedVerification(challengeId, email, purpose);
            throw new OTPValidationException("Verification failed");
        }
        handleSuccessfulVerification(challengeId, email, purpose);
        return email;
    }

    private void handleFailedVerification
            (final String challengeId, final String email, final EmailPurpose purpose) {
        final int failures = redisOtpStore.incrementFailures(email, purpose, OTP_TTL);
        if (failures >= MAX_ATTEMPTS) {
            redisOtpStore.lockOtpRequests(email, LOCK_DURATION);
            redisOtpStore.clearOtpState(email, challengeId, purpose);
            throw new OTPValidationException("Maximum OTP attempts exceeded. " + "Try again in 10 minutes.");
        }
        final int remaining = MAX_ATTEMPTS - failures;
        throw new OTPValidationException("Invalid OTP. " + remaining + " attempts remaining.");
    }

    private void handleSuccessfulVerification(final String challengeId, final String email, final EmailPurpose purpose) {
        redisOtpStore.clearOtpState(email, challengeId, purpose);
    }
}