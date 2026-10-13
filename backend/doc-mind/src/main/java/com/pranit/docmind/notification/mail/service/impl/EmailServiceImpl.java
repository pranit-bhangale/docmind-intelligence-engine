package com.pranit.docmind.notification.mail.service.impl;

import com.pranit.workspace.notification.mail.service.EmailService;
import com.pranit.workspace.notification.properties.OwnerProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

@Service
@RequiredArgsConstructor
public final class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final OwnerProperties properties;

    @Override
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.email());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    @Override
    public void sendEmail(
            final String to, final String subject,
            final String templateName, final Map<String, Object> variables) {

        final Context context = new Context();
        context.setVariables(variables);
        final String html = templateEngine.process(templateName, context);
        final MimeMessage message = mailSender.createMimeMessage();

        try {
            final MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(properties.email());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (final MessagingException exception) {
            throw new IllegalStateException("Failed to prepare email message", exception);
        }
    }
}
