package com.pranit.docmind.tenant.application.service.impl;

import com.pranit.docmind.tenant.api.TenantContext;
import org.springframework.jdbc.datasource.AbstractDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

public class TenantDataSource extends AbstractDataSource {

    private final DataSource delegate;

    public TenantDataSource(DataSource delegate) {
        this.delegate = delegate;
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = delegate.getConnection();
        String schema = TenantContext.getCurrentSchema();
        if (schema != null && !schema.isBlank()) connection.setSchema(schema);
        return connection;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = delegate.getConnection(username, password);
        String schema = TenantContext.getCurrentSchema();
        if (schema != null && !schema.isBlank()) connection.setSchema(schema);
        return connection;
    }
}