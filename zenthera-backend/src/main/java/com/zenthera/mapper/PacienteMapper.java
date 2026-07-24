package com.zenthera.mapper;

import com.zenthera.dto.paciente.PacienteListResponse;
import com.zenthera.dto.paciente.PacienteRequest;
import com.zenthera.dto.paciente.PacienteResponse;
import com.zenthera.entity.Paciente;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PacienteMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinica", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Paciente toEntity(PacienteRequest request);

    @Mapping(source = "clinica.id", target = "clinicaId")
    @Mapping(source = "clinica.nombre", target = "nombreClinica")
    PacienteResponse toResponse(Paciente paciente);

    PacienteListResponse toListResponse(Paciente paciente);

    List<PacienteListResponse> toListResponse(List<Paciente> pacientes);

}
