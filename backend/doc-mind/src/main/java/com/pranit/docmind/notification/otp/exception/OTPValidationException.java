package com.pranit.docmind.notification.otp.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class OTPValidationException extends BaseException {
    public OTPValidationException(String message) {
        super(message);
    }
}
