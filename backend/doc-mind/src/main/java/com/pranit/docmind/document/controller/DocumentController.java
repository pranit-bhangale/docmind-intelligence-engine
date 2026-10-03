package com.pranit.docmind.document.controller;

import com.drew.lang.annotations.NotNull;
import com.pranit.docmind.document.application.service.DocumentService;
import com.pranit.docmind.document.application.service.DocumentUploadService;
import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Document Intelligence",
        description = "Endpoints for uploading, parsing, embedding, retrieving, and managing multi-format enterprise documents and vector storage."
)
public class DocumentController {

    private final DocumentUploadService documentUploadService;
    private final DocumentService documentService;

    @Operation(summary = "Upload a document", description = "Uploads a document and processes it for vector embedding.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(@Valid @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentUploadService.uploadDocument(file));
    }

    @Operation(summary = "Get document by ID", description = "Retrieves a document and its metadata using its unique ID.")
    @GetMapping(value = "/{documentId}", version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> fetchDocumentById(@NotNull @PathVariable("documentId") UUID documentId) {
        return ResponseEntity.status(HttpStatus.OK).body(documentService.fetchDocumentById(documentId));
    }

    @Operation(summary = "Delete a document", description = "Deletes a document and its associated vector embeddings using its unique ID.")
    @DeleteMapping(value = "/{documentId}/delete", version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deleteDocumentById(@NotNull @PathVariable("documentId") UUID documentId) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(documentService.deleteDocumentById(documentId));
    }

    @Operation(
            summary = "List all documents",
            description = "Returns a paginated list of document with status filtering, sorting, and keyword search controls."
    )
    @GetMapping(version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PageResponse<DocumentResponse>> findAllDocuments(
            @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(name = "size", defaultValue = "5") @Min(1) @Max(5) int size,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "sortBy", defaultValue = "fileName") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok(this.documentService.findAllDocuments(page, size, keyword, sortBy, sortDirection));
    }
}
