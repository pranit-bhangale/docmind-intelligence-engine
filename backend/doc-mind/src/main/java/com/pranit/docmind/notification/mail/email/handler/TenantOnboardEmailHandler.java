package com.pranit.docmind.notification.mail.email.handler;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.OnboardEvent;
import com.pranit.docmind.notification.api.TenantOnboardEvent;
import com.pranit.docmind.notification.mail.email.EmailHandler;
import com.pranit.docmind.notification.mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantOnboardEmailHandler implements EmailHandler<TenantOnboardEvent> {

    private final EmailService emailService;

    @Override
    public EmailPurpose supports() {
        return EmailPurpose.ONBOARD;
    }

    @Override
    public void send(final TenantOnboardEvent event) {
        log.info("Sending Tenant Onboard email. EventID: {}, company name: {}", event.eventId(), event.companyName());
        emailService.sendEmail(event.email(),
                "Your workspace is ready!",
                "tenant-onboard-email.html",
                Map.of("companyCode", event.companyCode(),
                        "username", event.companyName()));
    }
}