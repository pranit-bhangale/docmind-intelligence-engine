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
public class NvidiaChatModelProvider implements ChatModelStrategy {

    private final RetrievalOrchestrator orchestrator;
    private final ChatModelExecutor executor;

    public NvidiaChatModelProvider(RetrievalOrchestrator orchestrator, ChatModelExecutor executor) {
        this.orchestrator = orchestrator;
        this.executor = executor;
    }

    @Override
    public QueryResponse getResponse(final String query, final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        final var context = orchestrator.execute(metadata, query, options);
        final var chatResponse = executor.execute(context.context(), conversationId);
        final String response = Optional.ofNullable(chatResponse)
                .map(ChatResponse::getResult)
                .map(Generation::getOutput)
                .map(AssistantMessage::getText)
                .orElseThrow(() -> new IllegalStateException("LLM returned an empty response"));
        return QueryResponse.builder()
                .content(response)
                .citations(context.citations())
                .build();
    }

    @Override
    public Flux<String> getStreamResponse(final String query, final UUID conversationId, final Metadata metadata, final QueryRequest.Options options) {
        final var context = orchestrator.execute(metadata, query, options);
        return executor.stream(context.context(), conversationId);
    }

    @Override
    public Provider getProviderName() {
        return Provider.NVIDIA;
    }
}
