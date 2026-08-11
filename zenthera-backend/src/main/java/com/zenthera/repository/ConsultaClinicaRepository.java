package com.zenthera.repository;

import com.zenthera.entity.ConsultaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.lang.Long;

@Repository
public interface ConsultaClinicaRepository extends JpaRepository<ConsultaClinica, Long> {
    Optional<ConsultaClinica> findByIdAndClinicaId(Long id, Long clinicaId);
    List<ConsultaClinica> findByHistoriaClinicaIdAndClinicaIdOrderByCreatedAtDesc(Long historiaClinicaId, Long clinicaId);
}
