package com.zenthera.service.impl;

import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.medico.MedicoListResponse;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.medico.MedicoResponse;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Medico;
import com.zenthera.mapper.MedicoMapper;
import com.zenthera.mapper.common.PageResponseMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.MedicoRepository;
import com.zenthera.security.tenant.TenantContext;
import com.zenthera.service.MedicoService;
import com.zenthera.dto.medico.UsuarioMedicoLinkRequest;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.security.user.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.security.SecureRandom;
import java.util.Base64;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import com.zenthera.repository.ActivationTokenRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.entity.ActivationToken;
import com.zenthera.entity.Rol;
import com.zenthera.event.ActivationNotificationEvent;
import com.zenthera.util.HashUtil;

@Service
public class MedicoServiceImpl implements MedicoService {

    private final MedicoRepository medicoRepository;
    private final ClinicaRepository clinicaRepository;
    private final MedicoMapper medicoMapper;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final ActivationTokenRepository activationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public MedicoServiceImpl(
            MedicoRepository medicoRepository,
            ClinicaRepository clinicaRepository,
            MedicoMapper medicoMapper,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            ActivationTokenRepository activationTokenRepository,
            PasswordEncoder passwordEncoder,
            ApplicationEventPublisher eventPublisher) {

        this.medicoRepository = medicoRepository;
        this.clinicaRepository = clinicaRepository;
        this.medicoMapper = medicoMapper;
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.activationTokenRepository = activationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventPublisher = eventPublisher;
    }

    private String generateActivationToken() {
        byte[] bytes = new byte[32]; // 256 bits
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    @Transactional
    public MedicoResponse crear(MedicoRequest request) {

        Long tenantId = TenantContext.getCurrentTenant();
        Clinica clinica = clinicaRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Clinica no encontrada."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrue(
                tenantId, request.getCedula())) {

            throw new IllegalArgumentException(
                    "Ya existe un medico con esa cedula en la clinica.");
        }

        Medico medico = medicoMapper.toEntity(request);
        medico.setClinica(clinica);

        if (Boolean.TRUE.equals(request.getCrearCuentaAcceso())) {
            if (request.getCorreo() == null || request.getCorreo().isBlank()) {
                throw new IllegalArgumentException("El correo es obligatorio para crear una cuenta de acceso.");
            }
            if (request.getPassword() == null || request.getPassword().isBlank()) {
                throw new IllegalArgumentException("La contraseña temporal es obligatoria para crear una cuenta de acceso.");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new IllegalArgumentException("Las contraseñas no coinciden.");
            }
            provisionarCuentaUsuario(medico, clinica, request.getCorreo(), request.getCedula(), request.getNombres(), request.getApellidos(), request.getPassword());
        }

        Medico guardado = medicoRepository.save(medico);

