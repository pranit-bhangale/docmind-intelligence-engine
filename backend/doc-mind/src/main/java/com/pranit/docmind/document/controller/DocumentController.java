package com.pranit.docmind.document.controller;

import com.pranit.docmind.document.application.service.DocumentService;
import com.pranit.docmind.document.application.service.DocumentUploadService;
import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import com.pranit.docmind.shared.wrapper.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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

    @Operation(
            summary = "Upload a document",
            description = "Uploads a document and processes it for vector embedding."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Document uploaded and processed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload or unsupported file format"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - requires USER authority")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @Parameter(description = "Multipart document file to upload and embed", required = true)
            @Valid @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentUploadService.uploadDocument(file));
    }

    @Operation(
            summary = "Get document by ID",
            description = "Retrieves a document and its metadata using its unique ID."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Document details retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Document not found")
    })
    @GetMapping(value = "/{documentId}", version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> fetchDocumentById(
            @Parameter(name = "documentId", description = "Unique UUID of the target document", required = true)
            @NotNull @PathVariable("documentId") UUID documentId) {
        return ResponseEntity.status(HttpStatus.OK).body(documentService.fetchDocumentById(documentId));
    }

    @Operation(
            summary = "Delete a document",
            description = "Deletes a document and its associated vector embeddings using its unique ID."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Document and associated vector embeddings deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Document not found")
    })
    @DeleteMapping(value = "/{documentId}/delete", version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deleteDocumentById(
            @Parameter(name = "documentId", description = "Unique UUID of the document to delete", required = true)
            @NotNull @PathVariable("documentId") UUID documentId) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(documentService.deleteDocumentById(documentId));
    }

    @Operation(
            summary = "List all documents",
            description = "Returns a paginated list of document with status filtering, sorting, and keyword search controls."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated list of documents retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized access")
    })
    @GetMapping(version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PageResponse<DocumentResponse>> findAllDocuments(
            @Parameter(description = "Zero-based page index") @RequestParam(name = "page", defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Number of document items per page") @RequestParam(name = "size", defaultValue = "5") @Min(1) @Max(5) int size,
            @Parameter(description = "Optional keyword to filter documents by file name") @RequestParam(name = "keyword", required = false) String keyword,
            @Parameter(description = "Property field to sort by") @RequestParam(name = "sortBy", defaultValue = "fileName") String sortBy,
            @Parameter(description = "Sort direction: ASC or DESC") @RequestParam(name = "sortDirection", defaultValue = "ASC") String sortDirection
    ) {
        return ResponseEntity.ok(this.documentService.findAllDocuments(page, size, keyword, sortBy, sortDirection));
    }
}
