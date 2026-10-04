package com.pranit.docmind.llm.api;

import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ChatModelProvider {

    QueryResponse getResponse
            (Provider provider, String query, UUID conversationId, Metadata metadata, QueryRequest.Options options);

    Flux<QueryResponse> getStreamResponse
            (Provider provider, String query, UUID conversationId, Metadata metadata, QueryRequest.Options options);
}
