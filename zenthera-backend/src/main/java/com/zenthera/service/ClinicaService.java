package com.zenthera.service;

import com.zenthera.dto.clinica.ClinicaCreateRequest;
import com.zenthera.dto.clinica.ClinicaEstadoRequest;
import com.zenthera.dto.clinica.ClinicaResponse;
import com.zenthera.dto.clinica.ClinicaUpdateRequest;
import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.auth.PublicClinicRegistrationRequest;
import com.zenthera.dto.auth.PublicClinicRegistrationResponse;
import org.springframework.data.domain.Pageable;

public interface ClinicaService {

    // Para ADMIN_CLINICA
    ClinicaResponse getMiClinica(Long clinicaId);
    ClinicaResponse updateMiClinica(Long clinicaId, ClinicaUpdateRequest request);

    // Para SUPER_ADMIN
    ClinicaResponse createClinica(ClinicaCreateRequest request);
    PublicClinicRegistrationResponse registerPublicClinic(PublicClinicRegistrationRequest request);
    ClinicaResponse updateEstadoClinica(Long clinicaId, ClinicaEstadoRequest request, Long adminId);
    PageResponse<ClinicaResponse> getAllClinicas(String search, Pageable pageable);
}
