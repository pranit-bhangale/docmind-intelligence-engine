package com.pranit.docmind.rag.domain;

import lombok.experimental.UtilityClass;

@UtilityClass
public class DocMetadata {

    public static final String DOCUMENT_ID = "document_id";
    public static final String FILE_NAME = "file_name";
    public static final String CHUNK_INDEX = "chunk_index";
    public static final String PAGE_NUMBER = "pageNumber";
    public static final String LEGACY_PAGE_NUMBER = "page_number";
    public static final String PREVIOUS_CHUNK_INDEX = "previous_chunk_index";
    public static final String NEXT_CHUNK_INDEX = "next_chunk_index";

    public static final String SECTION = "section";
    public static final String HEADER = "header";
}

