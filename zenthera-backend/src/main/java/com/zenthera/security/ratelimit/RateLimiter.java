package com.zenthera.security.ratelimit;

public interface RateLimiter {
    boolean isAllowed(String key);
}
