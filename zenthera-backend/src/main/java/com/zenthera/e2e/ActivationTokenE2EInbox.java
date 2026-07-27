package com.zenthera.e2e;

import com.zenthera.util.HashUtil;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

/**
 * Ephemeral, process-local inbox for E2E activation tokens. It is never enabled
 * outside the explicitly configured E2E environment.
 */
@Component
@Profile("e2e")
@ConditionalOnProperty(name = "zenthera.e2e.token-inbox.enabled", havingValue = "true")
public class ActivationTokenE2EInbox {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(5);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final String INVALID_INPUT_MESSAGE = "Datos de activaci\u00f3n E2E inv\u00e1lidos.";

    private final ConcurrentHashMap<String, StoredToken> tokens = new ConcurrentHashMap<>();
    private final Clock clock;

    public ActivationTokenE2EInbox() {
        this(Clock.systemUTC());
    }

    ActivationTokenE2EInbox(Clock clock) {
        this.clock = clock;
    }

    public void store(String adminEmail, String rawToken) {
        String emailKey = emailKey(adminEmail);
        validateToken(rawToken);
        clearExpired();
        tokens.put(emailKey, new StoredToken(rawToken, clock.instant().plus(TOKEN_TTL)));
    }

    public Optional<String> consume(String adminEmail) {
        clearExpired();

        AtomicReference<String> consumedToken = new AtomicReference<>();
        tokens.compute(emailKey(adminEmail), (key, storedToken) -> {
            if (storedToken != null && storedToken.expiresAt().isAfter(clock.instant())) {
                consumedToken.set(storedToken.rawToken());
            }
            return null;
        });

        return Optional.ofNullable(consumedToken.get());
    }

    public void clearExpired() {
        Instant now = clock.instant();
        tokens.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
    }

    public void clearAll() {
        tokens.clear();
    }

    private String emailKey(String adminEmail) {
        return HashUtil.sha256(normalizeEmail(adminEmail));
    }

    private String normalizeEmail(String adminEmail) {
        if (isBlankOrWhitespace(adminEmail)) {
            throw new IllegalArgumentException(INVALID_INPUT_MESSAGE);
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()
                || containsWhitespace(normalizedEmail)) {
            throw new IllegalArgumentException(INVALID_INPUT_MESSAGE);
        }

        return normalizedEmail;
    }

    private void validateToken(String rawToken) {
        if (isBlankOrWhitespace(rawToken)) {
            throw new IllegalArgumentException(INVALID_INPUT_MESSAGE);
        }
    }

    private boolean isBlankOrWhitespace(String value) {
        return value == null || value.isEmpty() || !value.codePoints()
                .anyMatch(codePoint -> !Character.isWhitespace(codePoint) && !Character.isSpaceChar(codePoint));
    }

    private boolean containsWhitespace(String value) {
        return value.codePoints()
                .anyMatch(codePoint -> Character.isWhitespace(codePoint) || Character.isSpaceChar(codePoint));
    }

    private record StoredToken(String rawToken, Instant expiresAt) {
    }
}
