package com.aiofitness.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force guard for the single admin login — /admin/login is
 * permitAll() at the security-filter level (it has to be, no token
 * exists yet), so this is the only thing standing between it and
 * unlimited password guesses. In-memory and per-username is enough
 * at this scale (one admin account, one backend instance); counts
 * reset on a restart, which is an acceptable tradeoff here rather
 * than standing up a database table or external store for it.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_SECONDS = 15 * 60;

    private record Attempts(int count, Instant firstFailureAt) {
        boolean windowExpired() {
            return Instant.now().isAfter(firstFailureAt.plusSeconds(WINDOW_SECONDS));
        }
    }

    private final ConcurrentHashMap<String, Attempts> failuresByUsername = new ConcurrentHashMap<>();

    public boolean isLocked(String username) {
        Attempts attempts = failuresByUsername.get(safeKey(username));
        return attempts != null && !attempts.windowExpired() && attempts.count() >= MAX_ATTEMPTS;
    }

    public void recordFailure(String username) {
        failuresByUsername.compute(safeKey(username), (key, existing) ->
            (existing == null || existing.windowExpired())
                ? new Attempts(1, Instant.now())
                : new Attempts(existing.count() + 1, existing.firstFailureAt())
        );
    }

    public void recordSuccess(String username) {
        failuresByUsername.remove(safeKey(username));
    }

    private String safeKey(String username) {
        return username == null ? "" : username;
    }
}
