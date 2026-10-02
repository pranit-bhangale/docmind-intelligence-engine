package com.pranit.docmind.document.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
public class DocumentProcessingException extends BaseException {
    public DocumentProcessingException(String message) {
        super(message);
    }
}
