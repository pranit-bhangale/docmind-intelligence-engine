package com.pranit.docmind.tenant.application.service.impl;

import jakarta.persistence.PersistenceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.cfg.MultiTenancySettings;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Provides database connections for Hibernate multi-tenancy using PostgreSQL
 * schemas.
 *
 * <p>Each tenant is mapped to a dedicated schema. The tenant schema is placed
 * first in the PostgreSQL {@code search_path}, followed by the shared
 * {@code auth} schema.</p>
 *
 * <p>For example, for tenant {@code tenant_acme}, the connection uses:</p>
 *
 * <pre>
 * SET search_path TO tenant_acme, auth
 * </pre>
 *
 * <p>This allows tenant-specific tables to be resolved from the tenant schema
 * while shared tables can be resolved from the {@code auth} schema.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MultiTenantConnectionProviderImpl implements MultiTenantConnectionProvider<String>, HibernatePropertiesCustomizer {

    private static final String AUTH_SCHEMA = "auth";
    private static final Pattern VALID_SCHEMA_NAME = Pattern.compile("^tenant_[a-z0-9_]{1,50}$");
    private final DataSource dataSource;

    /**
     * Indicates whether this provider can be unwrapped to the requested type.
     *
     * @param unwrapType requested type
     * @return {@code false} because this provider does not support unwrapping
     */
    @Override
    public boolean isUnwrappableAs(final @NonNull Class<?> unwrapType) {
        return false;
    }

    /**
     * Attempts to unwrap this provider.
     *
     * @param unwrapType requested type
     * @param <T>        requested type
     * @return never returns
     * @throws IllegalArgumentException because unwrapping is not supported
     */
    @Override
    public <T> T unwrap(final @NonNull Class<T> unwrapType) {
        throw new PersistenceException("Cannot unwrap MultiTenantConnectionProvider to " + unwrapType);
    }

    /**
     * Registers this connection provider with Hibernate.
     *
     * @param hibernateProperties Hibernate properties
     */
    @Override
    public void customize(final Map<String, Object> hibernateProperties) {
        hibernateProperties.put(MultiTenancySettings.MULTI_TENANT_CONNECTION_PROVIDER, this);
    }

    private void closeConnection(final Connection connection, final String tenantIdentifier) {
        try {
            connection.close();
        } catch (final SQLException closeException) {
            log.error("Failed to close connection for tenant: {}", tenantIdentifier, closeException);
        }
    }

    /**
     * Obtains a connection without applying a tenant-specific schema.
     *
     * <p>Hibernate uses this connection for operations where a tenant
     * identifier is not yet available, such as metadata-related operations.</p>
     *
     * @return database connection
     * @throws SQLException if a connection cannot be obtained
     */
    @Override
    public Connection getAnyConnection() throws SQLException {
        return this.dataSource.getConnection();
    }

    /**
     * Releases a connection obtained through {@link #getAnyConnection()}.
     *
     * @param connection database connection
     * @throws SQLException if the connection cannot be closed
     */
    @Override
    public void releaseAnyConnection(final Connection connection) throws SQLException {
        connection.close();
    }

    /**
     * Obtains a connection configured for the specified tenant.
     *
     * <p>The tenant schema is placed first in the PostgreSQL search path,
     * followed by the shared {@code auth} schema.</p>
     *
     * @param tenantIdentifier tenant schema name
     * @return tenant-specific database connection
     * @throws SQLException if the tenant identifier is invalid or the
     *                      connection cannot be configured
     */
    @Override
    public Connection getConnection(final String tenantIdentifier) throws SQLException {
        log.debug("Getting connection for tenant: {}", tenantIdentifier);
        final Connection connection = getAnyConnection();
        try {
            validateTenantIdentifier(tenantIdentifier);
            try (var statement = connection.createStatement()) {
                if (AUTH_SCHEMA.equals(tenantIdentifier)) {
                    statement.execute("SET search_path TO " + AUTH_SCHEMA);
                    log.trace("Set search_path to platform schema: {}", AUTH_SCHEMA);
                } else {
                    statement.execute("SET search_path TO " + tenantIdentifier + ", " + AUTH_SCHEMA);
                    log.trace("Set search_path to tenant schema: {}, shared schema: {}", tenantIdentifier, AUTH_SCHEMA);
                }
            }
            return connection;
        } catch (final SQLException e) {
            closeConnection(connection, tenantIdentifier);
            throw e;
        }
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection) {
        try (connection) {
            try (var statement = connection.createStatement()) {
                statement.execute("SET search_path TO " + AUTH_SCHEMA);
            }
        } catch (SQLException exception) {
            log.error("Error resetting connection for tenant: {}", tenantIdentifier, exception);
        }
    }

    @Override
    public boolean supportsAggressiveRelease() {
        return false;
    }

    private void validateTenantIdentifier(final String tenantIdentifier) throws SQLException {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            throw new SQLException("Tenant identifier is required");
        }
        if (AUTH_SCHEMA.equals(tenantIdentifier)) return;
        if (!VALID_SCHEMA_NAME.matcher(tenantIdentifier).matches()) {
            throw new SQLException("Invalid tenant schema: " + tenantIdentifier);
        }
    }
}
