package com.pranit.docmind.auth.application.service;

import com.pranit.docmind.auth.domain.dto.RegistrationRequest;
import jakarta.validation.Valid;

@FunctionalInterface
public interface RegistrationService {

    void registerNewUserByAdmin(@Valid RegistrationRequest request);
}
