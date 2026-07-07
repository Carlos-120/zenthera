package com.zenthera.repository;

import com.zenthera.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByCorreoAndActivoTrue(String correo);

    Optional<Usuario> findByCedula(String cedula);

    boolean existsByCorreo(String correo);

    boolean existsByCedula(String cedula);
}