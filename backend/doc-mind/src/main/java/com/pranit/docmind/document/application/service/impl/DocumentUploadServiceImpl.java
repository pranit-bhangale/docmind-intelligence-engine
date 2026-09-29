package com.pranit.docmind.document.application.service.impl;

import com.pranit.docmind.auth.api.UserValidationService;
import com.pranit.docmind.document.application.service.DocumentStatusService;
import com.pranit.docmind.document.application.service.DocumentUploadService;
import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.document.domain.entity.DocumentMetadata;
import com.pranit.docmind.document.domain.entity.FileStatus;
import com.pranit.docmind.document.domain.repository.DocumentRepository;
import com.pranit.docmind.document.exception.DocumentAlreadyExistsException;
import com.pranit.docmind.document.exception.DocumentProcessingException;
import com.pranit.docmind.rag.api.IngestionOrchestrator;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.exception.InvalidRequestException;
import com.pranit.docmind.shared.helper.SecurityContext;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentUploadServiceImpl implements DocumentUploadService {

    private final DocumentRepository documentRepository;
    private final IngestionOrchestrator orchestrator;
    private final UserValidationService userValidationService;
    private final DocumentStatusService documentStatusService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public ApiResponse<DocumentResponse> uploadDocument(final MultipartFile file) {
        final UUID userId = SecurityContext.getCurrentUserId();
        if (!this.userValidationService.checkUserExists(userId)) {
            throw new InvalidRequestException("User not exists");
        }
        final String fileName = file.getOriginalFilename();
        if (documentRepository.existsByUserIdAndFileName(userId, fileName)) {
            throw new DocumentAlreadyExistsException("File already exists");
        }
        DocumentMetadata docMetadata = DocumentMetadata.builder()
                .userId(userId)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .fileStatus(FileStatus.UPLOADING)
                .chunksCreated(0)
                .build();
        docMetadata = documentRepository.save(docMetadata);
        final Metadata metadata = Metadata.builder()
                .documentId(docMetadata.getDocumentId())
                .fileName(docMetadata.getFileName())
                .build();
        final Resource resource = file.getResource();
        final long chunkSize = orchestrator.process(metadata, resource);
        if (chunkSize <= 0) {
            documentStatusService.markFailed(docMetadata.getDocumentId());
            throw new DocumentProcessingException("No chunks were created");
        }
        docMetadata.setChunksCreated(chunkSize);
        docMetadata.setFileStatus(FileStatus.INDEXED);
        final DocumentResponse response = DocumentResponse.builder()
                .documentId(docMetadata.getDocumentId())
                .fileName(docMetadata.getFileName())
                .fileSize(docMetadata.getFileSize())
                .status(docMetadata.getFileStatus())
                .chunksCreated(docMetadata.getChunksCreated())
                .createdAt(docMetadata.getCreatedAt())
                .build();
        return ApiResponse.<DocumentResponse>builder()
                .status(true)
                .message("Document uploaded and indexed successfully")
                .data(response)
                .timestamp(Instant.now())
                .build();
    }
}
