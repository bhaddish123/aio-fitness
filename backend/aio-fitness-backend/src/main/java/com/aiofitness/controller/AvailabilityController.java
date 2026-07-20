package com.aiofitness.controller;

import com.aiofitness.service.AvailabilityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public ResponseEntity<List<Instant>> getAvailability(@RequestParam UUID sessionTypeId) {
        return ResponseEntity.ok(availabilityService.getAvailableSlots(sessionTypeId));
    }
}