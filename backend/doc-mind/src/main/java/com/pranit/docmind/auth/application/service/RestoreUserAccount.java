package com.pranit.docmind.auth.application.service;

import java.util.UUID;

@FunctionalInterface
public interface RestoreUserAccount {

    void restoreUserAccount(UUID userId);
}
