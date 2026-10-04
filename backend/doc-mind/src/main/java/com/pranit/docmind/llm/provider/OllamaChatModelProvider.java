package com.pranit.docmind.llm.provider;

import com.pranit.docmind.llm.executor.ChatModelExecutor;
import com.pranit.docmind.llm.service.ChatModelStrategy;
import com.pranit.docmind.rag.api.RetrievalOrchestrator;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Optional;
import java.util.UUID;

@Service
public class OllamaChatModelProvider implements ChatModelStrategy {

    private final RetrievalOrchestrator orchestrator;
    private final ChatModelExecutor executor;

    public OllamaChatModelProvider(RetrievalOrchestrator orchestrator, ChatModelExecutor executor) {
        this.orchestrator = orchestrator;
        this.executor = executor;
    }

    @Override
    public QueryResponse getResponse(final String query, final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        final long startTime = System.currentTimeMillis();
        final var context = orchestrator.execute(metadata, query, options);
        final var chatResponse = executor.execute(context.context(), conversationId);
        final String response = Optional.ofNullable(chatResponse)
                .map(ChatResponse::getResult)
                .map(Generation::getOutput)
                .map(AssistantMessage::getText)
                .orElseThrow(() -> new IllegalStateException("LLM returned an empty response"));
        final long duration = System.currentTimeMillis() - startTime;

        return QueryResponse.builder()
                .content(response)
                .responseTime(formatDuration(duration))
                .citations(context.citations())
                .build();
    }

    @Override
    public Flux<QueryResponse> getStreamResponse(final String query, final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        final long startTime = System.currentTimeMillis();
        final var context = orchestrator.execute(metadata, query, options);
        final var citations = context.citations();

        return executor.stream(context.context(), conversationId)
                .map(chunk -> QueryResponse.builder()
                        .content(chunk)
                        .build())
                .concatWith(Flux.defer(() -> {
                    final long duration = System.currentTimeMillis() - startTime;
                    return Flux.just(QueryResponse.builder()
                            .content("")
                            .responseTime(formatDuration(duration))
                            .citations(citations)
                            .build());
                }));
    }

    @Override
    public Provider getProviderName() {
        return Provider.OLLAMA;
    }

    private String formatDuration(final long durationMs) {
        if (durationMs < 1_000) return durationMs + "ms";
        if (durationMs < 60_000) return String.format("%.1fs", durationMs / 1_000.0);
        final long minutes = durationMs / 60_000;
        final double seconds = (durationMs % 60_000) / 1_000.0;
        return String.format("%dm %.1fs", minutes, seconds);
    }
}
