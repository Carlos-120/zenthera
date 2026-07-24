package com.zenthera.repository;
import java.util.Optional;
import com.zenthera.entity.Clinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClinicaRepository extends JpaRepository<Clinica, Long> {
Optional<Clinica> findByRuc(String ruc);
Optional<Clinica> findByNombre(String nombre);
org.springframework.data.domain.Page<Clinica> findByNombreContainingIgnoreCaseOrRucContaining(String nombre, String ruc, org.springframework.data.domain.Pageable pageable);
}
