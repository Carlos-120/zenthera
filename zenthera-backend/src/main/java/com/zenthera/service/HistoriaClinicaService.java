package com.zenthera.service;

import com.zenthera.entity.HistoriaClinica;

import java.lang.Long;

public interface HistoriaClinicaService {
    HistoriaClinica findOrCreateHistoria(Long pacienteId);
}
