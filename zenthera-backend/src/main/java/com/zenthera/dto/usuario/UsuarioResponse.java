package com.zenthera.dto.usuario;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UsuarioResponse {

    private Long id;

    private Long clinicaId;
    private String nombreClinica;

    private Long rolId;
    private String nombreRol;

    private String nombres;
    private String apellidos;
    private String cedula;
    private String telefono;
    private String correo;
    private String foto;

    private Boolean activo;
    private Boolean bloqueado;
    private Boolean cambiarPassword;

    private LocalDateTime ultimoLogin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
