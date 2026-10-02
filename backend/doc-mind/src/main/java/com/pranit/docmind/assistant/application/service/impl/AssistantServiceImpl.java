package com.pranit.docmind.assistant.application.service.impl;

import com.pranit.docmind.assistant.application.service.AssistantService;
import com.pranit.docmind.document.api.DocumentValidationService;
import com.pranit.docmind.llm.api.ChatModelProvider;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.Provider;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements AssistantService {

    private final ChatModelProvider chatModelProvider;
    private final DocumentValidationService documentValidationService;

    @Override
    public QueryResponse getResponse
            (final Provider provider, final String query, final UUID conversationId,
             final UUID documentId, final QueryRequest.Options options) {
        final Metadata metadata = documentValidationService.getDocumentMetadata(documentId);
        return chatModelProvider.getResponse(provider, query, conversationId, metadata, options);
    }

    @Override
    public Flux<String> getStreamResponse
            (final Provider provider, final String query, final UUID conversationId,
             final UUID documentId, final QueryRequest.Options options) {
        final Metadata metadata = documentValidationService.getDocumentMetadata(documentId);
        return chatModelProvider.getStreamResponse(provider, query, conversationId, metadata, options);
    }
}
