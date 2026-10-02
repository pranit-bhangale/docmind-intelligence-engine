package com.pranit.docmind.llm.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProviderNotFoundException extends BaseException {
    public ProviderNotFoundException(String message) {
        super(message);
    }
}
