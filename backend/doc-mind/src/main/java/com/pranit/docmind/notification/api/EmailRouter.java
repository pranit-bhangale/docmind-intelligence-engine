package com.pranit.docmind.notification.api;


import com.pranit.docmind.notification.mail.event.EmailEvent;

public interface EmailRouter {

    void send(EmailEvent event, EmailPurpose purpose);
}
