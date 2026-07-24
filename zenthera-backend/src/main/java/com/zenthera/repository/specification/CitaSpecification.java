package com.zenthera.repository.specification;

import com.zenthera.entity.Cita;
import com.zenthera.entity.EstadoCita;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class CitaSpecification {

    public static Specification<Cita> buildFilter(Long clinicaId, Long pacienteId, Long medicoId, EstadoCita estado, Instant fechaDesde, Instant fechaHasta, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Siempre filtrar por clinicaId
            predicates.add(cb.equal(root.get("clinica").get("id"), clinicaId));

            if (pacienteId != null) {
                predicates.add(cb.equal(root.get("paciente").get("id"), pacienteId));
            }

            if (medicoId != null) {
                predicates.add(cb.equal(root.get("medico").get("id"), medicoId));
            }

            if (estado != null) {
                predicates.add(cb.equal(root.get("estado"), estado));
            }

            if (fechaDesde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaHoraInicio"), fechaDesde));
            }

            if (fechaHasta != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaHoraInicio"), fechaHasta));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";

                Predicate motivo = cb.like(cb.lower(root.get("motivo")), pattern);
                Predicate pacienteNombres = cb.like(cb.lower(root.get("paciente").get("nombres")), pattern);
                Predicate pacienteApellidos = cb.like(cb.lower(root.get("paciente").get("apellidos")), pattern);
                Predicate pacienteCedula = cb.like(cb.lower(root.get("paciente").get("cedula")), pattern);
                Predicate medicoNombres = cb.like(cb.lower(root.get("medico").get("nombres")), pattern);
                Predicate medicoApellidos = cb.like(cb.lower(root.get("medico").get("apellidos")), pattern);
                Predicate medicoCedula = cb.like(cb.lower(root.get("medico").get("cedula")), pattern);

                predicates.add(cb.or(motivo, pacienteNombres, pacienteApellidos, pacienteCedula, medicoNombres, medicoApellidos, medicoCedula));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
