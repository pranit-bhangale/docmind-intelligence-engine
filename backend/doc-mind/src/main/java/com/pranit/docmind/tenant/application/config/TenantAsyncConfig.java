package com.pranit.docmind.tenant.application.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class TenantAsyncConfig {

    @Bean(name = "provisioningExecutor")
    public Executor provisioningExecutor() {
        return Executors.newThreadPerTaskExecutor(
                Thread.ofVirtual()
                        .name("tenant-provisioning-", 0)
                        .factory()
        );
    }
}
