package com.zenthera.repository;

import com.zenthera.entity.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreo(String correo);

    @Query("select u from Usuario u where lower(trim(u.correo)) = :correo")
    Optional<Usuario> findByCorreoNormalized(@Param("correo") String correo);

    @EntityGraph(attributePaths = {"rol", "clinica"})
    Optional<Usuario> findByCorreoAndActivoTrue(String correo);

    Optional<Usuario> findByCedula(String cedula);

    boolean existsByCorreo(String correo);

    boolean existsByCedula(String cedula);
}
