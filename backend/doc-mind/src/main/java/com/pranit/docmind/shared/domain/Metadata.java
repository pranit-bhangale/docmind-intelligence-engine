package com.pranit.docmind.shared.domain;

import lombok.Builder;

import java.util.UUID;

@Builder
public record Metadata(
        UUID documentId,
        String fileName
) {
}
