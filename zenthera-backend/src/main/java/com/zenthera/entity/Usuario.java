package com.zenthera.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "usuarios", uniqueConstraints = {
    @UniqueConstraint(name = "uk_usuario_correo", columnNames = "correo"),
    @UniqueConstraint(name = "uk_usuario_cedula", columnNames = "cedula")
})
public class Usuario extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinica_id", nullable = false)
    private Clinica clinica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rol_id", nullable = false)
    private Rol rol;

    @Column(nullable = false, length = 120)
    private String nombres;

    @Column(nullable = false, length = 120)
    private String apellidos;

    @Column(length = 20)
    private String cedula;

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false, length = 120)
    private String correo;

    @Column(nullable = false)
    private String password;

    @Column(length = 255)
    private String foto;

    @Column(nullable = false)
    private Boolean activo = true;

    private LocalDateTime ultimoLogin;

    @Column(nullable = false)
    private Boolean bloqueado = false;

    @Column(nullable = false)
    private Boolean cambiarPassword = false;
}
