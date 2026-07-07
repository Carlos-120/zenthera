package com.zenthera.mapper;

import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;
import com.zenthera.entity.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "clinica", ignore = true)
    @Mapping(target = "rol", ignore = true)
    @Mapping(target = "activo", constant = "true")
    @Mapping(target = "bloqueado", constant = "false")
    @Mapping(target = "cambiarPassword", constant = "false")
    @Mapping(target = "ultimoLogin", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Usuario toEntity(UsuarioRequest request);

    @Mapping(source = "clinica.id", target = "clinicaId")
    @Mapping(source = "clinica.nombre", target = "nombreClinica")
    @Mapping(source = "rol.id", target = "rolId")
    @Mapping(source = "rol.nombre", target = "nombreRol")
    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarios);
}