package com.zenthera.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CambiarPasswordRequest {

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String newPassword;

    @NotBlank(message = "Debe confirmar la contraseña")
    @Size(min = 12, max = 72, message = "La contraseña debe tener entre 12 y 72 caracteres")
    private String confirmPassword;
}
