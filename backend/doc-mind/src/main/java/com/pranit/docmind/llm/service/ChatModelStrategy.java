package com.pranit.docmind.llm.service;

import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ChatModelStrategy {

    QueryResponse getResponse(String query, UUID conversationId, Metadata metadata, QueryRequest.Options options);

    Flux<String> getStreamResponse(String query, UUID conversationId, Metadata metadata, QueryRequest.Options options);

    Provider getProviderName();
}
