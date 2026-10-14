package com.pranit.docmind.notification.redis.model;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OtpStatus;
import lombok.Builder;

import java.time.Instant;

@Builder
public record OtpVault(
        String challengeId,
        String email,
        String otp,
        EmailPurpose purpose,
        OtpStatus status,
        Instant expiresAt,
        Instant verifiedAt
) {
    public OtpVault withStatus(
            OtpStatus newStatus,
            Instant verifiedAt
    ) {
        return OtpVault.builder()
                .challengeId(challengeId)
                .email(email)
                .otp(otp)
                .purpose(purpose)
                .status(newStatus)
                .expiresAt(expiresAt)
                .verifiedAt(verifiedAt)
                .build();
    }
}