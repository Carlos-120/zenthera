package com.zenthera.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClinicaRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150)
    private String nombre;

    @Size(max = 13)
    private String ruc;

    @Size(max = 20)
    private String telefono;

    @Email(message = "Correo inválido")
    private String correo;

    private String direccion;

    private String ciudad;

    private String provincia;

    private String pais;

    private String logo;

    private Boolean activa;
}
