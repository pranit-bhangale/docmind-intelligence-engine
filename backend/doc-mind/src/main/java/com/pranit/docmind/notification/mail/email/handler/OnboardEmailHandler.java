package com.pranit.docmind.notification.mail.email.handler;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OnboardEvent;
import com.pranit.docmind.notification.mail.email.EmailHandler;
import com.pranit.docmind.notification.mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardEmailHandler implements EmailHandler<OnboardEvent> {

    private final EmailService emailService;

    @Override
    public EmailPurpose supports() {
        return EmailPurpose.USER_ONBOARD;
    }

    @Override
    public void send(final OnboardEvent event) {
        log.info("Sending Onboard email. EventID: {}, username: {}", event.eventId(), event.username());
        emailService.sendEmail(event.email(),
                "Welcome! Your account is ready",
                "onboard-email",
                Map.of("companyCode", event.companyCode(),
                        "username", event.username(),
                        "password", event.password()));
    }
}