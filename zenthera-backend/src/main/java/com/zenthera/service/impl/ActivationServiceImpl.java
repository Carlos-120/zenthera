package com.zenthera.service.impl;

import com.zenthera.entity.ActivationToken;
import com.zenthera.entity.Usuario;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.service.ActivationService;
import com.zenthera.util.HashUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ActivationServiceImpl implements ActivationService {

    private static final String GENERIC_ERROR_MSG = "El token de activación es inválido o ha expirado";

    private final ActivationTokenRepository activationTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public ActivationServiceImpl(ActivationTokenRepository activationTokenRepository, PasswordEncoder passwordEncoder) {
        this.activationTokenRepository = activationTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void activateAccount(String rawToken, String newPassword) {
        String hash = HashUtil.sha256(rawToken);

        // 1. Lectura pesimista
        ActivationToken at = activationTokenRepository.findByTokenHashForUpdate(hash)
                .orElseThrow(() -> new IllegalArgumentException(GENERIC_ERROR_MSG));

        // 2. Reglas de negocio (lanzan error genérico)
        if (at.isUsed() || at.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException(GENERIC_ERROR_MSG);
        }

        Usuario u = at.getUsuario();
        if (!u.getClinica().getActiva()) {
            throw new IllegalStateException("La clínica asociada se encuentra inactiva");
        }

        // 3. Mutación en misma TX
        at.setUsed(true);

        u.setPassword(passwordEncoder.encode(newPassword));
        u.setActivo(true);
        u.setCambiarPassword(false);
    }
}
