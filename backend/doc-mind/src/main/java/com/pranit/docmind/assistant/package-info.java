@ApplicationModule(
        displayName = "ASSISTANT",
        allowedDependencies = {"shared", "document::api", "llm::api"}
)
package com.pranit.docmind.assistant;

import org.springframework.modulith.ApplicationModule;