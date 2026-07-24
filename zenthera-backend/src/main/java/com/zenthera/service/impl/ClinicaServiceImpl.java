package com.zenthera.service.impl;

import com.zenthera.dto.clinica.ClinicaCreateRequest;
import com.zenthera.dto.clinica.ClinicaEstadoRequest;
import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.dto.clinica.ClinicaUpdateRequest;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.entity.AuditoriaEstadoClinica;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.exception.ResourceNotFoundException;
import com.zenthera.mapper.ClinicaMapper;
import com.zenthera.util.HashUtil;
import com.zenthera.mapper.common.PageResponseMapper;
import com.zenthera.repository.AuditoriaEstadoClinicaRepository;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RefreshTokenRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.service.ClinicaService;
import com.zenthera.service.NotificationService;
import com.zenthera.entity.ActivationToken;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
public class ClinicaServiceImpl implements ClinicaService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private String generateActivationToken() {
        byte[] bytes = new byte[32]; // 256 bits
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private final ClinicaRepository clinicaRepository;
    private final AuditoriaEstadoClinicaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ActivationTokenRepository activationTokenRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public ClinicaServiceImpl(ClinicaRepository clinicaRepository,
                              AuditoriaEstadoClinicaRepository auditoriaRepository,
                              UsuarioRepository usuarioRepository,
                              RolRepository rolRepository,
                              RefreshTokenRepository refreshTokenRepository,
                              ActivationTokenRepository activationTokenRepository,
                              NotificationService notificationService,
                              PasswordEncoder passwordEncoder) {
        this.clinicaRepository = clinicaRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.activationTokenRepository = activationTokenRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ClinicaResponse> getAllClinicas(String search, Pageable pageable) {
        Page<Clinica> page;
        if (search != null && !search.trim().isEmpty()) {
            page = clinicaRepository.findByNombreContainingIgnoreCaseOrRucContaining(search, search, pageable);
        } else {
            page = clinicaRepository.findAll(pageable);
        }

        List<ClinicaResponse> content = page.stream()
                .map(ClinicaMapper::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicaResponse getMiClinica(Long clinicaId) {
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica no encontrada"));
        return ClinicaMapper.toResponse(clinica);
    }

    @Override
    @Transactional
    public ClinicaResponse updateMiClinica(Long clinicaId, ClinicaUpdateRequest request) {
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica no encontrada"));

        clinica.setNombre(request.getNombre());
        clinica.setLogo(request.getLogo());
        clinica.setTelefono(request.getTelefono());
        clinica.setCorreo(request.getCorreo());
        clinica.setDireccion(request.getDireccion());
        clinica.setCiudad(request.getCiudad());
        clinica.setProvincia(request.getProvincia());
        clinica.setPais(request.getPais());

        if (request.getZonaHoraria() != null) {
            try {
                java.time.ZoneId.of(request.getZonaHoraria());
                clinica.setZonaHoraria(request.getZonaHoraria());
            } catch (java.time.DateTimeException e) {
                throw new IllegalArgumentException("Zona horaria inválida");
            }
        }

        return ClinicaMapper.toResponse(clinicaRepository.save(clinica));
    }

    @Override
    @Transactional
    public ClinicaResponse createClinica(ClinicaCreateRequest request) {
        if (clinicaRepository.findByRuc(request.getRuc()).isPresent()) {
            throw new IllegalArgumentException("El RUC ya está registrado");
        }

        // Validar correo del administrador único
        if (usuarioRepository.findByCorreo(request.getAdminCorreo()).isPresent()) {
            throw new IllegalArgumentException("El correo del administrador ya está en uso por otra cuenta");
        }

        // Crear la clínica
        Clinica clinica = new Clinica();
        clinica.setRuc(request.getRuc());
        clinica.setRazonSocial(request.getRazonSocial());
        clinica.setNombre(request.getNombre());
        clinica.setCorreo(request.getCorreo());
        clinica.setTelefono(request.getTelefono());
        clinica.setActiva(true);
        // Valores por defecto
        clinica.setZonaHoraria("America/Guayaquil");
        clinica.setDireccion("Pendiente");

        clinica = clinicaRepository.save(clinica);

        // Crear primer administrador
        Rol rolAdmin = rolRepository.findByNombre(RolNombre.ADMIN_CLINICA)
                .orElseThrow(() -> new RuntimeException("Rol ADMIN_CLINICA no encontrado"));

        Usuario admin = new Usuario();
        admin.setClinica(clinica);
        admin.setRol(rolAdmin);
        admin.setNombres(request.getAdminNombres());
        admin.setApellidos(request.getAdminApellidos());
        admin.setCedula(request.getAdminCedula());
        admin.setCorreo(request.getAdminCorreo());
        admin.setTelefono(request.getTelefono()); // Por defecto

        // Contraseña ficticia. El usuario deberá establecer la suya real vía token.
        admin.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        admin.setCambiarPassword(true);
        admin.setActivo(false); // Inactivo hasta que active su cuenta
        admin.setBloqueado(false);

        admin = usuarioRepository.save(admin);

        // Generar token opaco
        String token = generateActivationToken();
        String tokenHash = HashUtil.sha256(token);

        ActivationToken activationToken = new ActivationToken();
        activationToken.setUsuario(admin);
        activationToken.setTokenHash(tokenHash);
        activationToken.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        activationTokenRepository.save(activationToken);

        // Enviar notificación
        notificationService.sendActivationToken(admin.getCorreo(), token);

        return ClinicaMapper.toResponse(clinica);
    }


    @Override
    @Transactional
    public ClinicaResponse updateEstadoClinica(Long clinicaId, ClinicaEstadoRequest request, Long adminId) {
        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new ResourceNotFoundException("Clínica no encontrada"));

        if (clinica.getActiva() == request.isActiva()) {
            throw new IllegalArgumentException("La clínica ya se encuentra en el estado solicitado");
        }

        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        boolean estadoAnterior = clinica.getActiva();
        clinica.setActiva(request.isActiva());
        clinica = clinicaRepository.save(clinica);

        // Si se desactiva, revocar tokens inmediatamente
        if (!request.isActiva()) {
            refreshTokenRepository.revokeByClinicaId(clinica.getId());
        }

        // Crear auditoría
        AuditoriaEstadoClinica auditoria = new AuditoriaEstadoClinica();
        auditoria.setClinica(clinica);
        auditoria.setUsuario(admin);
        auditoria.setEstadoAnterior(estadoAnterior);
        auditoria.setEstadoNuevo(request.isActiva());
        auditoria.setMotivo(request.getMotivo());

        auditoriaRepository.save(auditoria);

        return ClinicaMapper.toResponse(clinica);
    }



}
