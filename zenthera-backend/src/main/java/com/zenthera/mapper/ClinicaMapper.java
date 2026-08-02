package com.zenthera.mapper;

import com.zenthera.dto.clinica.ClinicaRequest;
import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.entity.Clinica;

public class ClinicaMapper {

    private ClinicaMapper() {
    }

    public static Clinica toEntity(ClinicaRequest request) {

        Clinica clinica = new Clinica();

        clinica.setNombre(request.getNombre());
        clinica.setRazonSocial(request.getNombre()); // Por defecto
        clinica.setRuc(request.getRuc());
        clinica.setTelefono(request.getTelefono());
        clinica.setCorreo(request.getCorreo());
        clinica.setDireccion(request.getDireccion());
        clinica.setCiudad(request.getCiudad());
        clinica.setProvincia(request.getProvincia());
        clinica.setPais(request.getPais());
        clinica.setLogo(request.getLogo());
        if (request.getActiva() != null) {
            clinica.setActiva(request.getActiva());
        }

        return clinica;
    }

    public static ClinicaResponse toResponse(Clinica clinica) {

        ClinicaResponse response = new ClinicaResponse();

        response.setId(clinica.getId());
        response.setNombre(clinica.getNombre());
        response.setRazonSocial(clinica.getRazonSocial());
        response.setRuc(clinica.getRuc());
        response.setTelefono(clinica.getTelefono());
        response.setCorreo(clinica.getCorreo());
        response.setDireccion(clinica.getDireccion());
        response.setCiudad(clinica.getCiudad());
        response.setProvincia(clinica.getProvincia());
        response.setPais(clinica.getPais());
        response.setZonaHoraria(clinica.getZonaHoraria());
        response.setLogo(clinica.getLogo());
        response.setActiva(clinica.getActiva());
        response.setOnboardingCompletado(clinica.getOnboardingCompletado());
        response.setOnboardingCompletadoEn(clinica.getOnboardingCompletadoEn());

        return response;
    }
}
