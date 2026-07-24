package com.zenthera.entity;

import com.zenthera.enums.RolNombre;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "roles")
public class Rol extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private RolNombre nombre;

    @Column(length = 255)
    private String descripcion;
}
