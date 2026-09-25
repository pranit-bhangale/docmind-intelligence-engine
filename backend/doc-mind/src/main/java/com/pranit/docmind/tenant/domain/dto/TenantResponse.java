package com.pranit.docmind.tenant.domain.dto;

import com.pranit.docmind.tenant.domain.entity.TenantStatus;
import lombok.Builder;

import java.time.Instant;

@Builder
public record TenantResponse(
        String tenantId,
        String companyName,
        String companyCode,
        String email,
        String adminFullName,
        String adminEmail,
        String adminUsername,
        String adminPassword,
        Instant createdAt,
        TenantStatus status
) {
}
