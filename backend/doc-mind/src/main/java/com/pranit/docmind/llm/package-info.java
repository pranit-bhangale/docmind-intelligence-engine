@ApplicationModule(
        displayName = "LLM",
        allowedDependencies = {"shared", "rag::api", "document::api"}
)
package com.pranit.docmind.llm;

import org.springframework.modulith.ApplicationModule;