package com.zenthera.service.impl;

import com.zenthera.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Profile("dev")
@Service
@Slf4j
public class MailpitNotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@zenthera.local}")
    private String fromAddress;

    public MailpitNotificationServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendActivationToken(String email, String rawToken) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(email);
        msg.setSubject("Activa tu cuenta Zenthera");
        msg.setText("Tu enlace de activación: " +
                "http://localhost:3000/activate?token=" + rawToken);
        mailSender.send(msg);
        log.info("Activation email dispatched to: {}", email); // Sin token
    }
}
