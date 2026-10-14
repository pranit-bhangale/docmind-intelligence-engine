package com.pranit.docmind.notification.mail.email.handler;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OtpEvent;
import com.pranit.docmind.notification.mail.email.EmailHandler;
import com.pranit.docmind.notification.mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public final class PasswordChangeOtpHandler implements EmailHandler<OtpEvent> {

    private final EmailService emailService;

    @Override
    public EmailPurpose supports() {
        return EmailPurpose.PASSWORD_CHANGE;
    }

    @Override
    public void send(final OtpEvent event) {
        log.info("Sending password change OTP. EventID: {}", event.eventId());
        emailService.sendEmail(event.email(),
                "Password Change OTP",
                "password-change-otp",
                Map.of("otp", event.otp(),
                        "expiresInMinutes", event.expiresAt().toMinutes()));
    }
}