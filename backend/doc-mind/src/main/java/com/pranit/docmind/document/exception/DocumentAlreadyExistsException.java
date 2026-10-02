package com.pranit.docmind.document.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DocumentAlreadyExistsException extends BaseException {
    public DocumentAlreadyExistsException(String message) {
        super(message);
    }
}
