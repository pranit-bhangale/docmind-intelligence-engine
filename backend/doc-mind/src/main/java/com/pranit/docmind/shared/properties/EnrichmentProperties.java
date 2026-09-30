package com.pranit.docmind.shared.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Server-side defaults and hard limits (application.yml, prefix "docmind.enrich").
 * <p>
 * Clients may override the per-request values through {@link EnrichmentOptions},
 * but can never exceed the hard limits defined here (e.g. maxConcurrency).
 * <p>
 * Requires @EnableConfigurationProperties(EnrichmentProperties.class)
 * or @ConfigurationPropertiesScan on your application class.
 */
@ConfigurationProperties(prefix = "docmind.enrich")
public record EnrichmentProperties(
        @DefaultValue("true") boolean enabled,
        @DefaultValue("5") int chunksPerRequest,
        @DefaultValue("3") int maxAttempts,
        @DefaultValue("800") int maxContentChars,
        @DefaultValue("true") boolean skipIfMeaningful,
        @DefaultValue("30") int callTimeoutSeconds,
        @DefaultValue("600") int totalTimeoutSeconds,

        @DefaultValue("8") int maxConcurrency,
        @DefaultValue("10") double requestsPerSecond,
        @DefaultValue("500") long initialBackoffMs,
        @DefaultValue("10000") long maxBackoffMs,
        @DefaultValue("5") int breakerFailureThreshold,
        @DefaultValue("30") int breakerOpenSeconds
) {
}