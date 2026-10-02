package com.pranit.docmind.llm.executor;

import org.springframework.ai.chat.model.ChatResponse;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ChatModelExecutor {

    ChatResponse execute(String context, UUID conversationId);

    Flux<String> stream(String context, UUID conversationId);
}
