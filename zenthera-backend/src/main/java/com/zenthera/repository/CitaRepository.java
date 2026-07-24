package com.zenthera.repository;

import com.zenthera.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long>, JpaSpecificationExecutor<Cita> {

    Optional<Cita> findByIdAndClinicaId(Long id, Long clinicaId);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Cita c " +
        "WHERE c.medico.id = :medicoId AND c.clinica.id = :clinicaId " +
        "AND c.estado != com.zenthera.entity.EstadoCita.CANCELADA " +
        "AND (:excludeCitaId IS NULL OR c.id != :excludeCitaId) " +
        "AND :inicio < c.fechaHoraFin AND :fin > c.fechaHoraInicio"
    )
    boolean existsOverlapByMedicoIdAndTenant(
            @org.springframework.data.repository.query.Param("medicoId") Long medicoId,
            @org.springframework.data.repository.query.Param("clinicaId") Long clinicaId,
            @org.springframework.data.repository.query.Param("inicio") java.time.Instant inicio,
            @org.springframework.data.repository.query.Param("fin") java.time.Instant fin,
            @org.springframework.data.repository.query.Param("excludeCitaId") Long excludeCitaId
    );

    @org.springframework.data.jpa.repository.Query(
        "SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Cita c " +
        "WHERE c.paciente.id = :pacienteId AND c.clinica.id = :clinicaId " +
        "AND c.estado != com.zenthera.entity.EstadoCita.CANCELADA " +
        "AND (:excludeCitaId IS NULL OR c.id != :excludeCitaId) " +
        "AND :inicio < c.fechaHoraFin AND :fin > c.fechaHoraInicio"
    )
    boolean existsOverlapByPacienteIdAndTenant(
            @org.springframework.data.repository.query.Param("pacienteId") Long pacienteId,
            @org.springframework.data.repository.query.Param("clinicaId") Long clinicaId,
            @org.springframework.data.repository.query.Param("inicio") java.time.Instant inicio,
            @org.springframework.data.repository.query.Param("fin") java.time.Instant fin,
            @org.springframework.data.repository.query.Param("excludeCitaId") Long excludeCitaId
    );

}
