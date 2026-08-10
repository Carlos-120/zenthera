package com.zenthera.dto.medico;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioMedicoLinkRequest {
    
    @NotNull(message = "El id del usuario es obligatorio")
    private Long usuarioId;

}
