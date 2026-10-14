package com.pranit.docmind.notification.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "docmind.owner")
public record OwnerProperties(
        String email
) {
}
