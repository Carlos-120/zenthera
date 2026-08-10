package com.zenthera.security.filter;

import com.zenthera.entity.Usuario;
import com.zenthera.security.user.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ForcePasswordChangeFilterTest {

    @InjectMocks
    private ForcePasswordChangeFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private Usuario usuario;
    private StringWriter stringWriter;
    private PrintWriter printWriter;

    @BeforeEach
    void setUp() throws IOException {
        usuario = new Usuario();
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
        SecurityContextHolder.clearContext();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(boolean forcePasswordChange) {
        com.zenthera.entity.Rol rol = new com.zenthera.entity.Rol();
        rol.setNombre(com.zenthera.enums.RolNombre.MEDICO);
        usuario.setRol(rol);
        usuario.setCambiarPassword(forcePasswordChange);
        CustomUserDetails userDetails = new CustomUserDetails(usuario);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void whenUserNotForcedToChangePassword_thenContinuesFilter() throws ServletException, IOException {
        authenticateUser(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(anyInt());
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsCambiarPassword_thenContinuesFilter() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/cambiar-password");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(anyInt());
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsBusinessEndpoint_thenBlocksRequest() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/pacientes");
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsMedicosEndpoint_thenBlocksRequest() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/medicos");
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsCitasEndpoint_thenBlocksRequest() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/citas");
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsClinicaUsuariosEndpoint_thenBlocksRequest() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/v1/clinica/usuarios");
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsUnlistedAuthEndpoint_thenBlocksRequest() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login"); // Login is not in whitelist
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void whenUserForcedToChangePassword_andPathIsMeEndpoint_thenContinuesFilter() throws ServletException, IOException {
        authenticateUser(true);
        when(request.getRequestURI()).thenReturn("/api/v1/auth/me");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(anyInt());
    }
}
