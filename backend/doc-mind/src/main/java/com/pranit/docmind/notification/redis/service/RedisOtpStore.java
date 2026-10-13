package com.pranit.docmind.notification.redis.service;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.redis.model.OtpVault;

import java.time.Duration;
import java.util.Optional;

public interface RedisOtpStore {

    void saveChallenge(String challengeId, OtpVault vault, Duration ttl);

    Optional<OtpVault> getChallenge(String challengeId, EmailPurpose purpose);

    void deleteChallenge(String challengeId, EmailPurpose purpose);

    void setCurrentChallenge(String email, EmailPurpose purpose, String challengeId, Duration ttl);

    boolean isCurrentChallenge(String email, EmailPurpose purpose, String challengeId);

    int incrementFailures(String email, EmailPurpose purpose, Duration ttl);

    void lockOtpRequests(String email, Duration duration);

    boolean isOtpRequestLocked(String email);

    void clearOtpState(String email, String challengeId, EmailPurpose purpose);
}