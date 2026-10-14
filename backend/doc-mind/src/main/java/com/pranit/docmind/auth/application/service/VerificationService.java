package com.pranit.docmind.auth.application.service;

import com.pranit.docmind.auth.domain.dto.VerificationResponse;
import com.pranit.docmind.auth.domain.dto.VerifyOtp;
import jakarta.validation.Valid;

public interface VerificationService {

    VerificationResponse verifyPasswordResetOtp(@Valid VerifyOtp request);
}
