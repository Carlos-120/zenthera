package com.zenthera.repository;

import com.zenthera.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByClinicaIdAndCedula(Long clinicaId, String cedula);

    boolean existsByClinicaIdAndCedula(Long clinicaId, String cedula);

}