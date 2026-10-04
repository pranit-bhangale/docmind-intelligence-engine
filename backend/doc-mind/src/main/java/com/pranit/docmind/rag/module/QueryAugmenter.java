package com.pranit.docmind.rag.module;

import com.pranit.docmind.shared.domain.QueryRequest;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class QueryAugmenter {

    public String augment(final String query, final List<Document> documents) {
        return augment(query, documents, QueryRequest.QueryType.NORMAL_QA);
    }

    public String augment(final String query, final List<Document> documents, final QueryRequest.QueryType mode) {
        if (documents == null || documents.isEmpty()) {
            return """
                    The user's question could not be answered from the available document context.
                    Politely explain that sufficient document context was not found to answer the query.
                    Do not invent or fabricate information.
                    
                    User Query: %s
                    """.formatted(query);
        }

        final String documentContext = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining(System.lineSeparator() + "---" + System.lineSeparator()));

        final QueryRequest.QueryType effectiveMode = mode != null ? mode : QueryRequest.QueryType.NORMAL_QA;

        return switch (effectiveMode) {
            case DOCUMENT_SUMMARY -> """
                    You are an expert Document Summarization Assistant.
                    
                    Task: Provide a structured, comprehensive summary of the document context below, highlighting key sections, core findings, and actionable takeaways.
                    
                    ---------------------
                    Retrieved Document Context:
                    %s
                    ---------------------
                    
                    User Request: %s
                    
                    Summary:
                    """.formatted(documentContext, query);

            case TECHNICAL_INSIGHTS -> """
                    You are a Technical Architecture & Document Intelligence Specialist.
                    
                    Task: Analyze the document context below to extract technical insights, system architectures, data flows, API definitions, or quantitative metrics.
                    
                    ---------------------
                    Retrieved Document Context:
                    %s
                    ---------------------
                    
                    User Query: %s
                    
                    Technical Insights:
                    """.formatted(documentContext, query);

            case NORMAL_QA -> """
                    You are a document question-answering assistant.
                    
                    Task: Use the retrieved context below to answer the user's question clearly and accurately.
                    
                    ---------------------
                    Retrieved Context:
                    %s
                    ---------------------
                    
                    Rules:
                    1. Answer using ONLY the retrieved context.
                    2. Do not use outside knowledge or infer unsupported facts.
                    3. If the answer cannot be found, state that clearly.
                    
                    User Question: %s
                    
                    Answer:
                    """.formatted(documentContext, query);
        };
    }
}
