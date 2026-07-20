package com.aiofitness.controller;

import com.aiofitness.dto.InquiryRequest;
import com.aiofitness.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/inquiries")
public class InquiryController {

    private final EmailService emailService;

    public InquiryController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> submit(@RequestBody InquiryRequest request) {
        if (request.clientName() == null || request.clientName().isBlank()
                || request.clientEmail() == null || request.clientEmail().isBlank()
                || request.goals() == null || request.goals().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and goals are required."));
        }

        try {
            emailService.sendInquiry(request);
            return ResponseEntity.ok(Map.of("message", "Inquiry submitted. Everett will be in touch shortly."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to send inquiry. Please try again."));
        }
    }
}
