package com.aiofitness.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    // Jackson 2.15+ defaults to 20 MB max string length.
    // Transformation videos are stored as base64 data URLs (~4/3 of raw size),
    // so a 50 MB video yields ~67 MB — raise the global default to 100 MB.
    private static final int MAX_STRING_LENGTH = 100 * 1024 * 1024;

    @PostConstruct
    public void configureJacksonStreamReadConstraints() {
        StreamReadConstraints.overrideDefaultStreamReadConstraints(
            StreamReadConstraints.builder()
                .maxStringLength(MAX_STRING_LENGTH)
                .build()
        );
    }
}
