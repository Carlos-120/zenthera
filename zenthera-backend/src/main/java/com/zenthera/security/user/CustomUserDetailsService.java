package com.zenthera.security.user;

import com.zenthera.entity.Usuario;
import com.zenthera.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository
                .findByCorreoAndActivoTrue(correo)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado"));

        if (!usuario.getClinica().getActiva()) {
            throw new org.springframework.security.authentication.DisabledException("La clínica está inactiva");
        }

        return new CustomUserDetails(usuario);
    }
}
