package com.zenthera.controller;

import com.zenthera.dto.e2e.ActivationTokenConsumeRequest;
import com.zenthera.dto.e2e.ActivationTokenConsumeResponse;
import com.zenthera.e2e.ActivationTokenE2EInbox;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("e2e")
@ConditionalOnProperty(name = "zenthera.e2e.token-inbox.enabled", havingValue = "true")
@RequestMapping("/api/v1/e2e/activation-token")
public class E2EActivationTokenController {

    private final ActivationTokenE2EInbox inbox;

    public E2EActivationTokenController(ActivationTokenE2EInbox inbox) {
        this.inbox = inbox;
    }

    @PostMapping("/consume")
    public ResponseEntity<ActivationTokenConsumeResponse> consume(
            @Valid @RequestBody ActivationTokenConsumeRequest request) {
        try {
            return inbox.consume(request.adminCorreo())
                    .map(token -> ResponseEntity.ok()
                            .cacheControl(CacheControl.noStore())
                            .body(new ActivationTokenConsumeResponse(token)))
                    .orElseGet(() -> ResponseEntity.notFound()
                            .cacheControl(CacheControl.noStore())
                            .build());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .cacheControl(CacheControl.noStore())
                    .build();
        }
    }
}
