package com.pranit.docmind.rag.application.enricher;

import com.pranit.docmind.shared.properties.EnrichmentProperties;
import lombok.Builder;

import java.util.concurrent.TimeUnit;

/**
 * Optional per-request overrides sent by the client.
 * Every field is nullable: null = "use the server default".
 * Out-of-range values are clamped (never rejected, never able to exceed global limits).
 */
@Builder
public record EnrichmentOptions(
        Boolean enabled,
        Integer maxConcurrency,
        Integer chunksPerRequest,
        Integer maxAttempts,
        Integer maxContentChars,
        Boolean skipIfMeaningful,
        Integer callTimeoutSeconds,
        Integer totalTimeoutSeconds) {

    /**
     * All nulls -> everything comes from EnrichmentProperties.
     */
    public static EnrichmentOptions defaults() {
        return new EnrichmentOptions(null, null, null, null, null, null, null, null);
    }

    private static int clamp(Integer requested, int fallback, int min, int max) {
        int value = requested != null ? requested : fallback;
        return Math.clamp(value, min, max);
    }

    public Settings resolve(EnrichmentProperties d) {
        int globalCap = Math.max(1, d.maxConcurrency());
        return Settings.builder()
                .enabled(enabled != null ? enabled : d.enabled())
                .maxConcurrency(clamp(maxConcurrency, d.maxConcurrency(), 1, globalCap))
                .chunksPerRequest(clamp(chunksPerRequest, d.chunksPerRequest(), 1, 20))
                .maxAttempts(clamp(maxAttempts, d.maxAttempts(), 1, 5))
                .maxContentChars(clamp(maxContentChars, d.maxContentChars(), 100, 4_000))
                .skipIfMeaningful(skipIfMeaningful != null
                        ? skipIfMeaningful : d.skipIfMeaningful())
                .callTimeoutNanos(TimeUnit.SECONDS.toNanos
                        (clamp(callTimeoutSeconds, d.callTimeoutSeconds(), 1, 300)))
                .totalTimeoutNanos(TimeUnit.SECONDS.toNanos
                        (clamp(totalTimeoutSeconds, d.totalTimeoutSeconds(), 10, 3_600)))
                .build();
    }

    /**
     * Fully resolved, non-null, clamped settings used by the enricher.
     */
    @Builder
    public record Settings(
            boolean enabled,
            int maxConcurrency,
            int chunksPerRequest,
            int maxAttempts,
            int maxContentChars,
            boolean skipIfMeaningful,
            long callTimeoutNanos,
            long totalTimeoutNanos) {
    }
}

