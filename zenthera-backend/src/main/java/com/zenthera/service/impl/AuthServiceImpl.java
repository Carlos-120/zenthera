package com.zenthera.service.impl;

import com.zenthera.dto.auth.LoginRequest;
import com.zenthera.dto.auth.LoginResponse;
import com.zenthera.entity.Usuario;
import com.zenthera.repository.UsuarioRepository;
import com.zenthera.security.jwt.JwtService;
import com.zenthera.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final UsuarioRepository usuarioRepository;

        public AuthServiceImpl(AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        UsuarioRepository usuarioRepository) {
                this.authenticationManager = authenticationManager;
                this.jwtService = jwtService;
                this.usuarioRepository = usuarioRepository;
        }

        @Override
        public LoginResponse authenticate(LoginRequest loginRequest) {
                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                loginRequest.getCorreo(),
                                                loginRequest.getPassword()));

                Usuario usuario = usuarioRepository.findByCorreoAndActivoTrue(loginRequest.getCorreo())
                                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

                String token = jwtService.generateToken(usuario.getCorreo());

                return LoginResponse.builder()
                                .accessToken(token)
                                .tokenType("Bearer")
                                .usuarioId(usuario.getId())
                                .nombreCompleto(usuario.getNombres() + " " + usuario.getApellidos())
                                .correo(usuario.getCorreo())
                                .rol(usuario.getRol().getNombre().name())
                                .clinica(usuario.getClinica().getNombre())
                                .build();
        }
}
