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
    @Mapping(source = "usuario.id", target = "usuarioId")
    @Mapping(source = "usuario.correo", target = "correoUsuario")
    MedicoResponse toResponse(Medico medico);

    @Mapping(source = "clinica.id", target = "clinicaId")
    @Mapping(source = "clinica.nombre", target = "nombreClinica")
    @Mapping(source = "usuario.id", target = "usuarioId")
    @Mapping(source = "usuario.correo", target = "correoUsuario")
    MedicoListResponse toListResponse(Medico medico);

    List<MedicoListResponse> toListResponse(List<Medico> medicos);

    @org.mapstruct.AfterMapping
    default void mapEstadoCuenta(Medico medico, @org.mapstruct.MappingTarget MedicoResponse response) {
        if (medico.getUsuario() == null) {
            response.setEstadoCuenta("SIN_CUENTA");
        } else if (!Boolean.TRUE.equals(medico.getUsuario().getActivo())) {
            response.setEstadoCuenta("INACTIVA");
        } else if (Boolean.TRUE.equals(medico.getUsuario().getCambiarPassword())) {
            response.setEstadoCuenta("CAMBIO_PASSWORD_REQUERIDO");
        } else {
            response.setEstadoCuenta("ACTIVA");
        }
    }
}
