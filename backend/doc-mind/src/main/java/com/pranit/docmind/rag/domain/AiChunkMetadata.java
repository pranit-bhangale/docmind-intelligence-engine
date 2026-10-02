package com.pranit.docmind.rag.domain;

import lombok.Builder;

@Builder
public record AiChunkMetadata(
        String chunkId,
        String section,
        String header
) {
}
