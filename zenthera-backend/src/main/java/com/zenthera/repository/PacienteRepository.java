package com.zenthera.repository;

import com.zenthera.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByClinicaIdAndCedula(Long clinicaId, String cedula);

    boolean existsByClinicaIdAndCedula(Long clinicaId, String cedula);

    Page<Paciente> findByActivoTrue(Pageable pageable);

    List<Paciente> findByActivoTrue();

    boolean existsByClinicaIdAndCedulaAndActivoTrue(Long clinicaId, String cedula);

    @Query("""
                SELECT p
                FROM Paciente p
                WHERE p.activo = true
                  AND (
                        LOWER(p.cedula) LIKE LOWER(CONCAT('%', :buscar, '%'))
                     OR LOWER(p.nombres) LIKE LOWER(CONCAT('%', :buscar, '%'))
                     OR LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :buscar, '%'))
                  )
            """)
    List<Paciente> buscarPacientes(@Param("buscar") String buscar);
}