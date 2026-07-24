package com.zenthera.dto.clinica;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicaUpdateRequest {

    @NotBlank(message = "El nombre comercial no puede estar vacío")
    private String nombre;

    private String logo;

    @NotBlank(message = "El teléfono no puede estar vacío")
    private String telefono;

    @NotBlank(message = "El correo no puede estar vacío")
    private String correo;

    @NotBlank(message = "La dirección no puede estar vacía")
    private String direccion;

    private String ciudad;
    private String provincia;
    private String pais;

    @NotBlank(message = "La zona horaria no puede estar vacía")

    private String zonaHoraria;
}
