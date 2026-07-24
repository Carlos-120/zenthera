package com.zenthera.repository;

import com.zenthera.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.QueryHints;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @EntityGraph(attributePaths = {"usuario", "usuario.clinica", "usuario.rol"})
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @EntityGraph(attributePaths = {"usuario", "usuario.clinica", "usuario.rol"})
    @Query("SELECT r FROM RefreshToken r WHERE r.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE RefreshToken r SET r.revocado = true WHERE r.familiaId = :familiaId")
    void revokeAllByFamiliaId(@Param("familiaId") String familiaId);

    @Transactional
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revocado = true WHERE r.usuario.clinica.id = :clinicaId AND r.revocado = false")
    void revokeByClinicaId(@Param("clinicaId") Long clinicaId);
}
