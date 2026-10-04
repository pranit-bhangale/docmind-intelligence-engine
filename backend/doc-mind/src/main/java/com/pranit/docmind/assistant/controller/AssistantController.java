package com.pranit.docmind.assistant.controller;

import com.pranit.docmind.assistant.application.service.AssistantService;
import com.pranit.docmind.shared.domain.QueryRequest;
import com.pranit.docmind.shared.domain.QueryResponse;
import com.pranit.docmind.shared.exception.AiServiceUnavailableException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat/documents")
@RequiredArgsConstructor
@Validated
@Tag(
        name = "Chat Management",
        description = "Endpoints for querying documents using AI-powered chat, including standard and streaming responses."
)
public class AssistantController {

    private final AssistantService assistantService;

    @Operation(
            summary = "Ask a question about a document",
            description = "Sends a question to the AI assistant and returns a response based on the specified document and conversation context."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Query processed and AI response generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid query request payload or parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "404", description = "Document or conversation context not found"),
            @ApiResponse(responseCode = "503", description = "AI LLM service unavailable or timed out")
    })
    @PostMapping(value = "/{documentId}/query", version = "v1")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<QueryResponse> getResponse(
            @Valid @RequestBody QueryRequest request,
            @Parameter(name = "documentId", description = "Unique identifier of the target document to query", required = true) @PathVariable UUID documentId,
            @Parameter(name = "X-Conversation-ID", description = "Unique identifier for the active conversation context", required = true) @RequestHeader("X-Conversation-ID") UUID conversationId) {
        final QueryResponse response = this.assistantService.getResponse
                (request.provider(), request.query(), conversationId, documentId, request.options());
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @Operation(
            summary = "Stream a response about a document",
            description = "Sends a question to the AI assistant and streams the generated response incrementally using Server-Sent Events (SSE)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Response stream established successfully (text/event-stream)"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload or parameters"),
            @ApiResponse(responseCode = "401", description = "Unauthorized access"),
            @ApiResponse(responseCode = "404", description = "Document or conversation context not found"),
            @ApiResponse(responseCode = "503", description = "AI LLM service unavailable")
    })
    @PostMapping(value = "/{documentId}/query/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE, version = "v1")
    @PreAuthorize("hasRole('USER')")
    public Flux<ServerSentEvent<QueryResponse>> streamChat(
            @Valid @RequestBody QueryRequest request,
            @Parameter(name = "documentId", description = "Unique identifier of the target document to query", required = true) @PathVariable UUID documentId,
            @Parameter(name = "X-Conversation-ID", description = "Unique identifier for the active conversation context", required = true) @RequestHeader("X-Conversation-ID") UUID conversationId) {
        return this.assistantService.getStreamResponse
                        (request.provider(), request.query(), conversationId, documentId, request.options())
                .map(response -> ServerSentEvent.<QueryResponse>builder()
                        .event("message")
                        .data(response)
                        .build())
                .onErrorResume(AiServiceUnavailableException.class, ex ->
                        Flux.just(ServerSentEvent.<QueryResponse>builder()
                                .event("error")
                                .data(QueryResponse.builder().content(ex.getMessage()).build())
                                .build()));
    }
}
