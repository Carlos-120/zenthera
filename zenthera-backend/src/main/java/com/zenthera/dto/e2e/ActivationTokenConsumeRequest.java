package com.zenthera.dto.e2e;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ActivationTokenConsumeRequest(
        @NotBlank(message = "El correo del administrador es obligatorio")
        @Email(message = "El correo del administrador no es válido")
        String adminCorreo) {
}
