package com.zenthera.e2e;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zenthera.controller.E2EActivationTokenController;
import com.zenthera.dto.e2e.ActivationTokenConsumeRequest;
import com.zenthera.event.ActivationNotificationEvent;
import com.zenthera.event.ActivationTokenE2EListener;
import com.zenthera.security.config.E2ETokenSecurityConfig;
import com.zenthera.security.filter.E2ETestKeyAuthenticationFilter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.context.ApplicationContext;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:e2e-token-inbox;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
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
class E2ETokenInboxIntegrationTest {

    private static final String E2E_TEST_KEY = UUID.randomUUID().toString();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ActivationTokenE2EInbox inbox;

    @Autowired
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private ApplicationContext applicationContext;

    @DynamicPropertySource
    static void configureE2EInbox(DynamicPropertyRegistry registry) {
        registry.add("zenthera.e2e.token-inbox.enabled", () -> true);
        registry.add("E2E_TEST_KEY", () -> E2E_TEST_KEY);
    }

    @BeforeEach
    void clearInboxes() {
        inbox.clearAll();
    }

    @AfterEach
    void clearAfterTest() {
        inbox.clearAll();
    }

    @Test
    void registersEveryE2EInboxBeanOnlyWhenProfileAndPropertyAreEnabled() {
        assertFalse(applicationContext.getBeansOfType(ActivationTokenE2EInbox.class).isEmpty());
        assertFalse(applicationContext.getBeansOfType(ActivationTokenE2EListener.class).isEmpty());
        assertFalse(applicationContext.getBeansOfType(E2EActivationTokenController.class).isEmpty());
        assertFalse(applicationContext.getBeansOfType(E2ETokenSecurityConfig.class).isEmpty());
        assertFalse(applicationContext.getBeansOfType(E2ETestKeyAuthenticationFilter.class).isEmpty());
        assertTrue(applicationContext.getBeansOfType(com.zenthera.event.ActivationNotificationListener.class).isEmpty());
        assertTrue(applicationContext.containsBean("e2eTokenSecurityFilterChain"));
    }

    @Test
    void storesOnlyAfterCommit() {
        String email = "after-commit@e2e.invalid";
        String token = UUID.randomUUID().toString();

        transactionTemplate.executeWithoutResult(status ->
                eventPublisher.publishEvent(new ActivationNotificationEvent(email, token)));

        assertEquals(token, inbox.consume(email).orElseThrow());
    }

    @Test
    void doesNotStoreEventWhenTransactionRollsBack() {
        String email = "rollback@e2e.invalid";

        transactionTemplate.executeWithoutResult(status -> {
            eventPublisher.publishEvent(new ActivationNotificationEvent(email, UUID.randomUUID().toString()));
            status.setRollbackOnly();
        });

        assertTrue(inbox.consume(email).isEmpty());
    }

    @Test
    void deniesMissingOrIncorrectHeader() throws Exception {
        String request = objectMapper.writeValueAsString(new ActivationTokenConsumeRequest("admin@e2e.invalid"));

        mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                        .contentType(APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().string(""));

        mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                        .header("X-E2E-Test-Key", UUID.randomUUID().toString())
                        .contentType(APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(content().string(""));
    }

    @Test
    void consumesWithCorrectHeaderOnceAndDisablesCaching() throws Exception {
        String email = "consume@e2e.invalid";
        String token = UUID.randomUUID().toString();
        inbox.store(email, token);
        String request = objectMapper.writeValueAsString(new ActivationTokenConsumeRequest(email));

        mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                        .header("X-E2E-Test-Key", E2E_TEST_KEY)
                        .contentType(APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.token").value(token));

        mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                        .header("X-E2E-Test-Key", E2E_TEST_KEY)
                        .contentType(APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Cache-Control", containsString("no-store")));
    }

    @Test
    void rejectsInvalidRequestAfterHeaderValidation() throws Exception {
        mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                        .header("X-E2E-Test-Key", E2E_TEST_KEY)
                        .contentType(APPLICATION_JSON)
                        .content("{\"adminCorreo\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Cache-Control", containsString("no-store")));
    }

    @Test
    void leavesProductionRoutesWithTheirExistingSecurity() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void doesNotLogConsumedToken() throws Exception {
        String email = "logs@e2e.invalid";
        String token = UUID.randomUUID().toString();
        inbox.store(email, token);
        Logger controllerLogger = (Logger) LoggerFactory.getLogger(E2EActivationTokenController.class);
        ListAppender<ILoggingEvent> events = new ListAppender<>();
        events.start();
        controllerLogger.addAppender(events);
        try {
            mockMvc.perform(post("/api/v1/e2e/activation-token/consume")
                            .header("X-E2E-Test-Key", E2E_TEST_KEY)
                            .contentType(APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new ActivationTokenConsumeRequest(email))))
                    .andExpect(status().isOk());
        } finally {
            controllerLogger.detachAppender(events);
        }

        assertFalse(events.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .anyMatch(message -> message.contains(token)));
    }
}
