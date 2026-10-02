package com.pranit.docmind.tenant.application.config;

import com.pranit.docmind.tenant.application.service.impl.TenantDataSource;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class DbConfig {

    @Bean
    public JdbcChatMemoryRepository jdbcChatMemoryRepository(DataSource dataSource) {
        DataSource tenantDataSource = new TenantDataSource(dataSource);
        JdbcTemplate jdbcTemplate = new JdbcTemplate(tenantDataSource);
        return JdbcChatMemoryRepository.builder()
                .jdbcTemplate(jdbcTemplate)
                .build();
    }
}
