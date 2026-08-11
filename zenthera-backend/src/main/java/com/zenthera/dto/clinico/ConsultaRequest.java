package com.zenthera.dto.clinico;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaRequest {

    private String motivoConsulta;

    private String sintomasObservaciones;

    @Valid
    private SignosVitalesDto signosVitales;

    private String diagnosticoInicial;

    private String tratamientoIndicaciones;

    private String notas;
}
