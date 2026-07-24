package com.zenthera.service.impl;

import com.zenthera.service.NotificationService;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Profile("prod")
@Service
public class NoOpNotificationServiceImpl implements NotificationService {
    @Override
    public void sendActivationToken(String email, String rawToken) {
        throw new UnsupportedOperationException(
            "Email no configurado en producción. Integrar proveedor SMTP real.");
    }
}
