package com.pranit.docmind.auth.application.constant;

import lombok.experimental.UtilityClass;

@UtilityClass
public class JwtClaim {

    public static final String TOKEN_TYPE = "token";
    public static final String ACCESS = "access";
    public static final String REFRESH = "refresh";
    public static final String ROLES = "roles";
    public static final String TENANT_ID = "tenantId";
}
