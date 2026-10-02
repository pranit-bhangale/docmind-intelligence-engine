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
import org.springframework.stereotype.Component;

@NullMarked
@Component
@RequiredArgsConstructor
public final class DocumentRetrievalOrchestrator implements RetrievalOrchestrator {

    private final QueryRewritingTransformer rewriter;
    private final DocumentRetriever retriever;
    private final QueryAugmenter augmenter;

    @Override
    public Context execute(final Metadata metadata, final String query, final QueryRequest.Options options) {
        final var rewrittenQuery = rewriter.rewriteQuery(query);
        final var documents = switch (options.queryType()) {
            case DOCUMENT_SUMMARY, TECHNICAL_INSIGHTS -> retriever.searchDocumentChunks
                    (metadata, rewrittenQuery);
            case NORMAL_QA -> retriever.similaritySearch
                    (metadata, rewrittenQuery, options.retrieval());
        };
        final var citations = retriever.toCitations(documents);
        final var context = augmenter.augment(rewrittenQuery, documents);
        return Context.builder()
                .originalQuery(query)
                .rewrittenQuery(rewrittenQuery)
                .context(context)
                .documents(documents)
                .citations(citations)
                .build();
    }
}
