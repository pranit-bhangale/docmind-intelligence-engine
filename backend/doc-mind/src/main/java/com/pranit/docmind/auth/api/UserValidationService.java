package com.pranit.docmind.auth.api;

import java.util.UUID;

public interface UserValidationService {

    boolean checkUserExists(UUID userId);
}
