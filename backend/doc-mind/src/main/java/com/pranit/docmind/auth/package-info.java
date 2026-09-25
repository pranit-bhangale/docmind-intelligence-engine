@ApplicationModule(
        displayName = "Auth",
        allowedDependencies = {"shared", "tenant::api"}
)
package com.pranit.docmind.auth;

import org.springframework.modulith.ApplicationModule;