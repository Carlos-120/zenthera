package com.zenthera.mapper;

import com.zenthera.dto.medico.MedicoListResponse;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.medico.MedicoResponse;
import com.zenthera.entity.Medico;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MedicoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinica", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Medico toEntity(MedicoRequest request);

    @Mapping(source = "clinica.id", target = "clinicaId")
    @Mapping(source = "clinica.nombre", target = "nombreClinica")
    MedicoResponse toResponse(Medico medico);

    @Mapping(source = "clinica.id", target = "clinicaId")
    @Mapping(source = "clinica.nombre", target = "nombreClinica")
    MedicoListResponse toListResponse(Medico medico);

    List<MedicoListResponse> toListResponse(List<Medico> medicos);

}
