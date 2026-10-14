package com.pranit.docmind.auth.application.service;

import com.pranit.docmind.auth.domain.dto.ChangeForgotPasswordRequest;
import com.pranit.docmind.auth.domain.dto.ForgotPasswordEmail;
import com.pranit.docmind.auth.domain.dto.PasswordResponse;
import jakarta.validation.Valid;

public interface PasswordService {

    PasswordResponse requestPasswordReset(@Valid ForgotPasswordEmail request);

    PasswordResponse resetPassword(@Valid ChangeForgotPasswordRequest request);
}
