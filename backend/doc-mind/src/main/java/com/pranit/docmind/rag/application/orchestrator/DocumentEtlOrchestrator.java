package com.pranit.docmind.rag.application.orchestrator;

import com.pranit.docmind.document.domain.entity.DocumentType;
import com.pranit.docmind.rag.application.enricher.DocumentEnricher;
import com.pranit.docmind.rag.application.service.TokenTextSplitter;
import com.pranit.docmind.rag.exception.UnsupportedFileFormatException;
import com.pranit.docmind.shared.domain.Metadata;
import com.pranit.docmind.shared.properties.RagProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public final class DocumentEtlOrchestrator {

    private final RagProperties properties;
    private final DocumentEnricher documentEnricher;
    private final VectorStore vectorStore;

    public long process
            (final Metadata metadata, final Resource resource, final DocumentType type) {
        final var documents = extract(resource, type);
        final var chunks = chunk(documents);
        final var enrichedChunks = documentEnricher.enrich(metadata, chunks);
        vectorStore.add(enrichedChunks);
        return enrichedChunks.size();
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
}
