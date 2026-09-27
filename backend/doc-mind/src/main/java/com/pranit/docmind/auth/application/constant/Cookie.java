package com.pranit.docmind.auth.application.constant;

import lombok.experimental.UtilityClass;

@UtilityClass
public class Cookie {

    public static final String CACHE_CONTROL_NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";

    public static final String PRAGMA_NO_CACHE = "no-cache";

    public static final String EXPIRES_IMMEDIATELY = "0";
}