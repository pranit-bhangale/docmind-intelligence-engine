package com.pranit.docmind.auth.seed.properties;


import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "docmind.default.credential")
public record AdminSeedProperties(
        String username,
        String password
) {
}
