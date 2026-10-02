package com.pranit.docmind.document.api;

import com.pranit.docmind.shared.domain.Metadata;

import java.util.UUID;

public interface DocumentValidationService {

    Metadata getDocumentMetadata(UUID documentId);
}
