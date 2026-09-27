package com.pranit.docmind.auth.infrastructure.helper;

import lombok.experimental.UtilityClass;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@UtilityClass
public class Generate {
    private static final SecureRandom RANDOM = new SecureRandom();

    public static String generateEventId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static String generateJti() {
        return generateToken(64);
    }

    private static String generateToken(int length) {
        byte[] randomBytes = new byte[length];
        RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    public static String generateChallengeId() {
        return generateToken(6);
    }
}
