package com.pranit.docmind.llm.config;

import com.pranit.docmind.shared.properties.AdvisorProperties;
import com.pranit.docmind.shared.properties.RagProperties;
import com.pranit.docmind.shared.properties.SpringAiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.List;
import java.util.Map;

@Slf4j
@Configuration
@EnableConfigurationProperties({AdvisorProperties.class, RagProperties.class, SpringAiProperties.class})
public class AiConfig {

    private static final String DEFAULT_SYSTEM_PROMPT = """
            You are DocMind Intelligence Engine, an AI document assistant designed to analyze multi-format enterprise documents and provide accurate, context-grounded answers.
            """;

    @Bean("chatClient")
    public ChatClient chatClient(ChatClient.Builder builder, List<Advisor> advisors, SpringAiProperties properties) {
        return builder
                .defaultSystem(DEFAULT_SYSTEM_PROMPT)
                .defaultAdvisors(advisors)
                .defaultOptions(OpenAiChatOptions.builder()
                        .temperature(properties.chat().temperature())
                        .maxCompletionTokens(properties.chat().maxCompletionTokens()))
                .build();
    }

    @Bean("rewriteChatModel")
    public OpenAiChatModel rewriteChatModel(SpringAiProperties properties) {
        final SpringAiProperties.Rewrite rewrite = properties.rewrite();
        return OpenAiChatModel.builder().options(OpenAiChatOptions.builder()
                        .apiKey(rewrite.apiKey())
                        .baseUrl(rewrite.baseUrl())
                        .model(rewrite.chat().model())
                        .temperature(rewrite.chat().temperature())
                        .maxTokens(rewrite.chat().maxTokens())
                        .build())
                .build();
    }

    @Bean("rewriteChatClient")
    public ChatClient rewriteChatClient(@Qualifier("rewriteChatModel") OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    @Bean("enrichChatModel")
    @Primary
    public OpenAiChatModel enrichChatModel(SpringAiProperties properties) {
        final SpringAiProperties.Enrich enrich = properties.enrich();
        return OpenAiChatModel.builder().options(OpenAiChatOptions.builder()
                        .apiKey(enrich.apiKey())
                        .baseUrl(enrich.baseUrl())
                        .model(enrich.chat().model())
                        .temperature(enrich.chat().temperature())
                        .maxTokens(enrich.chat().maxTokens())
                        .extraBody(Map.of("chat_template_kwargs", Map.of("enable_thinking", false)))
                        .responseFormat(OpenAiChatModel.ResponseFormat.builder()
                                .type(OpenAiChatModel.ResponseFormat.Type.JSON_OBJECT)
                                .build())
                        .build())
                .build();
    }

    @Bean("enrichChatClient")
    public ChatClient enrichChatClient(@Qualifier("enrichChatModel") OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    @Bean
    public List<Advisor> advisors(MessageChatMemoryAdvisor memoryAdvisor) {
        return List.of(memoryAdvisor);
    }

    @Bean
    public ChatMemory chatMemory(JdbcChatMemoryRepository jdbcChatMemoryRepository) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepository)
                .maxMessages(2)
                .build();
    }

    @Bean
    public MessageChatMemoryAdvisor memoryAdvisor(ChatMemory chatMemory) {
        return MessageChatMemoryAdvisor.builder(chatMemory).build();
    }
}
