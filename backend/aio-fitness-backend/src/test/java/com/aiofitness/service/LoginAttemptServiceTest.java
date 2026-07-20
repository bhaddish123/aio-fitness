package com.aiofitness.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Plain unit test (no @SpringBootTest) — this only exercises the
// in-memory map logic, no Spring context or database needed.
class LoginAttemptServiceTest {

    @Test
    void notLockedBeforeThreshold() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 4; i++) {
            service.recordFailure("admin");
        }
        assertFalse(service.isLocked("admin"));
    }

    @Test
    void locksAfterFiveFailures() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.recordFailure("admin");
        }
        assertTrue(service.isLocked("admin"));
    }

    @Test
    void successClearsLockout() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.recordFailure("admin");
        }
        assertTrue(service.isLocked("admin"));

        service.recordSuccess("admin");
        assertFalse(service.isLocked("admin"));
    }

    @Test
    void usersAreTrackedIndependently() {
        LoginAttemptService service = new LoginAttemptService();
        for (int i = 0; i < 5; i++) {
            service.recordFailure("admin");
        }
        assertTrue(service.isLocked("admin"));
        assertFalse(service.isLocked("someone-else"));
    }
}
