package com.pranit.docmind.notification.mail.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class EmailAsyncConfig {

    @Bean(name = "emailExecutor")
    public Executor otpExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}