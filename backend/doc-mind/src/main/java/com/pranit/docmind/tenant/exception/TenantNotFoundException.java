package com.pranit.docmind.tenant.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class TenantNotFoundException extends BaseException {
    public TenantNotFoundException(String message) {
        super(message);
    }
}
