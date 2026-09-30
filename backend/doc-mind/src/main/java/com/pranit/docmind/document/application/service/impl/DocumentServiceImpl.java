package com.pranit.docmind.document.application.service.impl;

import com.pranit.docmind.auth.api.SecurityContext;
import com.pranit.docmind.document.application.service.DocumentService;
import com.pranit.docmind.document.application.specification.DocumentSpecification;
import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.document.domain.entity.DocumentMetadata;
import com.pranit.docmind.document.domain.repository.DocumentRepository;
import com.pranit.docmind.document.exception.DocumentNotFoundException;
import com.pranit.docmind.rag.api.DeleteChunksService;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DeleteChunksService deleteChunksService;

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public ApiResponse<DocumentResponse> fetchDocumentById(final UUID documentId) {
        final DocumentMetadata metadata = validateAndFetchDocumentById(documentId);
        return ApiResponse.<DocumentResponse>builder()
                .status(true)
                .message("Document fetched successfully")
                .data(DocumentResponse.builder()
                        .documentId(metadata.getDocumentId())
                        .fileName(metadata.getFileName())
                        .fileSize(metadata.getFileSize())
                        .status(metadata.getFileStatus())
                        .chunksCreated(metadata.getChunksCreated())
                        .createdAt(metadata.getCreatedAt())
                        .build())
                .timestamp(Instant.now())
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public ApiResponse<Void> deleteDocumentById(final UUID documentId) {
        final DocumentMetadata metadata = validateAndFetchDocumentById(documentId);
        documentRepository.delete(metadata);
        deleteChunksService.deleteParticularDocumentChunks(documentId);
        return ApiResponse.<Void>builder()
                .status(true)
                .message("Document deleted successfully.")
                .timestamp(Instant.now())
                .build();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED, readOnly = true)
    public PageResponse<DocumentResponse> findAllDocuments(
            final int page, final int size, final String keyword,
            final String sortBy, final String sortDirection) {
        final UUID userId = SecurityContext.getCurrentUserId();
        final Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        final Sort sort = Sort.by(direction, sortBy);
        final Pageable pageable = PageRequest.of(page, size, sort);
        final Specification<DocumentMetadata> specification = Specification
                .where(DocumentSpecification.belongsToUser(userId))
                .and(DocumentSpecification.searchKeyword(keyword));
        final Page<DocumentMetadata> pages = this.documentRepository.findAll(specification, pageable);
        final List<DocumentResponse> content = pages.getContent()
                .stream()
                .map(this::toResponse)
                .toList();
        return PageResponse.<DocumentResponse>builder()
                .contents(content)
                .currentPage(pages.getNumber())
                .pageSize(pages.getSize())
                .totalElements(pages.getTotalElements())
                .totalPages(pages.getTotalPages())
                .isLastPage(pages.isLast())
                .isFirstPage(pages.isFirst())
                .build();
    }

    private DocumentMetadata validateAndFetchDocumentById(final UUID documentId) {
        final UUID userId = SecurityContext.getCurrentUserId();
        return documentRepository.findByDocumentIdAndUser_UserId(documentId, userId)
                .orElseThrow(() -> {
                    log.warn("Document with id {} not found for user {}", documentId, userId);
                    return new DocumentNotFoundException("Document not found");
                });
    }

    private DocumentResponse toResponse(final DocumentMetadata metadata) {
        return DocumentResponse.builder()
                .documentId(metadata.getDocumentId())
                .fileName(metadata.getFileName())
                .fileSize(metadata.getFileSize())
                .status(metadata.getFileStatus())
                .chunksCreated(metadata.getChunksCreated())
                .build();
    }
}
