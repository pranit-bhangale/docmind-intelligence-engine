package com.pranit.docmind.rag.module;

import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class QueryAugmenter {

    private static final PromptTemplate RAG_PROMPT_TEMPLATE = PromptTemplate.builder().template("""
            You are a document question-answering assistant.
            
            Use the retrieved context below to answer the user's question.
            
            ---------------------
            Retrieved Context:
            {context}
            ---------------------
            
            Rules:
            1. Answer the question using the retrieved context.
            2. Do not use outside knowledge when answering questions
               about the provided documents.
            3. If the answer cannot be found in the retrieved context,
               say that you don't know.
            4. Do not invent, assume, or infer unsupported facts.
            5. Answer clearly and directly.
            
            User Question:
            {query}
            
            Answer:
            """).build();

    private static final PromptTemplate EMPTY_CONTEXT_PROMPT = PromptTemplate.builder().template("""
            The user's question could not be answered from the
            available document context.
            
            Politely tell the user that you don't have enough
            information in the provided documents to answer the question.
            
            Do not invent an answer.
            """).build();

    public String augment(final String query, final List<Document> documents) {
        if (documents.isEmpty()) return EMPTY_CONTEXT_PROMPT.render();
        final String documentContext = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining(System.lineSeparator()));
        return RAG_PROMPT_TEMPLATE.render(Map.of("query", query, "context", documentContext));
    }
}
