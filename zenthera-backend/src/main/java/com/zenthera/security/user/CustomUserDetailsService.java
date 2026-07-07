package com.zenthera.security.user;

import com.zenthera.entity.Usuario;
import com.zenthera.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository
                .findByCorreoAndActivoTrue(correo)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado"));

        return new CustomUserDetails(usuario);
    }
}