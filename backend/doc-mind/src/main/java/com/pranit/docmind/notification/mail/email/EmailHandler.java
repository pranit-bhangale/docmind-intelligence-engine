package com.pranit.docmind.notification.mail.email;

import com.pranit.docmind.notification.api.EmailPurpose;

public interface EmailHandler<T> {

    EmailPurpose supports();

    void send(T event);
}