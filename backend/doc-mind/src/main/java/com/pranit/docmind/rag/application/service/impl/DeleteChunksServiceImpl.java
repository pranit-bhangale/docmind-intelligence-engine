package com.pranit.docmind.rag.application.service.impl;

import com.pranit.docmind.rag.api.DeleteChunksService;
import com.pranit.docmind.rag.domain.DocMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteChunksServiceImpl implements DeleteChunksService {

    private final VectorStore vectorStore;

    @Override
    public void deleteParticularDocumentChunks(final UUID documentId) {
        this.vectorStore.delete(new FilterExpressionBuilder()
                .eq(DocMetadata.DOCUMENT_ID, documentId.toString())
                .build());
    }
}
