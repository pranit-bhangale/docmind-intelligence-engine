package com.pranit.docmind.rag.application.factory;

import com.pranit.docmind.document.domain.entity.DocumentType;
import com.pranit.docmind.rag.api.DocumentPipeline;
import com.pranit.docmind.rag.application.orchestrator.DocumentEtlProcessor;
import com.pranit.docmind.rag.excecption.UnsupportedFileFormatException;
import com.pranit.docmind.shared.domain.Metadata;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public final class DocumentPipelineImpl implements DocumentPipeline {

    private final DocumentEtlProcessor etlProcessor;

    @Override
    public long process(final Metadata metadata, final Resource resource) {
        final var type = getType(resource);
        return etlProcessor.process(metadata, resource, type);
    }

    private DocumentType getType(final Resource resource) {
        final var name = Objects.requireNonNull
                (resource.getFilename()).toLowerCase();
        if (name.endsWith(".pdf")) return DocumentType.PDF;
        if (name.endsWith(".doc")
                || name.endsWith(".docx")
                || name.endsWith(".xls")
                || name.endsWith(".xlsx")
                || name.endsWith(".ppt")
                || name.endsWith(".pptx")
                || name.endsWith(".html")
                || name.endsWith(".htm")
                || name.endsWith(".xml")
                || name.endsWith(".csv")
                || name.endsWith(".md")
                || name.endsWith(".json")
                || name.endsWith(".txt")) return DocumentType.TIKA;
        throw new UnsupportedFileFormatException("Unsupported file: " + name);
    }
}
