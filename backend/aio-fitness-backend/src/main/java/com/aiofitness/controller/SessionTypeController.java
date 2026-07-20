package com.aiofitness.controller;

import com.aiofitness.model.SessionType;
import com.aiofitness.repository.SessionTypeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/session-types")
public class SessionTypeController {

    private final SessionTypeRepository sessionTypeRepository;

    public SessionTypeController(SessionTypeRepository sessionTypeRepository) {
        this.sessionTypeRepository = sessionTypeRepository;
    }

    @GetMapping
    public ResponseEntity<List<SessionType>> getSessionTypes() {
        return ResponseEntity.ok(sessionTypeRepository.findAll());
    }
}
