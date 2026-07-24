package com.zenthera.repository;

import com.zenthera.entity.AuditoriaEstadoClinica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditoriaEstadoClinicaRepository extends JpaRepository<AuditoriaEstadoClinica, Long> {

    Page<AuditoriaEstadoClinica> findByClinicaId(Long clinicaId, Pageable pageable);

}
