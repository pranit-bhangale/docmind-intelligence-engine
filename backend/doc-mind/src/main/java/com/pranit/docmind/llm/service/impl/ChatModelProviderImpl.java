package com.pranit.docmind.llm.service.impl;

import com.openai.errors.OpenAIIoException;
import com.openai.errors.SseException;
import com.pranit.docmind.llm.api.ChatModelProvider;
import com.pranit.docmind.llm.exception.AiServiceUnavailableException;
import com.pranit.docmind.llm.service.ChatModelProviderFactory;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.util.retry.Retry;

import java.io.InterruptedIOException;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatModelProviderImpl implements ChatModelProvider {

    private final ChatModelProviderFactory factory;

    @Override
    public QueryResponse getResponse
            (final Provider provider, final String query,
             final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        return factory.getStrategy(provider).getResponse(query, conversationId, metadata, options);
    }

    @Override
    public Flux<String> getStreamResponse
            (final Provider provider, final String query,
             final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        return Flux.defer(() -> factory
                        .getStrategy(provider)
                        .getStreamResponse(query, conversationId, metadata, options))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(2))
                        .maxBackoff(Duration.ofSeconds(10))
                        .jitter(0.5)
                        .filter(this::isRetryable)
                        .doBeforeRetry(retrySignal ->
                                log.warn("AI stream failed. Retrying request. attempt: {}, cause: {}", retrySignal.totalRetries() + 1, retrySignal.failure().toString()))
                        .onRetryExhaustedThrow((_, _) ->
                                new AiServiceUnavailableException("AI service is temporarily unavailable. Please try again.")));
    }

    private boolean isRetryable(final Throwable throwable) {
        Throwable cause = throwable;
        while (cause != null) {
            switch (cause) {
                case SseException ignored -> {
                    return true;
                }
                case OpenAIIoException ignored -> {
                    return true;
                }
                case InterruptedIOException ignored -> {
                    return true;
                }
                default -> cause = cause.getCause();
            }
        }
        return false;
    }
}
