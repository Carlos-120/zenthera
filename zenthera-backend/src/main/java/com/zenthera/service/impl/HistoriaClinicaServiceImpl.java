package com.zenthera.service.impl;

import com.zenthera.entity.HistoriaClinica;
import com.zenthera.entity.Paciente;
import com.zenthera.exception.ResourceNotFoundException;
import com.zenthera.repository.HistoriaClinicaRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.service.AuthService;
import com.zenthera.service.HistoriaClinicaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.Long;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaServiceImpl implements HistoriaClinicaService {

    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final PacienteRepository pacienteRepository;
    private final AuthService authService;

    @Override
    @Transactional
    public HistoriaClinica findOrCreateHistoria(Long pacienteId) {
        Long clinicaId = authService.getClinicaActualId();

        return historiaClinicaRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId)
                .orElseGet(() -> {
                    // Verificar que el paciente exista y pertenezca al tenant
                    Paciente paciente = pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId)
                            .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado"));

                    HistoriaClinica nuevaHistoria = new HistoriaClinica();
                    nuevaHistoria.setPacienteId(pacienteId);
                    nuevaHistoria.setClinicaId(clinicaId);

                    return historiaClinicaRepository.save(nuevaHistoria);
                });
    }
}
