package com.zenthera.repository;

import com.zenthera.entity.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.lang.Long;

@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, Long> {
    Optional<HistoriaClinica> findByPacienteIdAndClinicaId(Long pacienteId, Long clinicaId);
}
