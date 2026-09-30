package com.pranit.docmind.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class AiServiceUnavailableException extends BaseException {
    public AiServiceUnavailableException(String message) {
        super(message);
    }
}
