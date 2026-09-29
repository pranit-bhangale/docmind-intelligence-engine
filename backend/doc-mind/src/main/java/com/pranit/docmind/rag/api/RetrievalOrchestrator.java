package com.pranit.docmind.rag.api;

import com.pranit.docmind.shared.domain.Context;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.QueryRequest;

@FunctionalInterface
public interface RetrievalOrchestrator {

    Context execute(Metadata metadata, String query, QueryRequest.Options options);
}
