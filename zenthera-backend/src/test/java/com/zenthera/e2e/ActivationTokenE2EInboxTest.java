package com.zenthera.e2e;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ActivationTokenE2EInboxTest {

    @Test
    void storesAndConsumesTokenOnlyOnce() {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());
        String email = "admin@e2e.invalid";
        String token = UUID.randomUUID().toString();

        inbox.store(email, token);

        assertEquals(token, inbox.consume(email).orElseThrow());
        assertTrue(inbox.consume(email).isEmpty());
    }

    @Test
    void doesNotReturnExpiredTokens() {
        MutableClock clock = new MutableClock();
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(clock);

        inbox.store("expired@e2e.invalid", UUID.randomUUID().toString());
        clock.advance(Duration.ofMinutes(5));

        assertTrue(inbox.consume("expired@e2e.invalid").isEmpty());
    }

    @Test
    void normalizesEmailBeforeDerivingInternalKey() {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());
        String token = UUID.randomUUID().toString();

        inbox.store("  ADMIN@E2E.INVALID  ", token);

        assertEquals(token, inbox.consume("admin@e2e.invalid").orElseThrow());
    }

    @Test
    void keepsTokensForDifferentEmailsSeparate() {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());
        String firstToken = UUID.randomUUID().toString();
        String secondToken = UUID.randomUUID().toString();

        inbox.store("first@e2e.invalid", firstToken);
        inbox.store("second@e2e.invalid", secondToken);

        assertEquals(secondToken, inbox.consume("second@e2e.invalid").orElseThrow());
        assertEquals(firstToken, inbox.consume("first@e2e.invalid").orElseThrow());
    }

    @Test
    void permitsExactlyOneConcurrentConsumer() throws Exception {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());
        String email = "concurrent@e2e.invalid";
        inbox.store(email, UUID.randomUUID().toString());

        int consumerCount = 8;
        CountDownLatch ready = new CountDownLatch(consumerCount);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successfulConsumes = new AtomicInteger();
        ExecutorService executor = Executors.newFixedThreadPool(consumerCount);
        try {
            List<Future<?>> futures = new ArrayList<>();
            for (int index = 0; index < consumerCount; index++) {
                futures.add(executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    if (inbox.consume(email).isPresent()) {
                        successfulConsumes.incrementAndGet();
                    }
                    return null;
                }));
            }

            ready.await();
            start.countDown();
            for (Future<?> future : futures) {
                future.get();
            }
        } finally {
            executor.shutdownNow();
        }

        assertEquals(1, successfulConsumes.get());
        assertFalse(inbox.consume(email).isPresent());
    }

    @Test
    void rejectsNullEmptyWhitespaceAndMalformedEmails() {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());

        assertInvalidInput(() -> inbox.store(null, "token"));
        assertInvalidInput(() -> inbox.store("", "token"));
        assertInvalidInput(() -> inbox.store("   ", "token"));
        assertInvalidInput(() -> inbox.store("\t", "token"));
        assertInvalidInput(() -> inbox.store("not-an-email", "token"));
        assertInvalidInput(() -> inbox.consume(null));
        assertInvalidInput(() -> inbox.consume(""));
        assertInvalidInput(() -> inbox.consume("   "));
        assertInvalidInput(() -> inbox.consume("\t"));
        assertInvalidInput(() -> inbox.consume("not-an-email"));
    }

    @Test
    void rejectsNullEmptyAndWhitespaceTokens() {
        ActivationTokenE2EInbox inbox = new ActivationTokenE2EInbox(new MutableClock());

        assertInvalidInput(() -> inbox.store("admin@e2e.invalid", null));
        assertInvalidInput(() -> inbox.store("admin@e2e.invalid", ""));
        assertInvalidInput(() -> inbox.store("admin@e2e.invalid", "   "));
        assertInvalidInput(() -> inbox.store("admin@e2e.invalid", "\t"));
    }

    private void assertInvalidInput(Runnable operation) {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, operation::run);
        assertEquals("Datos de activaci\u00f3n E2E inv\u00e1lidos.", exception.getMessage());
    }

    private static final class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-01-01T00:00:00Z");

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }
    }
}
