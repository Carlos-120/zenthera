package com.zenthera.service;

import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;

import java.util.List;

import com.zenthera.dto.common.PageResponse;
import org.springframework.data.domain.Pageable;

public interface UsuarioService {

    UsuarioResponse guardar(Long clinicaId, UsuarioRequest request);

    PageResponse<UsuarioResponse> listar(Long clinicaId, String search, Boolean activo, Long rolId, Pageable pageable);

    UsuarioResponse buscarPorId(Long id, Long clinicaId);

    UsuarioResponse actualizar(Long id, Long clinicaId, UsuarioRequest request);

    UsuarioResponse actualizarEstado(Long id, Long clinicaId, boolean activo);

    java.util.List<com.zenthera.dto.usuario.UsuarioDisponibleResponse> getUsuariosMedicosDisponibles(Long clinicaId);
}
