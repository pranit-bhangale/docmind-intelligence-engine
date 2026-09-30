package com.pranit.docmind.document.application.service.impl;

import com.pranit.docmind.document.application.service.DocumentStatusService;
import com.pranit.docmind.document.domain.entity.FileStatus;
import com.pranit.docmind.document.domain.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentStatusServiceImpl implements DocumentStatusService {

    private final DocumentRepository documentRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markProcessing(final UUID documentId) {
        documentRepository.updateFileStatus(documentId, FileStatus.PROCESSING);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(final UUID documentId) {
        documentRepository.updateFileStatus(documentId, FileStatus.FAILED);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void rollbackDocMetadata(final UUID documentId) {
        documentRepository.rollbackDocumentMetadata(documentId);
    }
}
