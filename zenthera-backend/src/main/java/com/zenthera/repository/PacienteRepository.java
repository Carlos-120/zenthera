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

    Optional<Paciente> findByIdAndClinicaId(Long id, Long clinicaId);

    Optional<Paciente> findByClinicaIdAndCedula(Long clinicaId, String cedula);

    boolean existsByClinicaIdAndCedula(Long clinicaId, String cedula);

    Page<Paciente> findByClinicaIdAndActivoTrue(Long clinicaId, Pageable pageable);

    List<Paciente> findByClinicaIdAndActivoTrue(Long clinicaId);

    boolean existsByClinicaIdAndCedulaAndActivoTrue(Long clinicaId, String cedula);

    @Query("""
                SELECT p
                FROM Paciente p
                WHERE p.clinica.id = :clinicaId
                  AND p.activo = true
                  AND (
                        LOWER(p.cedula) LIKE LOWER(CONCAT('%', :buscar, '%'))
                     OR LOWER(p.nombres) LIKE LOWER(CONCAT('%', :buscar, '%'))
                     OR LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :buscar, '%'))
                  )
            """)
    List<Paciente> buscarPacientesPorClinica(@Param("clinicaId") Long clinicaId, @Param("buscar") String buscar);
    Optional<Paciente> findByIdAndClinicaIdAndActivoTrue(Long id, Long clinicaId);

}
