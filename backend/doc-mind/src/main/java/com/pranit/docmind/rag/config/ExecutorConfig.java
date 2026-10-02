package com.pranit.docmind.rag.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class ExecutorConfig {

    @Bean(name = "enrichExecutor", destroyMethod = "close")
    public ExecutorService enrichExecutor() {
        return Executors.newThreadPerTaskExecutor(
                Thread.ofVirtual()
                        .name("enrichment-", 0)
                        .factory()
        );
    }
}
