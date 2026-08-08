package com.zenthera.service.impl;

import com.zenthera.dto.rol.RolResponse;
import com.zenthera.enums.RolNombre;
import com.zenthera.repository.RolRepository;
import com.zenthera.service.ClinicaRolService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClinicaRolServiceImpl implements ClinicaRolService {

    private final RolRepository rolRepository;

    public ClinicaRolServiceImpl(RolRepository rolRepository) {
        this.rolRepository = rolRepository;
    }

    @Override
    public List<RolResponse> listarRolesAsignables() {
        return rolRepository.findByNombreNotIn(List.of(RolNombre.SUPER_ADMIN, RolNombre.ADMIN_CLINICA))
                .stream()
                .map(rol -> new RolResponse(rol.getId(), rol.getNombre().name()))
                .toList();
    }
}
