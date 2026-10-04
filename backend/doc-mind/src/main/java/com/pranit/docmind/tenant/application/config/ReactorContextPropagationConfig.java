package com.pranit.docmind.tenant.application.config;

import com.pranit.docmind.tenant.application.service.impl.TenantContextAccessor;
import io.micrometer.context.ContextRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Hooks;

@Configuration
@RequiredArgsConstructor
public class ReactorContextPropagationConfig {

    private final TenantContextAccessor tenantContextAccessor;

    @PostConstruct
    public void configureContextPropagation() {
        ContextRegistry.getInstance()
                .registerThreadLocalAccessor(tenantContextAccessor);
        Hooks.enableAutomaticContextPropagation();
    }
}
