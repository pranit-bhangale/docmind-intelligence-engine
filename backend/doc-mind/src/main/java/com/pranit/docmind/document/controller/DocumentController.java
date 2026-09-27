package com.pranit.docmind.document.controller;

import com.pranit.docmind.document.application.service.DocumentUploadService;
import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @Operation(summary = "Upload a document", description = "Uploads a document and processes it for vector embedding.")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, version = "v1")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(@Valid @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentUploadService.uploadDocument(file));
    }
}
