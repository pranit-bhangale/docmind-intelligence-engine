package com.pranit.docmind.llm.service;

import com.pranit.docmind.llm.exception.ProviderNotFoundException;
import com.pranit.docmind.shared.domain.Provider;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public final class ChatModelProviderFactory {

    private final Map<Provider, ChatModelStrategy> strategies;

    public ChatModelProviderFactory(List<ChatModelStrategy> strategies) {
        this.strategies = strategies.stream()
                .collect(Collectors.toMap(
                        ChatModelStrategy::getProviderName,
                        strategy -> strategy
                ));
    }

    public ChatModelStrategy getStrategy(Provider provider) {
        return Optional.ofNullable(strategies.get(provider))
                .orElseThrow(() -> new ProviderNotFoundException
                        ("No strategy configured for: " + provider));
    }
}
