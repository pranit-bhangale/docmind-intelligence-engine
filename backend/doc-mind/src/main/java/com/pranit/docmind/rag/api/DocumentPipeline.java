package com.pranit.docmind.rag.api;

import com.pranit.docmind.shared.domain.Metadata;
import org.springframework.core.io.Resource;

@FunctionalInterface
public interface DocumentPipeline {
    long process(Metadata metadata, Resource resource);
}
