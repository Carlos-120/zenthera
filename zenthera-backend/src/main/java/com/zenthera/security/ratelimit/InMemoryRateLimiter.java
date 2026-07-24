package com.zenthera.security.ratelimit;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Deque;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
@Profile("!prod") // Temporal en memoria, en prod debe usarse RedisRateLimiter
public class InMemoryRateLimiter implements RateLimiter {

    private static final int MAX_REQUESTS = 10;
    private static final long TIME_WINDOW_MS = 600000; // 10 minutos

    private final ConcurrentHashMap<String, Deque<Instant>> requestCounts = new ConcurrentHashMap<>();

    @Override
    public boolean isAllowed(String key) {
        Instant now = Instant.now();
        Deque<Instant> requests = requestCounts.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Limpiar expirados para esta clave
        while (!requests.isEmpty() && requests.peekFirst().isBefore(now.minusMillis(TIME_WINDOW_MS))) {
            requests.pollFirst();
        }

        if (requests.size() >= MAX_REQUESTS) {
            return false;
        }

        requests.addLast(now);
        return true;
    }

    // Limpiar claves vacías cada 15 minutos para evitar fuga de memoria
    @Scheduled(fixedRate = 900000)
    public void cleanup() {
        Instant now = Instant.now();
        Iterator<String> iterator = requestCounts.keySet().iterator();
        while (iterator.hasNext()) {
            String key = iterator.next();
            Deque<Instant> requests = requestCounts.get(key);
            if (requests == null || (requests.isEmpty() || requests.peekLast().isBefore(now.minusMillis(TIME_WINDOW_MS)))) {
                iterator.remove();
            }
        }
    }
}
