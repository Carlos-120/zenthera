package com.zenthera.dto.clinica;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicaCreateRequest {

    @NotBlank(message = "El RUC es obligatorio")
    private String ruc;

    @NotBlank(message = "La razón social es obligatoria")
    private String razonSocial;

    @NotBlank(message = "El nombre comercial es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo administrativo es obligatorio")
    private String correo;

    @NotBlank(message = "El teléfono es obligatorio")
    private String telefono;

    // Datos del primer administrador
    @NotBlank(message = "Los nombres del administrador son obligatorios")
    private String adminNombres;

    @NotBlank(message = "Los apellidos del administrador son obligatorios")
    private String adminApellidos;

    @NotBlank(message = "La cédula del administrador es obligatoria")
    private String adminCedula;

    @NotBlank(message = "El correo del administrador es obligatorio")
    private String adminCorreo;
}
