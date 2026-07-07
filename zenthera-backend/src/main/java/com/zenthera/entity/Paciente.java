package com.zenthera.entity;

import com.zenthera.enums.Sexo;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(
    name = "pacientes",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_paciente_clinica_cedula",
            columnNames = {"clinica_id", "cedula"}
        )
    }
)
public class Paciente extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id", nullable = false)
    private Clinica clinica;

    @Column(nullable = false, length = 13)
    private String cedula;

    @Column(nullable = false, length = 80)
    private String nombres;

    @Column(nullable = false, length = 80)
    private String apellidos;

    @Column(nullable = false)
    private LocalDate fechaNacimiento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sexo sexo;

    @Column(length = 20)
    private String telefono;

    @Column(length = 120)
    private String correo;

    @Column(length = 255)
    private String direccion;

    @Column(length = 5)
    private String tipoSangre;

    @Column(columnDefinition = "TEXT")
    private String alergias;

    @Column(length = 120)
    private String contactoEmergencia;

    @Column(length = 20)
    private String telefonoEmergencia;

    @Column(nullable = false)
    private Boolean activo = true;
}