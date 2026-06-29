package com.zenthera.mapper;

import com.zenthera.dto.request.ClinicaRequest;
import com.zenthera.dto.response.ClinicaResponse;
import com.zenthera.entity.Clinica;

public class ClinicaMapper {

    private ClinicaMapper() {
    }

    public static Clinica toEntity(ClinicaRequest request) {

        Clinica clinica = new Clinica();

        clinica.setNombre(request.getNombre());
        clinica.setRuc(request.getRuc());
        clinica.setTelefono(request.getTelefono());
        clinica.setCorreo(request.getCorreo());
        clinica.setDireccion(request.getDireccion());
        clinica.setCiudad(request.getCiudad());
        clinica.setProvincia(request.getProvincia());
        clinica.setPais(request.getPais());
        clinica.setLogo(request.getLogo());
        clinica.setActiva(request.getActiva());

        return clinica;
    }

    public static ClinicaResponse toResponse(Clinica clinica) {

        ClinicaResponse response = new ClinicaResponse();

        response.setId(clinica.getId());
        response.setNombre(clinica.getNombre());
        response.setRuc(clinica.getRuc());
        response.setTelefono(clinica.getTelefono());
        response.setCorreo(clinica.getCorreo());
        response.setCiudad(clinica.getCiudad());
        response.setActiva(clinica.getActiva());

        return response;
    }
}