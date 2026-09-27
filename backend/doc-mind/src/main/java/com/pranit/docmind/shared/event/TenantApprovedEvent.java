package com.pranit.docmind.shared.event;

import lombok.Builder;

@Builder
public record TenantApprovedEvent(
        String tenantId,
        String adminUsername,
        String adminEmail,
        String adminFullName,
        String adminPassword
) {
}

