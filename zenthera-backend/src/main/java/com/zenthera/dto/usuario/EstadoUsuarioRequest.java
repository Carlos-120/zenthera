package com.zenthera.dto.usuario;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EstadoUsuarioRequest {

    @NotNull
    private Boolean activo;

}
