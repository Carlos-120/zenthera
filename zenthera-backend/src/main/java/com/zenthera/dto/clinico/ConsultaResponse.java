package com.zenthera.dto.clinico;

import com.zenthera.enums.EstadoConsulta;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.lang.Long;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaResponse {
    private Long id;
    private Long historiaClinicaId;
    private Long medicoId;
    private String medicoNombres;
    private String medicoApellidos;
    private EstadoConsulta estado;

    private String motivoConsulta;
    private String sintomasObservaciones;

    private SignosVitalesDto signosVitales;

    private String diagnosticoInicial;
    private String tratamientoIndicaciones;
    private String notas;

    private LocalDateTime finalizadaAt;
    private Long finalizadaPor;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
