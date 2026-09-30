package com.pranit.docmind.document.application.service;

import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public interface DocumentService {
    ApiResponse<DocumentResponse> fetchDocumentById(UUID documentId);

    ApiResponse<Void> deleteDocumentById(UUID documentId);

    PageResponse<DocumentResponse> findAllDocuments(@Min(0) int page, @Min(1) @Max(5) int size, String keyword, String sortBy, String sortDirection);
}
