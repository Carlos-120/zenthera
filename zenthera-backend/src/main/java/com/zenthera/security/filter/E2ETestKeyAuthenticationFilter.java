package com.zenthera.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Authentication gate for the isolated E2E token-consumption route. */
public class E2ETestKeyAuthenticationFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-E2E-Test-Key";

    private final byte[] expectedKey;
    private final boolean configuredWithNonBlankKey;

    public E2ETestKeyAuthenticationFilter(String expectedKey) {
        this.expectedKey = expectedKey == null ? new byte[0] : expectedKey.getBytes(StandardCharsets.UTF_8);
        this.configuredWithNonBlankKey = hasNonWhitespaceContent(expectedKey);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/e2e/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        String providedKey = request.getHeader(HEADER_NAME);
        if (!configuredWithNonBlankKey || providedKey == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        if (!MessageDigest.isEqual(expectedKey, providedKey.getBytes(StandardCharsets.UTF_8))) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static boolean hasNonWhitespaceContent(String value) {
        return value != null && value.codePoints()
                .anyMatch(codePoint -> !Character.isWhitespace(codePoint) && !Character.isSpaceChar(codePoint));
    }
}
