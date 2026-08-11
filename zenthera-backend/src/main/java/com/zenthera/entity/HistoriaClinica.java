package com.zenthera.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.lang.Long;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "historia_clinica", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"clinica_id", "paciente_id"})
})
public class HistoriaClinica extends BaseEntity {

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id", insertable = false, updatable = false)
    private Clinica clinica;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", insertable = false, updatable = false)
    private Paciente paciente;
}
