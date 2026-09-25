package com.pranit.docmind.shared.api;

import java.util.UUID;

public interface CurrentUser {

    UUID userId();

    String tenantId();
}