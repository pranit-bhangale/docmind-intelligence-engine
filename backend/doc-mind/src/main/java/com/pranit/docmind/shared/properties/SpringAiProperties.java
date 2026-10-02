package com.pranit.docmind.shared.properties;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "spring.ai.openai")
public record SpringAiProperties(
        ChatProperties chat,
        @Valid
        Rewrite rewrite,
        @Valid
        Enrich enrich
) {

    public record ChatProperties(
            Double temperature,
            Integer maxCompletionTokens
    ) {
    }

    public record Rewrite(
            String apiKey,
            String baseUrl,
            @Valid Chat chat
    ) {
    }

    public record Enrich(
            String apiKey,
            String baseUrl,
            @Valid Chat chat
    ) {
    }

    public record Chat(
            String model,
            @DecimalMin("0.0")
            @DecimalMax("1.0")
            double temperature,
            @Min(1) int maxTokens
    ) {
    }
}
