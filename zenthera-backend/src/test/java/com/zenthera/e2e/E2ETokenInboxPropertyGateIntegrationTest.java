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

@SpringBootTest(properties = {
        "zenthera.e2e.token-inbox.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:e2e-token-inbox-disabled;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.default_schema=PUBLIC",
        "spring.flyway.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
class E2ETokenInboxPropertyGateIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void doesNotRegisterE2EInfrastructureWhenThePropertyIsDisabled() {
        assertTrue(applicationContext.getBeansOfType(ActivationTokenE2EInbox.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(ActivationTokenE2EListener.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2EActivationTokenController.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2ETokenSecurityConfig.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(E2ETestKeyAuthenticationFilter.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(com.zenthera.event.ActivationNotificationListener.class).isEmpty());
        assertTrue(!applicationContext.containsBean("e2eTokenSecurityFilterChain"));
    }

    @Test
    void leavesTheE2ERouteDeniedWhenThePropertyIsDisabled() throws Exception {
        mockMvc.perform(post("/api/v1/e2e/activation-token/consume"))
                .andExpect(status().isUnauthorized());
    }
}
