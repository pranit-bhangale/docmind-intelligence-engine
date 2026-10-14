package com.pranit.docmind.auth.infrastructure.helper;

import com.pranit.docmind.auth.exception.UnauthorizedException;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.domain.entity.Tenant;
import com.pranit.docmind.tenant.domain.entity.TenantStatus;
import com.pranit.docmind.tenant.domain.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublicTenantContextHelper {

    private static final String DEFAULT_INACTIVE_MESSAGE = "Your organization is not permitted to access this resource.";

    private final TenantRepository tenantRepository;

    public void setupTenantContext(final String companyCode) {
        setupTenantContext(companyCode, DEFAULT_INACTIVE_MESSAGE);
    }

    public void setupTenantContext(final String companyCode, final String inactiveOrgMessage) {
        if (companyCode == null || companyCode.isBlank()) {
            TenantContext.setCurrentTenant(null);
            TenantContext.setCurrentSchema("auth");
            log.debug("Request without company code - targeting platform schema 'auth'");
            return;
        }
        final String trimmedCompanyCode = companyCode.trim();
        final Tenant tenant = this.tenantRepository.findByCompanyCode(trimmedCompanyCode)
                .orElseThrow(() -> new UnauthorizedException("Invalid company code or credentials"));
        if (tenant.getStatus() != TenantStatus.ACTIVE) {
            throw new UnauthorizedException(inactiveOrgMessage != null ? inactiveOrgMessage : DEFAULT_INACTIVE_MESSAGE);
        }
        final String schemaName = "tenant_" + tenant.getCompanyCode().trim().toLowerCase(Locale.ROOT);
        TenantContext.setCurrentTenant(tenant.getTenantId());
        TenantContext.setCurrentSchema(schemaName);
        log.debug("Tenant context initialized: tenant: {}, schema: {}", tenant.getTenantId(), schemaName);
    }
}
