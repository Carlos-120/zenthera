package com.zenthera.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clinicas")
public class Clinica extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 13, unique = true)
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

    @Column(nullable = false)
    private Boolean activa = true;
}