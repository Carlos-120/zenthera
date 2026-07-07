package com.zenthera.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioRequest {

    @NotNull
    private Long clinicaId;

    @NotNull
    private Long rolId;

    @NotBlank
    private String nombres;

    @NotBlank
    private String apellidos;

    @NotBlank
    private String cedula;

    private String telefono;

    @Email
    @NotBlank
    private String correo;

    @NotBlank
    private String password;

    private String foto;
}