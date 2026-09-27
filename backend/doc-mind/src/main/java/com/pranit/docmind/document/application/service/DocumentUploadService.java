package com.pranit.docmind.document.application.service;

import com.pranit.docmind.document.domain.dto.DocumentResponse;
import com.pranit.docmind.shared.wrapper.ApiResponse;
import org.springframework.web.multipart.MultipartFile;

@FunctionalInterface
public interface DocumentUploadService {

    ApiResponse<DocumentResponse> uploadDocument(MultipartFile file);
}
