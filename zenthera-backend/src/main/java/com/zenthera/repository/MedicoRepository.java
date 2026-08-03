package com.zenthera.repository;

import com.zenthera.entity.Medico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicoRepository extends JpaRepository<Medico, Long> {

    List<Medico> findByActivoTrue();
    List<Medico> findByClinicaIdAndActivoTrue(Long clinicaId);

    Page<Medico> findByActivoTrue(Pageable pageable);
    Page<Medico> findByClinicaIdAndActivoTrue(Long clinicaId, Pageable pageable);

    boolean existsByClinicaIdAndCedulaAndActivoTrue(Long clinicaId, String cedula);

    boolean existsByClinicaIdAndCedulaAndActivoTrueAndIdNot(Long clinicaId, String cedula, Long id);

    Optional<Medico> findByClinicaIdAndCedulaAndActivoTrue(Long clinicaId, String cedula);

    @Query("""
            SELECT m
            FROM Medico m
            WHERE m.clinica.id = :clinicaId
              AND (:activo IS NULL OR m.activo = :activo)
              AND (:especialidad IS NULL OR m.especialidad = :especialidad)
              AND (
                 :buscar IS NULL OR :buscar = '' OR
                 LOWER(m.cedula) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.nombres) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.apellidos) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.especialidad) LIKE LOWER(CONCAT('%', :buscar, '%'))
              )
            """)
    Page<Medico> buscarMedicosPaginado(
            @Param("clinicaId") Long clinicaId,
            @Param("buscar") String buscar,
            @Param("activo") Boolean activo,
            @Param("especialidad") String especialidad,
            Pageable pageable);

    @Query("""
            SELECT m
            FROM Medico m
            WHERE m.clinica.id = :clinicaId
              AND m.activo = true
              AND (
                 :buscar IS NULL OR :buscar = '' OR
                 LOWER(m.cedula) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.nombres) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.apellidos) LIKE LOWER(CONCAT('%', :buscar, '%'))
                 OR LOWER(m.especialidad) LIKE LOWER(CONCAT('%', :buscar, '%'))
              )
            """)
    List<Medico> buscarMedicos(@Param("clinicaId") Long clinicaId, @Param("buscar") String buscar);

    Optional<Medico> findByIdAndClinicaIdAndActivoTrue(Long id, Long clinicaId);

    Optional<Medico> findByIdAndClinicaId(Long id, Long clinicaId);

}
