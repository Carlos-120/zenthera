package com.zenthera.security.filter;

import com.zenthera.security.user.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ForcePasswordChangeFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            // Check if user is forced to change password
            if (Boolean.TRUE.equals(userDetails.getUsuario().getCambiarPassword())) {
                String path = request.getRequestURI();

                if (path.startsWith("/api/")) {
                    boolean isAllowed = path.equals("/api/v1/auth/cambiar-password") ||
                                        path.equals("/api/v1/auth/me") ||
                                        path.equals("/api/v1/auth/logout") ||
                                        path.equals("/api/v1/auth/refresh");
                    
                    if (!isAllowed) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"success\":false,\"message\":\"Debe cambiar su contraseña antes de continuar.\"}");
                        return;
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
