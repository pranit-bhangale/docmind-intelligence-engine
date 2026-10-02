package com.pranit.docmind.document.domain.dto;

import com.pranit.docmind.document.domain.entity.FileStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record DocumentResponse(
        UUID documentId,
        String fileName,
        long fileSize,
        FileStatus status,
        long chunksCreated,
        Instant createdAt
) {
}
