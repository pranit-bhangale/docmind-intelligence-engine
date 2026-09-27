package com.pranit.docmind.rag.excecption;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class UnsupportedFileFormatException extends BaseException {
    public UnsupportedFileFormatException(String message) {
        super(message);
    }
}
