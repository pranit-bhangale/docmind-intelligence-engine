package com.pranit.docmind.auth.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RoleAlreadyAssignedException extends BaseException {
    public RoleAlreadyAssignedException(String message) {
        super(message);
    }
}
