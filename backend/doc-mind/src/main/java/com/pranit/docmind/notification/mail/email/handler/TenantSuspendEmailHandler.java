package com.pranit.docmind.notification.mail.email.handler;

import com.pranit.docmind.notification.api.EmailPurpose;
import com.pranit.docmind.notification.api.TenantControlEvent;
import com.pranit.docmind.notification.mail.email.EmailHandler;
import com.pranit.docmind.notification.mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSuspendEmailHandler implements EmailHandler<TenantControlEvent> {

    private final EmailService emailService;

    @Override
    public EmailPurpose supports() {
        return EmailPurpose.SUSPEND;
    }

    @Override
    public void send(final TenantControlEvent event) {
        log.info("Sending Tenant suspend email. EventID: {}, company name: {}", event.eventId(), event.companyName());
        emailService.sendEmail(event.email(),
                "Your workspace is suspended!",
                "tenant-suspend-email",
                Map.of("companyCode", event.companyCode(),
                        "companyName", event.companyName()));
    }
}