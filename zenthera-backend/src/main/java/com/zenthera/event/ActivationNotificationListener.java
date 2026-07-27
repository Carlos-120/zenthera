package com.zenthera.event;

import com.zenthera.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.context.annotation.Profile;

@Component
@Profile("!e2e")
public class ActivationNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(ActivationNotificationListener.class);

    private final NotificationService notificationService;

    public ActivationNotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendAfterCommit(ActivationNotificationEvent event) {
        try {
            notificationService.sendActivationToken(event.recipient(), event.rawToken());
        } catch (RuntimeException ex) {
            // A future retry mechanism can consume this failure without exposing recipient or token data.
            log.warn("Activation notification delivery failed after a committed registration.");
        }
    }
}
