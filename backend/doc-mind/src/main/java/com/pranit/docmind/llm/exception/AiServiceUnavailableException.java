package com.pranit.docmind.llm.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class AiServiceUnavailableException extends BaseException {
    public AiServiceUnavailableException(String message) {
        super(message);
    }
}
