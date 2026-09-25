package com.pranit.docmind.auth.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class RoleNotFoundException extends BaseException {
    public RoleNotFoundException(String message) {
        super(message);
    }
}
