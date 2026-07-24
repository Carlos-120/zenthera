package com.zenthera.service;

import com.zenthera.dto.usuario.UsuarioRequest;
import com.zenthera.dto.usuario.UsuarioResponse;

import java.util.List;

public interface UsuarioService {

    UsuarioResponse guardar(UsuarioRequest request);

    List<UsuarioResponse> listar();

    UsuarioResponse buscarPorId(Long id);

    UsuarioResponse actualizar(Long id, UsuarioRequest request);

    void eliminar(Long id);
}
