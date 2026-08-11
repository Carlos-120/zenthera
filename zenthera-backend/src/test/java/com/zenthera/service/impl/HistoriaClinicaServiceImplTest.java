package com.zenthera.service.impl;

import com.zenthera.entity.HistoriaClinica;
import com.zenthera.entity.Paciente;
import com.zenthera.repository.HistoriaClinicaRepository;
import com.zenthera.repository.PacienteRepository;
import com.zenthera.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.lang.Long;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HistoriaClinicaServiceImplTest {

    @Mock
    private HistoriaClinicaRepository historiaClinicaRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private AuthService authService;

    @InjectMocks
    private HistoriaClinicaServiceImpl historiaClinicaService;

    private Long pacienteId;
    private Long clinicaId;
    private HistoriaClinica historiaClinica;
    private Paciente paciente;

    @BeforeEach
    void setUp() {
        pacienteId = 1L;
        clinicaId = 1L;

        historiaClinica = new HistoriaClinica();
        historiaClinica.setId(1L);
        historiaClinica.setPacienteId(pacienteId);
        historiaClinica.setClinicaId(clinicaId);

        paciente = new Paciente();
        paciente.setId(pacienteId);

    }

    @Test
    void findOrCreateHistoria_ShouldReturnExistingHistoria() {
        when(authService.getClinicaActualId()).thenReturn(clinicaId);
        when(historiaClinicaRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId))
                .thenReturn(Optional.of(historiaClinica));

        HistoriaClinica result = historiaClinicaService.findOrCreateHistoria(pacienteId);

        assertNotNull(result);
        assertEquals(historiaClinica.getId(), result.getId());
        verify(pacienteRepository, never()).findByIdAndClinicaId(any(), any());
        verify(historiaClinicaRepository, never()).save(any());
    }

    @Test
    void findOrCreateHistoria_ShouldCreateNewHistoria() {
        when(authService.getClinicaActualId()).thenReturn(clinicaId);
        when(historiaClinicaRepository.findByPacienteIdAndClinicaId(pacienteId, clinicaId))
                .thenReturn(Optional.empty());
        when(pacienteRepository.findByIdAndClinicaId(pacienteId, clinicaId))
                .thenReturn(Optional.of(paciente));
        when(historiaClinicaRepository.save(any(HistoriaClinica.class)))
                .thenAnswer(i -> {
                    HistoriaClinica h = i.getArgument(0);
                    h.setId(1L);
                    return h;
                });

        HistoriaClinica result = historiaClinicaService.findOrCreateHistoria(pacienteId);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertEquals(pacienteId, result.getPacienteId());
        assertEquals(clinicaId, result.getClinicaId());

        verify(historiaClinicaRepository).save(any(HistoriaClinica.class));
    }
}
