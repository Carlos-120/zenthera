package com.zenthera.service.impl;

import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.RolNombre;
import com.zenthera.mapper.UsuarioMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final ClinicaRepository clinicaRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    public UsuarioServiceImpl(
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            ClinicaRepository clinicaRepository,
            UsuarioMapper usuarioMapper,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.clinicaRepository = clinicaRepository;
        this.usuarioMapper = usuarioMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UsuarioResponse guardar(Long clinicaId, UsuarioRequest request) {

        if (usuarioRepository.existsByCorreoAndClinicaId(request.getCorreo(), clinicaId)) {
            throw new IllegalArgumentException("El correo ya está registrado en esta clínica.");
        }

        if (usuarioRepository.existsByCedulaAndClinicaId(request.getCedula(), clinicaId)) {
            throw new IllegalArgumentException("La cédula ya está registrada en esta clínica.");
        }

        Clinica clinica = clinicaRepository.findById(clinicaId)
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada."));

        Rol rol = rolRepository.findById(request.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        if (rol.getNombre() == RolNombre.SUPER_ADMIN || rol.getNombre() == RolNombre.ADMIN_CLINICA) {
            throw new IllegalArgumentException("No se puede crear un usuario con rol SUPER_ADMIN o ADMIN_CLINICA.");
        }

        Usuario usuario = usuarioMapper.toEntity(request);
        usuario.setClinica(clinica);
        usuario.setRol(rol);
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

        Usuario guardado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(guardado);
    }

    @Override
    public PageResponse<UsuarioResponse> listar(Long clinicaId, String search, Boolean activo, Long rolId, Pageable pageable) {
        Specification<Usuario> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("clinica").get("id"), clinicaId));

            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("nombres")), likePattern),
                    cb.like(cb.lower(root.get("apellidos")), likePattern),
                    cb.like(cb.lower(root.get("cedula")), likePattern),
                    cb.like(cb.lower(root.get("correo")), likePattern)
                ));
            }
            if (activo != null) {
                predicates.add(cb.equal(root.get("activo"), activo));
            }
            if (rolId != null) {
                predicates.add(cb.equal(root.get("rol").get("id"), rolId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Usuario> page = usuarioRepository.findAll(spec, pageable);

        List<UsuarioResponse> content = page.getContent().stream()
                .map(usuarioMapper::toResponse)
                .toList();

        return PageResponse.<UsuarioResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }

    @Override
    public UsuarioResponse buscarPorId(Long id, Long clinicaId) {
        Usuario usuario = usuarioRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en esta clínica."));

        return usuarioMapper.toResponse(usuario);
    }

    @Override
    public List<com.zenthera.dto.usuario.UsuarioDisponibleResponse> getUsuariosMedicosDisponibles(Long clinicaId) {
        return usuarioRepository.findUsuariosMedicosDisponibles(clinicaId).stream()
                .map(u -> com.zenthera.dto.usuario.UsuarioDisponibleResponse.builder()
                        .id(u.getId())
                        .nombres(u.getNombres())
                        .apellidos(u.getApellidos())
                        .correo(u.getCorreo())
                        .cedula(u.getCedula())
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public UsuarioResponse actualizar(Long id, Long clinicaId, UsuarioRequest request) {

        Usuario usuario = usuarioRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en esta clínica."));

        Rol rol = rolRepository.findById(request.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        if (rol.getNombre() == RolNombre.SUPER_ADMIN || rol.getNombre() == RolNombre.ADMIN_CLINICA) {
            throw new IllegalArgumentException("No se puede asignar el rol SUPER_ADMIN o ADMIN_CLINICA.");
        }

        if (!usuario.getCorreo().equalsIgnoreCase(request.getCorreo()) &&
            usuarioRepository.existsByCorreoAndClinicaId(request.getCorreo(), clinicaId)) {
            throw new IllegalArgumentException("El correo ya está registrado en esta clínica.");
        }

        if (usuario.getCedula() != null && !usuario.getCedula().equalsIgnoreCase(request.getCedula()) &&
            usuarioRepository.existsByCedulaAndClinicaId(request.getCedula(), clinicaId)) {
            throw new IllegalArgumentException("La cédula ya está registrada en esta clínica.");
        }

        usuario.setRol(rol);
        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setCedula(request.getCedula());
        usuario.setTelefono(request.getTelefono());
        usuario.setCorreo(request.getCorreo());
        usuario.setFoto(request.getFoto());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Usuario actualizado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(actualizado);
    }

    @Override
    public UsuarioResponse actualizarEstado(Long id, Long clinicaId, boolean activo) {

        Usuario usuario = usuarioRepository.findByIdAndClinicaId(id, clinicaId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado en esta clínica."));

        usuario.setActivo(activo);

        if (activo) {
            usuario.setBloqueado(false);
        }

        Usuario actualizado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(actualizado);
    }
}
