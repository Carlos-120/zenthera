package com.zenthera.entity;

import com.zenthera.enums.EstadoConsulta;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.lang.Long;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "consulta_clinica")
public class ConsultaClinica extends BaseEntity {

    @Column(name = "historia_clinica_id", nullable = false)
    private Long historiaClinicaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "historia_clinica_id", insertable = false, updatable = false)
    private HistoriaClinica historiaClinica;

    @Column(name = "clinica_id", nullable = false)
    private Long clinicaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id", insertable = false, updatable = false)
    private Clinica clinica;

    @Column(name = "medico_id", nullable = false)
    private Long medicoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medico_id", insertable = false, updatable = false)
    private Medico medico;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoConsulta estado;

    @Column(name = "motivo_consulta", columnDefinition = "TEXT")
    private String motivoConsulta;

    @Column(name = "sintomas_observaciones", columnDefinition = "TEXT")
    private String sintomasObservaciones;

    private BigDecimal peso;
    private BigDecimal talla;

    @Column(name = "presion_sistolica")
    private Integer presionSistolica;

    @Column(name = "presion_diastolica")
    private Integer presionDiastolica;

    @Column(name = "frecuencia_cardiaca")
    private Integer frecuenciaCardiaca;

    private BigDecimal temperatura;

    @Column(name = "saturacion_oxigeno")
    private Integer saturacionOxigeno;

    @Column(name = "diagnostico_inicial", columnDefinition = "TEXT")
    private String diagnosticoInicial;

    @Column(name = "tratamiento_indicaciones", columnDefinition = "TEXT")
    private String tratamientoIndicaciones;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "finalizada_at")
    private LocalDateTime finalizadaAt;

    @Column(name = "finalizada_por")
    private Long finalizadaPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalizada_por", insertable = false, updatable = false)
    private Usuario usuarioFinalizador;
}
