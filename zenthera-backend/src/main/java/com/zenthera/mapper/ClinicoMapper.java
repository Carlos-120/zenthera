package com.zenthera.mapper;

import com.zenthera.dto.clinico.ConsultaRequest;
import com.zenthera.dto.clinico.ConsultaResponse;
import com.zenthera.dto.clinico.HistoriaClinicaResponse;
import com.zenthera.dto.clinico.SignosVitalesDto;
import com.zenthera.entity.ConsultaClinica;
import com.zenthera.entity.HistoriaClinica;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ClinicoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "historiaClinicaId", ignore = true)
    @Mapping(target = "historiaClinica", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "clinica", ignore = true)
    @Mapping(target = "medicoId", ignore = true)
    @Mapping(target = "medico", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "peso", source = "signosVitales.peso")
    @Mapping(target = "talla", source = "signosVitales.talla")
    @Mapping(target = "presionSistolica", source = "signosVitales.presionSistolica")
    @Mapping(target = "presionDiastolica", source = "signosVitales.presionDiastolica")
    @Mapping(target = "frecuenciaCardiaca", source = "signosVitales.frecuenciaCardiaca")
    @Mapping(target = "temperatura", source = "signosVitales.temperatura")
    @Mapping(target = "saturacionOxigeno", source = "signosVitales.saturacionOxigeno")
    @Mapping(target = "finalizadaAt", ignore = true)
    @Mapping(target = "finalizadaPor", ignore = true)
    @Mapping(target = "usuarioFinalizador", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ConsultaClinica toEntity(ConsultaRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "historiaClinicaId", ignore = true)
    @Mapping(target = "historiaClinica", ignore = true)
    @Mapping(target = "clinicaId", ignore = true)
    @Mapping(target = "clinica", ignore = true)
    @Mapping(target = "medicoId", ignore = true)
    @Mapping(target = "medico", ignore = true)
    @Mapping(target = "estado", ignore = true)
    @Mapping(target = "peso", source = "signosVitales.peso")
    @Mapping(target = "talla", source = "signosVitales.talla")
    @Mapping(target = "presionSistolica", source = "signosVitales.presionSistolica")
    @Mapping(target = "presionDiastolica", source = "signosVitales.presionDiastolica")
    @Mapping(target = "frecuenciaCardiaca", source = "signosVitales.frecuenciaCardiaca")
    @Mapping(target = "temperatura", source = "signosVitales.temperatura")
    @Mapping(target = "saturacionOxigeno", source = "signosVitales.saturacionOxigeno")
    @Mapping(target = "finalizadaAt", ignore = true)
    @Mapping(target = "finalizadaPor", ignore = true)
    @Mapping(target = "usuarioFinalizador", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ConsultaRequest request, @MappingTarget ConsultaClinica consulta);

    @Mapping(target = "signosVitales", expression = "java(toSignosVitalesDto(consulta))")
    @Mapping(source = "medico.nombres", target = "medicoNombres")
    @Mapping(source = "medico.apellidos", target = "medicoApellidos")
    ConsultaResponse toResponse(ConsultaClinica consulta);

    @Mapping(target = "consultas", ignore = true)
    HistoriaClinicaResponse toResponse(HistoriaClinica historia);

    default SignosVitalesDto toSignosVitalesDto(ConsultaClinica consulta) {
        if (consulta == null) return null;

        boolean hasSignos = consulta.getPeso() != null ||
                            consulta.getTalla() != null ||
                            consulta.getPresionSistolica() != null ||
                            consulta.getPresionDiastolica() != null ||
                            consulta.getFrecuenciaCardiaca() != null ||
                            consulta.getTemperatura() != null ||
                            consulta.getSaturacionOxigeno() != null;

        if (!hasSignos) return null;

        SignosVitalesDto dto = new SignosVitalesDto();
        dto.setPeso(consulta.getPeso());
        dto.setTalla(consulta.getTalla());
        dto.setPresionSistolica(consulta.getPresionSistolica());
        dto.setPresionDiastolica(consulta.getPresionDiastolica());
        dto.setFrecuenciaCardiaca(consulta.getFrecuenciaCardiaca());
        dto.setTemperatura(consulta.getTemperatura());
        dto.setSaturacionOxigeno(consulta.getSaturacionOxigeno());
        return dto;
    }
}
