package com.zenthera.service;

import com.zenthera.dto.rol.RolResponse;
import java.util.List;

public interface ClinicaRolService {
    List<RolResponse> listarRolesAsignables();
}
