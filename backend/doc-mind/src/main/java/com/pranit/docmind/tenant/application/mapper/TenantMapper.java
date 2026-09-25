package com.pranit.docmind.tenant.application.mapper;

import com.pranit.docmind.tenant.domain.dto.TenantRegisterRequest;
import com.pranit.docmind.tenant.domain.dto.TenantResponse;
import com.pranit.docmind.tenant.domain.entity.Tenant;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class TenantMapper {

    public Tenant toEntity(final TenantRegisterRequest request) {
        return Tenant.builder()
                .companyName(request.companyName())
                .companyCode(request.companyCode())
                .createdAt(Instant.now())
                .email(request.email())
                .adminFullName(request.adminFullName())
                .adminEmail(request.adminEmail())
                .adminUsername(request.adminUsername())
                .deleted(false)
                .build();
    }

    public TenantResponse toResponse(final Tenant tenant) {
        return TenantResponse.builder()
                .tenantId(tenant.getTenantId())
                .companyName(tenant.getCompanyName())
                .companyCode(tenant.getCompanyCode())
                .createdAt(tenant.getCreatedAt())
                .email(tenant.getEmail())
                .adminFullName(tenant.getAdminFullName())
                .adminEmail(tenant.getAdminEmail())
                .adminUsername(tenant.getAdminUsername())
                .status(tenant.getStatus())
                .build();
    }
}
