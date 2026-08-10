package com.zenthera.repository;

import com.zenthera.entity.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long>, JpaSpecificationExecutor<Usuario> {

    Optional<Usuario> findByCorreo(String correo);

    @Query("select u from Usuario u where lower(trim(u.correo)) = :correo")
    Optional<Usuario> findByCorreoNormalized(@Param("correo") String correo);

    @EntityGraph(attributePaths = {"rol", "clinica"})
    Optional<Usuario> findByCorreoAndActivoTrue(String correo);

    Optional<Usuario> findByCedula(String cedula);

    boolean existsByCorreo(String correo);

    boolean existsByCedula(String cedula);

    Optional<Usuario> findByIdAndClinicaId(Long id, Long clinicaId);

    boolean existsByCorreoAndClinicaId(String correo, Long clinicaId);

    boolean existsByCedulaAndClinicaId(String cedula, Long clinicaId);

    @Query("SELECT u FROM Usuario u WHERE u.clinica.id = :clinicaId AND u.rol.nombre = 'MEDICO' AND u.activo = true AND NOT EXISTS (SELECT 1 FROM Medico m WHERE m.usuario = u)")
    java.util.List<Usuario> findUsuariosMedicosDisponibles(@Param("clinicaId") Long clinicaId);
}
