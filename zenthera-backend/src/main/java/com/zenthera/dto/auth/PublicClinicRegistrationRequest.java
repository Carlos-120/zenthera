package com.zenthera.dto.auth;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicClinicRegistrationRequest {

    @NotBlank(message = "El nombre de la clínica es obligatorio")
    private String nombre;

    @NotBlank(message = "Los nombres del administrador son obligatorios")
    private String adminNombres;

    @NotBlank(message = "Los apellidos del administrador son obligatorios")
    private String adminApellidos;

    @NotBlank(message = "El correo del administrador es obligatorio")
    @Email(message = "Correo del administrador inválido")
    private String adminCorreo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String password;

    @NotNull(message = "Debe aceptar los términos y condiciones")
    @AssertTrue(message = "Debe aceptar explícitamente los términos y condiciones")
    private Boolean terminosAceptados;

    public void setAdminCorreo(String adminCorreo) {
        this.adminCorreo = trim(adminCorreo);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
