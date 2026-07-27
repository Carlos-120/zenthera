package com.zenthera.security.config;

import com.zenthera.security.filter.E2ETestKeyAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** A narrowly scoped security chain which exists only for explicitly enabled E2E runs. */
@Configuration
@Profile("e2e")
@ConditionalOnProperty(name = "zenthera.e2e.token-inbox.enabled", havingValue = "true")
public class E2ETokenSecurityConfig {

    @Bean
    E2ETestKeyAuthenticationFilter e2eTestKeyAuthenticationFilter(
            @Value("${E2E_TEST_KEY:}") String e2eTestKey) {
        return new E2ETestKeyAuthenticationFilter(e2eTestKey);
    }

    @Bean
    @Order(1)
    SecurityFilterChain e2eTokenSecurityFilterChain(
            HttpSecurity http,
            E2ETestKeyAuthenticationFilter e2eTestKeyAuthenticationFilter) throws Exception {

        http
                .securityMatcher("/api/v1/e2e/**")
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                .addFilterBefore(e2eTestKeyAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
