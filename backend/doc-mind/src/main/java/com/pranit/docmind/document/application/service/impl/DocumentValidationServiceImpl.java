package com.pranit.docmind.document.application.service.impl;

import com.pranit.docmind.document.api.DocumentValidationService;
import com.pranit.docmind.document.domain.entity.DocumentMetadata;
import com.pranit.docmind.document.domain.repository.DocumentRepository;
import com.pranit.docmind.document.exception.DocumentNotFoundException;
import com.pranit.docmind.shared.domain.Metadata;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentValidationServiceImpl implements DocumentValidationService {

    private final DocumentRepository documentRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public Metadata getDocumentMetadata(final UUID documentId) {
        final DocumentMetadata metadata = documentRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new DocumentNotFoundException("Document not found"));
        return Metadata.builder()
                .documentId(metadata.getDocumentId())
                .fileName(metadata.getFileName())
                .chunkCreated(metadata.getChunksCreated())
                .build();
    }
}
