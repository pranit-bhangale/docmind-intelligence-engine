package com.pranit.docmind.rag.api;

import java.util.UUID;

@FunctionalInterface
public interface DeleteChunksService {

    void deleteParticularDocumentChunks(UUID documentId);
}
