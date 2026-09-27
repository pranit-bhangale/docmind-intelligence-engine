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
                summary = "Multi-tenant document intelligence and Retrieval-Augmented Generation (RAG) API",
                description = """
                        REST API for the DocMind Intelligence Engine, providing enterprise multi-tenant authentication, 
                        role-based access control (RBAC), tenant provisioning lifecycle management, document ingestion, 
                        knowledge management, semantic vector retrieval, and Retrieval-Augmented Generation (RAG) capabilities.
                        
                        DocMind isolates tenant workspaces through dedicated database schemas, secures user sessions 
                        via HttpOnly JWT cookies, and manages complete tenant lifecycles including registration, 
                        administrative approval, activation, deactivation, and suspension.
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
