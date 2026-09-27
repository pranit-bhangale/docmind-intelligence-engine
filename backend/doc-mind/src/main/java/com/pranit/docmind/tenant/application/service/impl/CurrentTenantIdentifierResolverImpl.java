package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.tenant.api.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.cfg.MultiTenancySettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Resolves the current Hibernate tenant identifier from the {@link TenantContext}.
 *
 * <p>The tenant identifier represents the database schema used for the current
 * request. When no tenant schema is present in the {@link TenantContext}, the
 * {@code auth} schema is used as the default schema.</p>
 *
 * <p>This resolver is also registered with Hibernate through
 * {@link HibernatePropertiesCustomizer}, allowing Hibernate to obtain the
 * current tenant identifier whenever it creates or resolves a tenant-aware
 * session.</p>
 */
@Slf4j
@Component
public class CurrentTenantIdentifierResolverImpl implements CurrentTenantIdentifierResolver<String>, HibernatePropertiesCustomizer {

    private static final String DEFAULT_TENANT = "auth";
    
    /**
     * Resolves the schema associated with the current request.
     *
     * <p>If a tenant schema has been set in {@link TenantContext}, that schema
     * is returned. Otherwise, the {@code auth} schema is returned.</p>
     *
     * @return the current tenant schema, or {@code auth} when no tenant
     * schema is present in the current context
     */
    @Override
    public String resolveCurrentTenantIdentifier() {
        final String schema = TenantContext.getCurrentSchema();
        log.trace("Resolving Current tenant schema identifier: {}", schema);
        return schema == null ? DEFAULT_TENANT : schema;
    }

    /**
     * Indicates whether Hibernate should validate the tenant identifier
     * associated with an existing session.
     *
     * <p>Returning {@code true} prevents an existing Hibernate session from
     * being reused when the current tenant identifier changes.</p>
     *
     * @return {@code true} to validate the current tenant identifier
     */
    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }

    /**
     * Registers this resolver with Hibernate.
     *
     * <p>This allows Hibernate to use this implementation when resolving
     * the current tenant identifier for tenant-aware database operations.</p>
     *
     * @param hibernateProperties Hibernate properties to customize
     */
    @Override
    public void customize(final Map<String, Object> hibernateProperties) {
        hibernateProperties.put(MultiTenancySettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this);
    }
}
