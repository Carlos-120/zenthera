package com.zenthera.e2e;

import com.zenthera.controller.E2EActivationTokenController;
import com.zenthera.event.ActivationTokenE2EListener;
import com.zenthera.security.config.E2ETokenSecurityConfig;
import com.zenthera.security.filter.E2ETestKeyAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "zenthera.e2e.token-inbox.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class E2ETokenInboxNonE2EEnabledIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void doesNotRegisterE2EInfrastructureOutsideTheE2EProfileWhenThePropertyIsEnabled() {
        assertTrue(applicationContext.getBeansOfType(ActivationTokenE2EInbox.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(ActivationTokenE2EListener.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2EActivationTokenController.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2ETokenSecurityConfig.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2ETestKeyAuthenticationFilter.class).isEmpty());
        assertTrue(!applicationContext.containsBean("e2eTokenSecurityFilterChain"));
    }

    @Test
    void leavesTheE2ERouteDeniedWhenOnlyThePropertyIsEnabled() throws Exception {
        mockMvc.perform(post("/api/v1/e2e/activation-token/consume"))
                .andExpect(status().isUnauthorized());
    }
}
