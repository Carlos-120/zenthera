package com.zenthera.service.impl;

import com.zenthera.service.NotificationService;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Profile({"test", "e2e"})
@Service
public class TestNotificationServiceImpl implements NotificationService {

    private final ConcurrentHashMap<String, String> tokenStore = new ConcurrentHashMap<>();

    @Override
    public void sendActivationToken(String email, String rawToken) {
        tokenStore.put(email, rawToken); // Sin log
    }

    /** Solo para uso en tests — acceder vía @Autowired en la clase de test */
    public Optional<String> getTokenForEmail(String email) {
        return Optional.ofNullable(tokenStore.get(email));
    }

    public void clear() {
        tokenStore.clear();
    }
}
