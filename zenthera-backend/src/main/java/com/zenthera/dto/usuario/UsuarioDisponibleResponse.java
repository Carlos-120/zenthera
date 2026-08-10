package com.zenthera.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDisponibleResponse {
    
    private Long id;
    
    private String nombres;
    
    private String apellidos;
    
    private String correo;
    
    private String cedula;
    
}
