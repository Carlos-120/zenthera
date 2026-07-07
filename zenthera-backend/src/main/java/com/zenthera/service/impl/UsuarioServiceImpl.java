package com.zenthera.service.impl;

import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;
import com.zenthera.entity.Clinica;
import com.zenthera.entity.Rol;
import com.zenthera.entity.Usuario;
import com.zenthera.mapper.UsuarioMapper;
import com.zenthera.repository.ClinicaRepository;
import com.zenthera.repository.RolRepository;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.service.UsuarioService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
    public UsuarioResponse guardar(UsuarioRequest request) {

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalArgumentException("El correo ya está registrado.");
        }

        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new IllegalArgumentException("La cédula ya está registrada.");
        }

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada."));

        Rol rol = rolRepository.findById(request.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        Usuario usuario = usuarioMapper.toEntity(request);
        usuario.setClinica(clinica);
        usuario.setRol(rol);
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

        Usuario guardado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(guardado);
    }

    @Override
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Override
    public UsuarioResponse buscarPorId(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        return usuarioMapper.toResponse(usuario);
    }

    @Override
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        Clinica clinica = clinicaRepository.findById(request.getClinicaId())
                .orElseThrow(() -> new IllegalArgumentException("Clínica no encontrada."));

        Rol rol = rolRepository.findById(request.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        usuario.setClinica(clinica);
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
    public void eliminar(Long id) {

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        usuario.setActivo(false);

        usuarioRepository.save(usuario);
    }
}