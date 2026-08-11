package com.zenthera.config;

import com.zenthera.security.exception.CustomAccessDeniedHandler;
import com.zenthera.security.exception.CustomAuthenticationEntryPoint;
import com.zenthera.security.filter.CsrfAndOriginFilter;
import com.zenthera.security.filter.JwtAuthenticationFilter;
import com.zenthera.security.tenant.TenantFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomAuthenticationEntryPoint authenticationEntryPoint;
        private final CustomAccessDeniedHandler accessDeniedHandler;
        private final CsrfAndOriginFilter csrfAndOriginFilter;
        private final com.zenthera.security.filter.ActivationRateLimitFilter activationRateLimitFilter;
        private final com.zenthera.security.filter.ForcePasswordChangeFilter forcePasswordChangeFilter;
        private final TenantFilter tenantFilter;
        private final CorsConfigurationSource corsConfigurationSource;
        private final org.springframework.core.env.Environment env;

        public SecurityConfig(
                JwtAuthenticationFilter jwtAuthenticationFilter,
                CustomAuthenticationEntryPoint authenticationEntryPoint,
                CustomAccessDeniedHandler accessDeniedHandler,
                CsrfAndOriginFilter csrfAndOriginFilter,
                com.zenthera.security.filter.ActivationRateLimitFilter activationRateLimitFilter,
                com.zenthera.security.filter.ForcePasswordChangeFilter forcePasswordChangeFilter,
                TenantFilter tenantFilter,
                CorsConfigurationSource corsConfigurationSource,
                org.springframework.core.env.Environment env) {
            this.jwtAuthenticationFilter = jwtAuthenticationFilter;
            this.authenticationEntryPoint = authenticationEntryPoint;
            this.accessDeniedHandler = accessDeniedHandler;
            this.csrfAndOriginFilter = csrfAndOriginFilter;
            this.activationRateLimitFilter = activationRateLimitFilter;
            this.forcePasswordChangeFilter = forcePasswordChangeFilter;
            this.tenantFilter = tenantFilter;
            this.corsConfigurationSource = corsConfigurationSource;
            this.env = env;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                boolean isDev = java.util.Arrays.asList(env.getActiveProfiles()).contains("dev");

                http
                        .cors(cors -> cors.configurationSource(corsConfigurationSource))
                        .csrf(csrf -> csrf.disable()) // Deshabilitado porque usamos CSRF personalizado basado en Origin y Headers
                        .sessionManagement(session -> session
                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                        .exceptionHandling(exceptions -> exceptions
                                .authenticationEntryPoint(authenticationEntryPoint)
                                .accessDeniedHandler(accessDeniedHandler))
                        .authorizeHttpRequests(auth -> {
                                if (isDev) {
                                    auth.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll();
                                }
                                auth.requestMatchers("/api/v1/auth/login", "/api/v1/auth/refresh", "/api/v1/auth/logout", "/api/v1/auth/activate").permitAll()
                                    .requestMatchers(HttpMethod.POST, "/api/v1/auth/register-clinic").permitAll()
                                    .requestMatchers("/api/v1/auth/me", "/api/v1/auth/cambiar-password").authenticated()
                                    .requestMatchers("/api/v1/pacientes/*/historia", "/api/v1/pacientes/*/consultas", "/api/v1/consultas/**").hasAuthority("MEDICO")
                                    .requestMatchers("/api/pacientes/**", "/api/v1/pacientes/**").hasAnyAuthority("ADMIN_CLINICA", "MEDICO", "RECEPCIONISTA")
                                    .requestMatchers("/api/v1/clinica/citas/**").hasAnyAuthority("ADMIN_CLINICA", "MEDICO", "RECEPCIONISTA")
                                    .requestMatchers("/api/v1/clinica/**").hasAuthority("ADMIN_CLINICA")
                                    .requestMatchers("/api/v1/admin/clinicas/**").hasAuthority("SUPER_ADMIN")
                                    .requestMatchers("/api/medicos/**").hasAnyAuthority("ADMIN_CLINICA", "MEDICO", "RECEPCIONISTA")
                                    .requestMatchers("/api/usuarios/**").denyAll()
                                    .anyRequest().denyAll(); // Denegación segura por defecto
                        })
                        .addFilterBefore(csrfAndOriginFilter, UsernamePasswordAuthenticationFilter.class)
                        .addFilterBefore(activationRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                        .addFilterAfter(forcePasswordChangeFilter, JwtAuthenticationFilter.class)
                        .addFilterAfter(tenantFilter, com.zenthera.security.filter.ForcePasswordChangeFilter.class);

                return http.build();
        }
}