        return medicoMapper.toResponse(guardado);
    }

    private void provisionarCuentaUsuario(Medico medico, Clinica clinica, String correo, String cedula, String nombres, String apellidos, String password) {
        if (usuarioRepository.existsByCorreoAndClinicaId(correo, clinica.getId())) {
            throw new IllegalArgumentException("Ya existe una cuenta con este correo. Puede vincular una cuenta MEDICO existente desde el detalle del médico.");
        }

        if (usuarioRepository.existsByCedulaAndClinicaId(cedula, clinica.getId())) {
            throw new IllegalArgumentException("La cédula ya está registrada en esta clínica para otro usuario.");
        }

        Rol rolMedico = rolRepository.findByNombre(RolNombre.MEDICO)
                .orElseThrow(() -> new IllegalArgumentException("Rol MEDICO no encontrado."));

        Usuario usuario = new Usuario();
        usuario.setClinica(clinica);
        usuario.setRol(rolMedico);
        usuario.setNombres(nombres);
        usuario.setApellidos(apellidos);
        usuario.setCedula(cedula);
        usuario.setCorreo(correo);

        // Contraseña temporal interna
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setCambiarPassword(true);
        usuario.setActivo(true);
        usuario.setBloqueado(false);

        usuario = usuarioRepository.save(usuario);

        medico.setUsuario(usuario);
    }

    @Override
    @Transactional
    public MedicoResponse crearCuentaAcceso(Long medicoId, com.zenthera.dto.medico.RestablecerPasswordRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();
        Clinica clinica = clinicaRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada."));

        Medico medico = medicoRepository.findByIdAndClinicaId(medicoId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado."));

        if (medico.getUsuario() != null) {
            throw new IllegalArgumentException("El médico ya tiene una cuenta de usuario vinculada.");
        }

        if (medico.getCorreo() == null || medico.getCorreo().isBlank()) {
            throw new IllegalArgumentException("El médico debe tener un correo registrado para crear una cuenta.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden.");
        }

        provisionarCuentaUsuario(medico, clinica, medico.getCorreo(), medico.getCedula(), medico.getNombres(), medico.getApellidos(), request.getPassword());

        return medicoMapper.toResponse(medicoRepository.save(medico));
    }

    @Override
    @Transactional
    public MedicoResponse restablecerPasswordMedico(Long medicoId, com.zenthera.dto.medico.RestablecerPasswordRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();

        Medico medico = medicoRepository.findByIdAndClinicaId(medicoId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado."));

        Usuario usuario = medico.getUsuario();
        if (usuario == null) {
            throw new IllegalArgumentException("El médico no tiene una cuenta de usuario.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden.");
        }

        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setCambiarPassword(true);
        usuarioRepository.save(usuario);

        return medicoMapper.toResponse(medico);
    }



    @Override
    public MedicoResponse obtenerPorId(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        return medicoRepository.findByIdAndClinicaId(id, tenantId)
                .map(medicoMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));
    }

    @Override
    public List<MedicoListResponse> listar() {
        Long tenantId = TenantContext.getCurrentTenant();

        return medicoMapper.toListResponse(
                medicoRepository.findByClinicaIdAndActivoTrue(tenantId));
    }

    @Override
    public PageResponse<MedicoListResponse> listar(int page, int size, String buscar, Boolean activo) {
        Long tenantId = TenantContext.getCurrentTenant();

        Page<MedicoListResponse> medicos = medicoRepository
                .buscarMedicosPaginado(tenantId, buscar, activo, null, PageRequest.of(page, size))
                .map(medicoMapper::toListResponse);

        return PageResponseMapper.from(medicos);
    }

    @Override
    public List<MedicoListResponse> buscar(String buscar) {
        Long tenantId = TenantContext.getCurrentTenant();
        return medicoMapper.toListResponse(
                medicoRepository.buscarMedicos(tenantId, buscar));
    }

    @Override
    public MedicoResponse actualizar(Long id, MedicoRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();

        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));

        if (medicoRepository.existsByClinicaIdAndCedulaAndActivoTrueAndIdNot(
                tenantId, request.getCedula(), id)) {

            throw new IllegalArgumentException(
                    "Ya existe un medico con esa cedula en la clinica.");
        }

        // medico.setClinica(clinica); // Not needed anymore as tenant isolation handles it
        medico.setCedula(request.getCedula());
        medico.setNombres(request.getNombres());
        medico.setApellidos(request.getApellidos());
        medico.setEspecialidad(request.getEspecialidad());
        medico.setTelefono(request.getTelefono());
        medico.setCorreo(request.getCorreo());
        medico.setDireccion(request.getDireccion());
        medico.setRegistroProfesional(request.getRegistroProfesional());
        medico.setActivo(
                request.getActivo() != null
                        ? request.getActivo()
                        : true);

        Medico actualizado = medicoRepository.save(medico);
        return medicoMapper.toResponse(actualizado);
    }

    @Override
    public MedicoResponse cambiarEstado(Long id, Boolean activo) {
        Long tenantId = TenantContext.getCurrentTenant();
        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));

        medico.setActivo(activo);
        Medico actualizado = medicoRepository.save(medico);
        return medicoMapper.toResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        Long tenantId = TenantContext.getCurrentTenant();
        Medico medico = medicoRepository.findByIdAndClinicaId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Medico no encontrado."));
        medico.setActivo(false);
        medicoRepository.save(medico);
    }

    @Override
    public MedicoResponse vincularUsuario(Long medicoId, UsuarioMedicoLinkRequest request) {
        Long tenantId = TenantContext.getCurrentTenant();

        Medico medico = medicoRepository.findByIdAndClinicaId(medicoId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado en esta clínica."));

        Usuario usuario = usuarioRepository.findByIdAndClinicaId(request.getUsuarioId(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en esta clínica."));

        if (!RolNombre.MEDICO.equals(usuario.getRol().getNombre())) {
            throw new IllegalArgumentException("Solo usuarios con rol MEDICO pueden vincularse a un médico.");
        }

        boolean alreadyLinked = medicoRepository.findByUsuarioId(usuario.getId())
                .map(m -> !m.getId().equals(medicoId))
                .orElse(false);
        if (alreadyLinked) {
            throw new IllegalArgumentException("El usuario ya está vinculado a otro médico.");
        }

        medico.setUsuario(usuario);
        return medicoMapper.toResponse(medicoRepository.save(medico));
    }

    @Override
    public MedicoResponse desvincularUsuario(Long medicoId) {
        Long tenantId = TenantContext.getCurrentTenant();

        Medico medico = medicoRepository.findByIdAndClinicaId(medicoId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Médico no encontrado en esta clínica."));

        medico.setUsuario(null);
        return medicoMapper.toResponse(medicoRepository.save(medico));
    }

    @Override
    public Medico getMedicoPorUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Long usuarioId = userDetails.getUsuario().getId();

        return medicoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("El usuario autenticado no está vinculado a ningún médico."));
    }
}
