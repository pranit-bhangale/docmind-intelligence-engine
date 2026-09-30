package com.pranit.docmind.rag.application.orchestrator;

import com.pranit.docmind.rag.application.enricher.DocumentEnricher;
import com.pranit.docmind.rag.application.service.TokenTextSplitter;
import com.pranit.docmind.rag.domain.DocMetadata;
import com.pranit.docmind.rag.domain.DocumentChunk;
import com.pranit.docmind.rag.domain.DocumentType;
import com.pranit.docmind.rag.domain.EnrichedChunk;
import com.pranit.docmind.rag.exception.UnsupportedFileFormatException;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.properties.RagProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public final class DocumentEtlOrchestrator {

    private static final int STORE_BATCH_SIZE = 20;
    private final RagProperties properties;
    private final DocumentEnricher documentEnricher;
    private final VectorStore vectorStore;

    private static String asString(final Object value) {
        return value == null ? null : value.toString();
    }

    public long process
            (final Metadata metadata, final Resource resource, final DocumentType type) {
        final var documents = extract(resource, type);
        final var chunks = chunk(documents);
        final var aiEnriched = enrichWithAi(chunks);
        final var enrichedChunks = documentEnricher.enrich(metadata, aiEnriched);
        if (store(metadata, enrichedChunks)) {
            return enrichedChunks.size();
        } else {
            return -1;
        }
    }

    private List<Document> extract
            (final Resource resource, final DocumentType type) {
        if (type == DocumentType.PDF) return extractPdf(resource);
        if (type == DocumentType.TIKA) return extractWithTika(resource);
        throw new UnsupportedFileFormatException("Unsupported document type: " + type);
    }

    private List<Document> chunk(final List<Document> documents) {
        final var config = properties.chunking();
        final var splitter = TokenTextSplitter.builder()
                .withChunkSize(config.chunkSize())
                .withChunkOverlap(config.chunkOverlap())
                .withMinChunkSizeChars(config.minChunkSizeChars())
                .withMinChunkLengthToEmbed(config.minChunkLengthToEmbed())
                .withMaxNumChunks(config.maxNumChunks())
                .withKeepSeparator(config.keepSeparator())
                .withNormalizeWhitespace(config.normalizeWhitespace())
                .withRespectHeadings(config.respectHeadings())
                .withHeadingContext(config.headingContext())
                .withSectionBreakRatio(config.sectionBreakRatio())
                .build();
        return splitter.transform(documents);
    }

    private List<Document> extractPdf(final Resource resource) {
        final var pdfReader = new PagePdfDocumentReader
                (resource, PdfDocumentReaderConfig.builder()
                        .withPageTopMargin(0)
                        .withPageExtractedTextFormatter
                                (ExtractedTextFormatter.builder()
                                        .withNumberOfTopTextLinesToDelete(0)
                                        .build())
                        .withPagesPerDocument(1)
                        .build());
        return pdfReader.read();
    }

    private List<Document> extractWithTika(final Resource resource) {
        final var tikaReader = new TikaDocumentReader(resource);
        return tikaReader.read();
    }

    private List<Document> enrichWithAi(final List<Document> chunks) {
        final List<DocumentChunk> input = chunks.stream().map(this::toDocumentChunk).toList();
        final List<EnrichedChunk> output = documentEnricher.enrich(input);
        if (output.size() != chunks.size()) {
            throw new IllegalStateException
                    ("Enricher returned " + output.size() + " chunks for " + chunks.size() + " inputs");
        }
        final List<Document> result = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            final Document original = chunks.get(i);
            final EnrichedChunk enriched = output.get(i);
            final Map<String, Object> metadata = new LinkedHashMap<>(original.getMetadata());
            if (enriched.section() != null) metadata.put(DocMetadata.SECTION, enriched.section());
            if (enriched.header() != null) metadata.put(DocMetadata.HEADER, enriched.header());
            result.add(new Document(original.getText(), metadata));
        }
        return result;
    }

    private DocumentChunk toDocumentChunk(final Document document) {
        return DocumentChunk.builder()
                .section(asString(document.getMetadata().get(DocMetadata.SECTION)))
                .header(asString(document.getMetadata().get(DocMetadata.HEADER)))
                .content(document.getText())
                .build();
    }

    private boolean store(final Metadata metadata, final List<Document> chunks) {
        try {
            for (int start = 0; start < chunks.size(); start += STORE_BATCH_SIZE) {
                final int end = Math.min(start + STORE_BATCH_SIZE, chunks.size());
                vectorStore.add(chunks.subList(start, end));
            }
            return true;
        } catch (RuntimeException e) {
            log.error("Vector store failed for documentId: {}. Removing partially stored chunks.",
                    metadata.documentId(), e);
            deleteByDocumentId(metadata);
            return false;
        }
    }

    private void deleteByDocumentId(final Metadata metadata) {
        try {
            vectorStore.delete(new FilterExpressionBuilder()
                    .eq(DocMetadata.DOCUMENT_ID, metadata.documentId().toString())
                    .build());
        } catch (RuntimeException cleanupError) {
            log.warn("Cleanup failed for documentId={}", metadata.documentId(), cleanupError);
        }
    }
}
