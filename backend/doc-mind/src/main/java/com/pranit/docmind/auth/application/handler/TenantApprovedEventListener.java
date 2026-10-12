package com.pranit.docmind.auth.application.handler;

import com.pranit.docmind.auth.application.service.UserService;
import com.pranit.docmind.shared.event.TenantApprovedEvent;
import com.pranit.docmind.tenant.api.TenantContext;
import com.pranit.docmind.tenant.api.TenantSchemaResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantApprovedEventListener {

    private final UserService userService;
    private final TenantSchemaResolver tenantSchemaResolver;

    @EventListener
    public void handle(final TenantApprovedEvent event) {
        log.info("Creating Initial Admin User for Tenant: {}", event.tenantId());
        final String schema = this.tenantSchemaResolver.resolveTenantSchema(event.tenantId());
        TenantContext.setCurrentTenant(event.tenantId());
        TenantContext.setCurrentSchema(schema);
        try {
            userService.createInitialAdmin(
                    event.tenantId(),
                    event.adminUsername(),
                    event.adminEmail(),
                    event.adminFullName(),
                    event.adminPassword()
            );
        } finally {
            TenantContext.clear();
        }
    }
}
