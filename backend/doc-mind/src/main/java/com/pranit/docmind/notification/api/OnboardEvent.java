package com.pranit.docmind.notification.api;

import com.pranit.docmind.notification.mail.event.EmailEvent;
import lombok.Builder;

@Builder
public record OnboardEvent(
        String eventId,
        String email,
        String companyCode,
        String username,
        String password
) implements EmailEvent {
}
