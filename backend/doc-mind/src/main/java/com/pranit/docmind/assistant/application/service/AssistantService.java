package com.pranit.docmind.assistant.application.service;

import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface AssistantService {

    QueryResponse getResponse(Provider provider, String query, UUID conversationId, UUID documentId, QueryRequest.Options options);

    Flux<QueryResponse> getStreamResponse(Provider provider, String query, UUID conversationId, UUID documentId, QueryRequest.Options options);
}
