package com.zenthera.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clinicas", uniqueConstraints = {
    @UniqueConstraint(name = "uk_clinica_ruc", columnNames = "ruc")
})
public class Clinica extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 13)
    private String ruc;

    @Column(length = 20)
    private String telefono;

    @Column(length = 120)
    private String correo;

    @Column(columnDefinition = "TEXT")
    private String direccion;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 100)
    private String provincia;

    @Column(length = 80)
    private String pais;

    @Column(length = 255)
    private String logo;

    @Column(name = "razon_social", length = 150)
    private String razonSocial;

    @Column(name = "zona_horaria", nullable = false, length = 50)
    private String zonaHoraria = "America/Guayaquil";

    @Column(nullable = false)
    private Boolean activa = true;

    @Column(name = "terminos_aceptados")
    private Boolean terminosAceptados = false;

    @Column(name = "terminos_aceptados_en")
    private java.time.Instant terminosAceptadosEn;

    @Column(name = "terminos_version", length = 50)
    private String terminosVersion;

    @Column(name = "onboarding_completado", nullable = false)
    private Boolean onboardingCompletado = false;

    @Column(name = "onboarding_completado_en")
    private java.time.Instant onboardingCompletadoEn;
}
