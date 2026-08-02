package com.zenthera.security.user;

import com.zenthera.entity.Usuario;
import lombok.Getter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class CustomUserDetails implements UserDetails {

    private final Usuario usuario;

    public CustomUserDetails(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends SimpleGrantedAuthority> getAuthorities() {
        return List.of(
            new SimpleGrantedAuthority(usuario.getRol().getNombre().name())        );
    }

    @Override
    public String getPassword() {
        return usuario.getPassword();
    }

    @Override
    public String getUsername() {
        return usuario.getCorreo();
    }

    @Override
    public boolean isAccountNonLocked() {
        return !usuario.getBloqueado();
    }

    @Override
    public boolean isEnabled() {
        if (!usuario.getActivo()) {
            return false;
        }
        if (com.zenthera.enums.RolNombre.SUPER_ADMIN.equals(usuario.getRol().getNombre())) {
            return true;
        }
        return usuario.getClinica() != null && usuario.getClinica().getActiva();
    }
}
