package com.pranit.docmind.rag.application.enricher;

import com.pranit.docmind.rag.domain.DocMetadata;
import com.pranit.docmind.shared.domain.Metadata;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

@Component
public class DocumentEnricher {
    public List<Document> enrich(final Metadata metadata, final List<Document> chunks) {
        List<Document> enrichedChunks = new ArrayList<>(chunks.size());
        for (var index = 0; index < chunks.size(); index++) {
            final var chunk = chunks.get(index);
            final var enrichedMetadata = new LinkedHashMap<>(chunk.getMetadata());
            enrichedMetadata.put(DocMetadata.DOCUMENT_ID, metadata.documentId().toString());
            enrichedMetadata.put(DocMetadata.FILE_NAME, metadata.fileName());
            if (index > 0) enrichedMetadata.put(DocMetadata.PREVIOUS_CHUNK_INDEX, index - 1);
            if (index < chunks.size() - 1) enrichedMetadata.put(DocMetadata.NEXT_CHUNK_INDEX, index + 1);
            Optional.ofNullable(chunk.getMetadata().get(DocMetadata.LEGACY_PAGE_NUMBER))
                    .or(() -> Optional.ofNullable(chunk.getMetadata().get(DocMetadata.PAGE_NUMBER)))
                    .ifPresent(pageNumber -> enrichedMetadata.put(DocMetadata.PAGE_NUMBER, pageNumber));
            enrichedChunks.add(new Document(chunk.getText(), enrichedMetadata));
        }
        return enrichedChunks;
    }
}
