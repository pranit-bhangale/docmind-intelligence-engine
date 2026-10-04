package com.pranit.docmind.rag.module;

import com.pranit.docmind.rag.domain.DocMetadata;
import com.pranit.docmind.shared.domain.Context;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.properties.RagProperties;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class DocumentRetriever {

    private final VectorStore vectorStore;
    private final RagProperties properties;

    public DocumentRetriever(VectorStore vectorStore, RagProperties properties) {
        this.vectorStore = vectorStore;
        this.properties = properties;
    }

    public List<Document> similaritySearch(final Metadata metadata, final String query, final QueryRequest.RetrievalOptions options) {
        final var retrieval = properties.retrieval();
        final var topK = Optional.ofNullable(options.topK())
                .orElse(retrieval.topK());
        final var similarityThreshold = Optional.ofNullable(options.similarityThreshold())
                .orElse(retrieval.similarityThreshold());
        final var filterBuilder = new FilterExpressionBuilder();
        final var filterExpression = filterBuilder.and(
                filterBuilder.eq(DocMetadata.DOCUMENT_ID, metadata.documentId().toString()),
                filterBuilder.eq(DocMetadata.FILE_NAME, metadata.fileName()));
        final var builder = SearchRequest.builder()
                .query(query)
                .topK(topK)
                .filterExpression(filterExpression.build())
                .similarityThreshold(similarityThreshold);
        return vectorStore.similaritySearch(builder.build());
    }

    public List<Document> searchDocumentChunks(final Metadata metadata, final String query) {
        final var retrieval = properties.retrieval();
        final var similarityThreshold = retrieval.similarityThreshold();
        final var filterBuilder = new FilterExpressionBuilder();
        final var filterExpression = filterBuilder.and(
                filterBuilder.eq(DocMetadata.DOCUMENT_ID, metadata.documentId().toString()),
                filterBuilder.eq(DocMetadata.FILE_NAME, metadata.fileName()));
        final var builder = SearchRequest.builder()
                .query(query)
                .topK((int) metadata.chunkCreated())
                .filterExpression(filterExpression.build())
                .similarityThreshold(similarityThreshold);
        return vectorStore.similaritySearch(builder.build());
    }

    public List<Context.Citation> toCitations(final List<Document> documents) {
        return documents.stream()
                .map(this::citationMapper)
                .toList();
    }

    private Context.Citation citationMapper(final Document document) {
        final var metadata = document.getMetadata();
        return Context.Citation.builder()
                .documentId(UUID.fromString((String) metadata.get(DocMetadata.DOCUMENT_ID)))
                .fileName((String) metadata.get(DocMetadata.FILE_NAME))
                .content(document.getText())
                .pageNumber((Long) metadata.get(DocMetadata.PAGE_NUMBER))
                .chunkIndex((Long) metadata.get(DocMetadata.CHUNK_INDEX))
                .previousChunkIndex((Long) metadata.get(DocMetadata.PREVIOUS_CHUNK_INDEX))
                .nextChunkIndex((Long) metadata.get(DocMetadata.NEXT_CHUNK_INDEX))
                .similarityScore(document.getScore())
                .build();
    }
}
