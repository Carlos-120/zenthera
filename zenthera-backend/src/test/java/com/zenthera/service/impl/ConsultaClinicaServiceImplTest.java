package com.zenthera.service.impl;

import com.zenthera.dto.clinico.ConsultaRequest;
import com.zenthera.dto.clinico.ConsultaResponse;
import com.zenthera.entity.ConsultaClinica;
import com.zenthera.entity.HistoriaClinica;
import com.zenthera.entity.Medico;
import com.zenthera.entity.Usuario;
import com.zenthera.enums.EstadoConsulta;
import com.zenthera.mapper.ClinicoMapper;
import com.zenthera.repository.ConsultaClinicaRepository;
import com.zenthera.service.AuthService;
import com.zenthera.service.HistoriaClinicaService;
import com.zenthera.service.MedicoService;
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
class ConsultaClinicaServiceImplTest {

    @Mock
    private ConsultaClinicaRepository consultaClinicaRepository;

    @Mock
    private HistoriaClinicaService historiaClinicaService;

    @Mock
    private MedicoService medicoService;

    @Mock
    private AuthService authService;

    @Mock
    private ClinicoMapper clinicoMapper;

    @InjectMocks
    private ConsultaClinicaServiceImpl consultaClinicaService;

    private Long clinicaId;
    private Long pacienteId;
    private Medico medico;
    private HistoriaClinica historia;
    private ConsultaClinica consultaBorrador;
    private ConsultaResponse responseMock;

    @BeforeEach
    void setUp() {
        clinicaId = 1L;
        pacienteId = 1L;

        medico = new Medico();
        medico.setId(1L);

        historia = new HistoriaClinica();
        historia.setId(1L);

        consultaBorrador = new ConsultaClinica();
        consultaBorrador.setId(1L);
        consultaBorrador.setEstado(EstadoConsulta.BORRADOR);

        responseMock = new ConsultaResponse();
        responseMock.setId(consultaBorrador.getId());
    }

    @Test
    void crearBorrador_Success() {
        ConsultaRequest request = new ConsultaRequest();

        when(authService.getClinicaActualId()).thenReturn(clinicaId);
        when(medicoService.getMedicoPorUsuarioAutenticado()).thenReturn(medico);
        when(historiaClinicaService.findOrCreateHistoria(pacienteId)).thenReturn(historia);
        when(clinicoMapper.toEntity(request)).thenReturn(new ConsultaClinica());
        when(consultaClinicaRepository.save(any(ConsultaClinica.class))).thenReturn(consultaBorrador);
        when(clinicoMapper.toResponse(consultaBorrador)).thenReturn(responseMock);

        ConsultaResponse result = consultaClinicaService.crearBorrador(pacienteId, request);

        assertNotNull(result);
        assertEquals(responseMock.getId(), result.getId());
        verify(consultaClinicaRepository).save(argThat(c ->
            c.getHistoriaClinicaId().equals(historia.getId()) &&
            c.getClinicaId().equals(clinicaId) &&
            c.getMedicoId().equals(medico.getId()) &&
            c.getEstado() == EstadoConsulta.BORRADOR
        ));
    }

    @Test
    void finalizarConsulta_Success() {
        Usuario authUser = new Usuario();
        authUser.setId(1L);

        when(authService.getClinicaActualId()).thenReturn(clinicaId);
        when(authService.getUsuarioAutenticado()).thenReturn(authUser);
        when(consultaClinicaRepository.findByIdAndClinicaId(consultaBorrador.getId(), clinicaId))
                .thenReturn(Optional.of(consultaBorrador));
        when(consultaClinicaRepository.save(any())).thenReturn(consultaBorrador);
        when(clinicoMapper.toResponse(consultaBorrador)).thenReturn(responseMock);

        ConsultaResponse result = consultaClinicaService.finalizarConsulta(consultaBorrador.getId());

        assertNotNull(result);
        assertEquals(EstadoConsulta.FINALIZADA, consultaBorrador.getEstado());
        assertNotNull(consultaBorrador.getFinalizadaAt());
        assertEquals(authUser.getId(), consultaBorrador.getFinalizadaPor());
    }

    @Test
    void finalizarConsulta_AlreadyFinalized_ShouldThrowException() {
        consultaBorrador.setEstado(EstadoConsulta.FINALIZADA);
        when(authService.getClinicaActualId()).thenReturn(clinicaId);
        when(authService.getUsuarioAutenticado()).thenReturn(new Usuario());
        when(consultaClinicaRepository.findByIdAndClinicaId(consultaBorrador.getId(), clinicaId))
                .thenReturn(Optional.of(consultaBorrador));

        assertThrows(IllegalStateException.class, () ->
            consultaClinicaService.finalizarConsulta(consultaBorrador.getId())
        );
    }
}
