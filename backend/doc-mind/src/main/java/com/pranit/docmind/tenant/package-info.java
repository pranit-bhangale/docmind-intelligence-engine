@ApplicationModule(
        displayName = "Tenant",
        allowedDependencies = {"shared", "notification::api"}
)
package com.pranit.docmind.tenant;

import org.springframework.modulith.ApplicationModule;