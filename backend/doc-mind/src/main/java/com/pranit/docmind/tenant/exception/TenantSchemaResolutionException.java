package com.pranit.docmind.tenant.exception;

import com.pranit.docmind.shared.exception.BaseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class TenantSchemaResolutionException extends BaseException {
    public TenantSchemaResolutionException(String message) {
        super(message);
    }
}
