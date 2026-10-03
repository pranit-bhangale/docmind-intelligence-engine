package com.pranit.docmind.rag.application.orchestrator;

import com.pranit.docmind.rag.api.RetrievalOrchestrator;
import com.pranit.docmind.rag.module.DocumentRetriever;
import com.pranit.docmind.rag.module.QueryAugmenter;
import com.pranit.docmind.rag.module.QueryRewritingTransformer;
import com.pranit.docmind.shared.domain.Context;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.QueryRequest;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NullMarked;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@NullMarked
@Component
@RequiredArgsConstructor
public final class DocumentRetrievalOrchestrator implements RetrievalOrchestrator {

    private final QueryRewritingTransformer rewriter;
    private final DocumentRetriever retriever;
    private final QueryAugmenter augmenter;

    @Override
    public Context execute(final Metadata metadata, final String query, final QueryRequest.Options options) {
        final boolean isRagEnabled = options.isRagEnabled();
        final boolean isRewritingEnabled = options.isQueryRewritingEnabled();
        final QueryRequest.QueryType mode = options.queryType() != null
                ? options.queryType() : QueryRequest.QueryType.NORMAL_QA;
        final String effectiveQuery = (isRagEnabled && isRewritingEnabled)
                ? rewriter.rewriteQuery(query) : query;
        final List<Document> documents;
        if (!isRagEnabled) {
            documents = Collections.emptyList();
        } else if (mode == QueryRequest.QueryType.DOCUMENT_SUMMARY
                || mode == QueryRequest.QueryType.TECHNICAL_INSIGHTS) {
            documents = retriever.searchDocumentChunks(metadata, effectiveQuery);
        } else {
            documents = retriever.similaritySearch(metadata, effectiveQuery, options.retrieval());
        }

        final var citations = retriever.toCitations(documents);
        final var context = augmenter.augment(effectiveQuery, documents, mode);

        return Context.builder()
                .originalQuery(query)
                .rewrittenQuery(effectiveQuery)
                .context(context)
                .documents(documents)
                .citations(citations)
                .build();
    }
}
