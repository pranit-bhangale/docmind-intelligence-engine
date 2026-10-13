@ApplicationModule(
        displayName = "Auth",
        allowedDependencies = {"shared", "tenant::api", "notification::api"}
)
package com.pranit.docmind.auth;

import org.springframework.modulith.ApplicationModule;