package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.tenant.api.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.AbstractDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

@Slf4j
public class TenantDataSource extends AbstractDataSource {

    private static final String AUTH_SCHEMA = "auth";
    private static final String RESET = "\u001B[0m";
    private static final String CYAN = "\u001B[36m";
    private static final String GREEN = "\u001B[32m";
    private static final String YELLOW = "\u001B[33m";
    private static final String RED = "\u001B[31m";

    private final DataSource delegate;

    public TenantDataSource(DataSource delegate) {
        this.delegate = delegate;
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = delegate.getConnection();
        try {
            applyTenantSchema(connection);
            return connection;
        } catch (SQLException exception) {
            connection.close();
            throw exception;
        }
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = delegate.getConnection(username, password);
        try {
            applyTenantSchema(connection);
            return connection;
        } catch (SQLException exception) {
            connection.close();
            throw exception;
        }
    }

    private void applyTenantSchema(Connection connection) throws SQLException {
        String schema = TenantContext.getCurrentSchema();
        String thread = Thread.currentThread().getName();
        if (schema == null || schema.isBlank()) {
            log.warn("{}[TENANT JDBC]{} NO TENANT CONTEXT | thread : {} | jdbcSchema : {}",
                    YELLOW, RESET, thread, connection.getSchema());
            return;
        }
        validateSchema(schema);
        String searchPath = schema + ", " + AUTH_SCHEMA;
        log.debug("{}[TENANT JDBC]{} APPLY | thread : {} | schema : {} | searchPath : {}",
                CYAN, RESET, thread, schema, searchPath);
        try (var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + searchPath);
        }
        log.debug("{}[TENANT JDBC]{} APPLIED | thread : {} | schema : {}",
                GREEN, RESET, thread, schema);
    }

    private void validateSchema(String schema) throws SQLException {
        if (!schema.matches("^tenant_[a-z0-9_]{1,50}$")) {
            log.error("{}[TENANT JDBC]{} INVALID SCHEMA | schema : {}",
                    RED, RESET, schema);
            throw new SQLException("Invalid tenant schema: " + schema);
        }
    }
}