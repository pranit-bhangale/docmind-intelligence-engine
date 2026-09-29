package com.pranit.docmind.shared.domain;

import lombok.Builder;

import java.util.List;

@Builder
public record QueryResponse(
        String content,
        String responseTime,
        List<Context.Citation> citations
) {
}
