package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.tenant.api.TenantSchemaResolver;
import com.pranit.docmind.tenant.exception.TenantNotFoundException;
import com.pranit.docmind.tenant.exception.TenantSchemaResolutionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantSchemaResolverImpl implements TenantSchemaResolver {

    private static final String DEFAULT_SCHEMA = "auth";
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Cacheable(value = "tenantSchemas", key = "#tenantId")
    public String resolveTenantSchema(final String tenantId) {
        if (tenantId == null || tenantId.isBlank()) return DEFAULT_SCHEMA;
        try {
            final String companyCode = jdbcTemplate.queryForObject(
                    """
                            SELECT company_code
                            FROM auth.tenants
                            WHERE tenant_id = ?
                              AND deleted = false
                            """,
                    String.class, tenantId);
            if (companyCode == null || companyCode.isBlank()) {
                throw new TenantNotFoundException("Tenant not found");
            }
            final String schemaName = "tenant_" + companyCode.trim().toLowerCase(Locale.ROOT);
            log.debug("Resolved tenant schema: {} for tenant: {}", schemaName, tenantId);
            return schemaName;
        } catch (TenantNotFoundException exception) {
            throw exception;
        } catch (Exception e) {
            log.error("Error resolving tenant schema for tenant: {}", tenantId, e);
            throw new TenantSchemaResolutionException("Unable to resolve schema for tenant: " + tenantId + " Error: " + e.getMessage());
        }
    }
}
