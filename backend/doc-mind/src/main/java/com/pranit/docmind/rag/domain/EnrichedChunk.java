package com.pranit.docmind.rag.domain;

import lombok.Builder;

@Builder
public record EnrichedChunk(
        String section,
        String header,
        String content
) {
}
