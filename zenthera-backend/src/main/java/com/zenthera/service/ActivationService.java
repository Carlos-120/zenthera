package com.zenthera.service;

public interface ActivationService {
    void activateAccount(String rawToken, String newPassword);
}
