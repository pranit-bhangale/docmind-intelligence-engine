package com.pranit.docmind.shared.swagger;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "DocMind Intelligence Engine API",
                summary = "Multi-tenant document intelligence and RAG API",
                description = """
                        REST API for the DocMind Intelligence Engine, providing
                        multi-tenant authentication, authorization, document ingestion,
                        knowledge management, semantic retrieval, and
                        Retrieval-Augmented Generation (RAG) capabilities.
                        
                        DocMind transforms documents into searchable knowledge using
                        embeddings and vector storage, enabling context-aware
                        conversational question answering over enterprise knowledge.
                        """,
                version = "1.0.0",
                contact = @Contact(
                        name = "Pranit Bhangale",
                        url = "https://pranitbhangale.vercel.app",
                        email = "pranitbhangale1453@gmail.com"
                )
        ),
        security = {
                @SecurityRequirement(name = "accessToken")
        }
)
@SecurityScheme(
        name = "accessToken",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.COOKIE,
        paramName = "accessToken",
        description = "JWT access token stored in HttpOnly cookie"
)
public class SwaggerConfig {
}
