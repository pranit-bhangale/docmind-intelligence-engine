package com.pranit.docmind.document.application.service;

import java.util.UUID;

public interface DocumentStatusService {

    void markProcessing(UUID documentId);

    void markFailed(UUID documentId);
    
    void rollbackDocMetadata(UUID documentId);
}
