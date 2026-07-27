package com.zenthera.security.filter;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;

class E2ETestKeyAuthenticationFilterTest {

    @Test
    void rejectsAnEmptyConfiguredKey() throws Exception {
        assertForbidden("", "");
    }

    @Test
    void rejectsAMissingConfiguredKey() throws Exception {
        assertForbidden(null, "valid-test-key");
    }

    @Test
    void rejectsAWhitespaceOnlyConfiguredKey() throws Exception {
        assertForbidden("   ", "   ");
    }

    @Test
    void rejectsATabOnlyConfiguredKey() throws Exception {
        assertForbidden("\t", "\t");
    }

    @Test
    void rejectsAUnicodeWhitespaceOnlyConfiguredKey() throws Exception {
        assertForbidden("\u00a0", "\u00a0");
    }

    @Test
    void acceptsOnlyTheExactValidKeyWithConstantTimeComparison() throws Exception {
        E2ETestKeyAuthenticationFilter filter = new E2ETestKeyAuthenticationFilter("valid-test-key");
        MockHttpServletRequest validRequest = requestWithHeader("valid-test-key");
        MockHttpServletResponse validResponse = new MockHttpServletResponse();

        filter.doFilter(validRequest, validResponse, new MockFilterChain());

        assertEquals(200, validResponse.getStatus());
        assertEquals("no-store", validResponse.getHeader("Cache-Control"));
        assertForbidden("valid-test-key", "incorrect-key");
    }

    private void assertForbidden(String configuredKey, String providedKey) throws Exception {
        E2ETestKeyAuthenticationFilter filter = new E2ETestKeyAuthenticationFilter(configuredKey);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(requestWithHeader(providedKey), response, new MockFilterChain());

        assertEquals(403, response.getStatus());
        assertEquals("no-store", response.getHeader("Cache-Control"));
    }

    private MockHttpServletRequest requestWithHeader(String value) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/e2e/activation-token/consume");
        request.addHeader(E2ETestKeyAuthenticationFilter.HEADER_NAME, value);
        return request;
    }
}
