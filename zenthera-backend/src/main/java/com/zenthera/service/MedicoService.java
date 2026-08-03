package com.zenthera.service;

import com.zenthera.dto.common.PageResponse;
import com.zenthera.dto.medico.MedicoListResponse;
import com.zenthera.dto.medico.MedicoRequest;
import com.zenthera.dto.medico.MedicoResponse;

import java.util.List;

public interface MedicoService {

    MedicoResponse crear(MedicoRequest request);

    MedicoResponse obtenerPorId(Long id);

    List<MedicoListResponse> listar();

    PageResponse<MedicoListResponse> listar(int page, int size, String buscar, Boolean activo);

    List<MedicoListResponse> buscar(String buscar);

    MedicoResponse actualizar(Long id, MedicoRequest request);

    MedicoResponse cambiarEstado(Long id, Boolean activo);

    void eliminar(Long id);

}
