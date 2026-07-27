package com.zenthera.event;

import com.zenthera.e2e.ActivationTokenE2EInbox;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Stores activation tokens only in the enabled E2E process after a successful commit. */
@Component
@Profile("e2e")
@ConditionalOnProperty(name = "zenthera.e2e.token-inbox.enabled", havingValue = "true")
public class ActivationTokenE2EListener {

    private final ActivationTokenE2EInbox inbox;

    public ActivationTokenE2EListener(ActivationTokenE2EInbox inbox) {
        this.inbox = inbox;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void storeAfterCommit(ActivationNotificationEvent event) {
        inbox.store(event.recipient(), event.rawToken());
    }
}
