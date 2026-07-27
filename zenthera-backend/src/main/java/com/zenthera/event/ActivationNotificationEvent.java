package com.zenthera.event;

/**
 * Internal event carrying the activation token only until a successful transaction commits.
 */
public record ActivationNotificationEvent(String recipient, String rawToken) {
}
