package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.tenant.api.TenantContext;
import io.micrometer.context.ThreadLocalAccessor;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TenantContextAccessor
        implements ThreadLocalAccessor<TenantContextAccessor.TenantContextValue> {

    private static final String KEY = "docmind-tenant-context";

    private static final String RESET = "\u001B[0m";
    private static final String CYAN = "\u001B[36m";
    private static final String GREEN = "\u001B[32m";
    private static final String YELLOW = "\u001B[33m";

    @Override
    public @NonNull Object key() {
        return KEY;
    }

    @Override
    public @Nullable TenantContextValue getValue() {
        String tenant = TenantContext.getCurrentTenant();
        String schema = TenantContext.getCurrentSchema();
        log.debug("{}[TENANT CONTEXT GET]{} thread : {} | tenant : {} | schema : {}",
                CYAN, RESET, Thread.currentThread().getName(), tenant, schema);
        if (tenant == null && schema == null) return null;
        return TenantContextValue.builder()
                .tenant(tenant)
                .schema(schema)
                .build();
    }

    @Override
    public void setValue(@NonNull TenantContextValue value) {
        TenantContext.clear();
        if (value.tenant() != null) {
            TenantContext.setCurrentTenant(value.tenant());
        }
        if (value.schema() != null) {
            TenantContext.setCurrentSchema(value.schema());
        }
        log.debug("{}[TENANT CONTEXT SET]{} thread : {} | tenant : {} | schema : {}",
                GREEN, RESET, Thread.currentThread().getName(), value.tenant(), value.schema());
    }

    /**
     * Clear tenant context from the current thread.
     */
    @Override
    public void setValue() {
        TenantContext.clear();
        log.debug("{}[TENANT CONTEXT CLEAR]{} thread : {}",
                YELLOW, RESET, Thread.currentThread().getName());
    }

    @Builder
    public record TenantContextValue(
            String tenant,
            String schema
    ) {
    }
}