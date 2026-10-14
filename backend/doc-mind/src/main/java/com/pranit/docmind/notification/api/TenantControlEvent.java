package com.pranit.docmind.notification.api;

import com.pranit.docmind.notification.mail.event.EmailEvent;
import lombok.Builder;

@Builder
public record TenantControlEvent(
        String eventId,
        String email,
        String companyName,
        String companyCode
) implements EmailEvent {
}
