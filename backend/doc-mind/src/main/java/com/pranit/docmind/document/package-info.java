@ApplicationModule(
        displayName = "Document",
        allowedDependencies = {"shared", "auth::api", "rag::api"}
)
package com.pranit.docmind.document;

import org.springframework.modulith.ApplicationModule;