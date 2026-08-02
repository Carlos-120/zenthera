package com.zenthera.service.impl;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;
import com.zenthera.dto.auth.MeResponse;
import com.zenthera.dto.auth.AuthResult;
import com.zenthera.entity.RefreshToken;
import com.zenthera.entity.Usuario;
import com.zenthera.repository.RefreshTokenRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.security.jwt.JwtService;
import com.zenthera.security.tenant.TenantContext;
import com.zenthera.service.AuthService;
import com.zenthera.exception.TokenReutilizadoException;
import com.zenthera.util.HashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom secureRandom = new SecureRandom();

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshExpirationMs;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           UsuarioRepository usuarioRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    @Override
    @Transactional
    public AuthResult login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getCorreo(), request.getPassword()));

        Usuario usuario = usuarioRepository.findByCorreoAndActivoTrue(request.getCorreo())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        String accessToken = jwtService.generateToken(usuario.getCorreo());

        String rawRefreshToken = generateSecureToken();
        String hash = HashUtil.sha256(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(hash);
        refreshToken.setFamiliaId(UUID.randomUUID().toString()); // Nueva familia
        refreshToken.setUsuario(usuario);
        refreshToken.setFechaExpiracion(Instant.now().plusMillis(refreshExpirationMs));
        refreshTokenRepository.save(refreshToken);

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .usuarioId(usuario.getId())
                .nombreCompleto(usuario.getNombres() + " " + usuario.getApellidos())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().getNombre().name())
                .clinica(usuario.getClinica().getNombre())
                .build();

        return AuthResult.builder()
                .loginResponse(loginResponse)
                .refreshToken(rawRefreshToken)
                .build();
    }

    @Override
    @Transactional(noRollbackFor = TokenReutilizadoException.class)
    public AuthResult refresh(String rawRefreshToken) {
        String hash = HashUtil.sha256(rawRefreshToken);

        // 1. Adquirir bloqueo exclusivo de fila — serializa concurrencia a nivel de BD
        RefreshToken token = refreshTokenRepository
                .findByTokenHashForUpdate(hash)
                .orElseThrow(() -> new IllegalArgumentException("Token inválido"));

        // 2. Expirado → rechazar. No revocar familia (no es indicio de ataque).
        if (token.getFechaExpiracion().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token expirado");
        }

        // 3. Token revocado → el Hilo B llega aquí tras el commit del Hilo A.
        //    Revocar toda la familia EN ESTA MISMA TX (sin REQUIRES_NEW).
        //    noRollbackFor garantiza que esta TX confirme a pesar de la excepción.
        if (token.isRevocado()) {
            refreshTokenRepository.revokeAllByFamiliaId(token.getFamiliaId());
            throw new TokenReutilizadoException(
                    "Reutilización de refresh token detectada. Sesión invalidada.");
        }

        // 4. Validar tenant — usuario y clínica activos
        Usuario usuario = token.getUsuario();
        if (!usuario.getActivo() || !usuario.getClinica().getActiva()) {
            throw new IllegalArgumentException("Usuario o clínica inactivos");
        }

        // 5. Revocar token actual e insertar nuevo — misma TX, antes del commit
        token.setRevocado(true);
        // No llamar save() explícito: el cambio en entidad gestionada se persiste al commit

        String accessToken = jwtService.generateToken(usuario.getCorreo());

        String newRawRefreshToken = generateSecureToken();
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setTokenHash(HashUtil.sha256(newRawRefreshToken));
        newRefreshToken.setFamiliaId(token.getFamiliaId());
        newRefreshToken.setUsuario(usuario);
        newRefreshToken.setFechaExpiracion(Instant.now().plusMillis(refreshExpirationMs));
        refreshTokenRepository.save(newRefreshToken);

        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .build();

        return AuthResult.builder()
                .loginResponse(loginResponse)
                .refreshToken(newRawRefreshToken)
                .build();
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) return;

        String hash = HashUtil.sha256(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            // Revocar toda la familia para cerrar todas las "pestañas" que compartían la familia
            refreshTokenRepository.revokeAllByFamiliaId(rt.getFamiliaId());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public MeResponse getMe() {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            throw new IllegalStateException("Contexto de seguridad sin tenant asignado");
        }

        // El Authentication debe contener el correo inyectado por JwtAuthenticationFilter
        String correo = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();

        Usuario usuario = usuarioRepository.findByCorreoAndActivoTrue(correo)
                .filter(u -> u.getClinica().getId().equals(tenantId))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en el tenant actual"));

        return MeResponse.builder()
                .id(usuario.getId())
                .nombres(usuario.getNombres())
                .apellidos(usuario.getApellidos())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol().getNombre().name())
                .clinicaId(usuario.getClinica() != null ? usuario.getClinica().getId() : null)
                .clinicaNombre(usuario.getClinica() != null ? usuario.getClinica().getNombre() : null)
                .onboardingCompletado(usuario.getClinica() != null ? usuario.getClinica().getOnboardingCompletado() : null)
                .build();
    }
}
