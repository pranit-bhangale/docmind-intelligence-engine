package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.shared.event.TenantApprovedEvent;
import com.pranit.docmind.tenant.application.service.TenantProvisioningService;
import com.pranit.docmind.tenant.domain.entity.Tenant;
import com.pranit.docmind.tenant.domain.entity.TenantStatus;
import com.pranit.docmind.tenant.domain.repository.TenantRepository;
import com.pranit.docmind.tenant.exception.TenantNotFoundException;
import com.pranit.docmind.tenant.exception.TenantProvisioningException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TenantProvisioningServiceImpl implements TenantProvisioningService {

    private static final Pattern VALID_COMPANY_CODE = Pattern.compile("^[a-z0-9_]{1,50}$");
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final TenantRepository tenantRepository;
    private final ApplicationEventPublisher publisher;

    @Override
    @Async("provisioningExecutor")
    public void provisionTenant(final String tenantId) {
        final Tenant tenant = tenantRepository.findBytenantId(tenantId)
                .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        final String schemaName = buildSchemaName(tenant.getCompanyCode());
        try {
            log.info("Starting tenant provisioning: tenant: {}, schema: {}", tenant.getCompanyName(), schemaName);
            createSchema(schemaName);
            runTenantMigrations(schemaName);
            initializeDefaultData(schemaName, tenant);
            final int updated = tenantRepository.updateStatus
                    (tenantId, TenantStatus.PROVISIONING, TenantStatus.APPROVED);
            if (updated != 1) {
                throw new TenantProvisioningException("Unable to approve tenant: " + tenantId);
            }
            createInitialAdminUser(tenant);
            log.info("Tenant provisioning completed successfully: tenant: {}, schema: {}", tenant.getCompanyName(), schemaName);
        } catch (final Exception exception) {
            handleProvisioningFailure(tenantId, schemaName, exception);
        }
    }

    private String buildSchemaName(final String companyCode) {
        if (companyCode == null || companyCode.isBlank()) {
            throw new TenantProvisioningException("Company code must not be blank");
        }
        final String normalized = companyCode.trim().toLowerCase(Locale.ROOT);
        if (!VALID_COMPANY_CODE.matcher(normalized).matches()) {
            throw new TenantProvisioningException
                    ("Invalid company code. Only lowercase letters, " + "numbers and underscores are allowed.");
        }
        return "tenant_" + normalized;
    }

    private void createSchema(final String schemaName) {
        final String sql = String.format("CREATE SCHEMA IF NOT EXISTS %s", schemaName);
        this.jdbcTemplate.execute(sql);
    }

    private void runTenantMigrations(final String schemaName) {
        log.info("Running tenant migrations for schema: {}", schemaName);
        final Flyway flyway = Flyway.configure()
                .dataSource(this.dataSource)
                .schemas(schemaName)
                .defaultSchema(schemaName)
                .locations("classpath:db/migration/tenant")
                .baselineOnMigrate(true)
                .table("flyway_schema_history")
                .validateOnMigrate(true)
                .cleanDisabled(true)
                .failOnMissingLocations(true)
                .load();
        log.info("Starting tenant migrations: schema: {}", schemaName);
        flyway.migrate();
        log.info("Tenant migrations completed: schema: {}", schemaName);
    }

    private void initializeDefaultData(final String schemaName, final Tenant tenant) {
        log.info("Initializing default data: tenant: {}, schema: {}", tenant.getCompanyName(), schemaName);
        // here you can add default data initialization code
    }

    private void createInitialAdminUser(final Tenant tenant) {
        this.publisher.publishEvent(TenantApprovedEvent.builder()
                .tenantId(tenant.getTenantId())
                .adminUsername(tenant.getAdminUsername())
                .adminEmail(tenant.getAdminEmail())
                .adminFullName(tenant.getAdminFullName())
                .adminPassword(tenant.getAdminPassword())
                .build());
        log.info("Created initial admin user for tenant {}", tenant.getTenantId());
    }

    private void handleProvisioningFailure
            (final String tenantId, final String schemaName, final Exception provisioningException) {
        log.error("Tenant provisioning failed: tenantId: {}, schema: {}", tenantId, schemaName, provisioningException);
        try {
            rollbackProvisioning(schemaName, tenantId);
            final int updated = tenantRepository.updateStatus
                    (tenantId, TenantStatus.PROVISIONING, TenantStatus.PENDING);
            if (updated != 1) {
                log.error("CRITICAL: Failed to reset tenant to PENDING: tenantId: {}", tenantId);
                return;
            }
            log.info("Tenant {} rolled back successfully and reset to PENDING", tenantId);
        } catch (final Exception rollbackException) {
            log.error("CRITICAL: Tenant rollback failed. " + "Tenant remains PROVISIONING: tenantId: {}, schema: {}",
                    tenantId, schemaName, rollbackException);
            rollbackException.addSuppressed(provisioningException);
        }
    }

    private void rollbackProvisioning(final String schemaName, final String tenantId) {
        log.warn("Rolling back tenant provisioning: tenantId: {}, schema: {}", tenantId, schemaName);
        try {
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + schemaName + " CASCADE");
            log.info("Tenant provisioning rollback completed: tenantId: {}, schema: {}", tenantId, schemaName);
        } catch (final Exception exception) {
            log.error("Failed to rollback tenant provisioning: tenantId: {}, schema: {}", tenantId, schemaName, exception);
            throw new TenantProvisioningException("Failed to rollback tenant provisioning: " +
                    tenantId + " Error: " + exception.getMessage());
        }
    }
}
