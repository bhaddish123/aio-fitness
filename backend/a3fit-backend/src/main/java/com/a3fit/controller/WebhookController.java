package com.a3fit.controller;

import com.a3fit.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.exception.SignatureVerificationException;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/webhook")
public class WebhookController {

    private final BookingService bookingService;

    @Value("${stripe.webhook.secret:dummy_test_secret}")
    private String endpointSecret;

    public WebhookController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            HttpServletRequest request,
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid Stripe signature");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            try {
                JsonNode root = new ObjectMapper().readTree(payload);
                String sessionId = root.path("data").path("object").path("id").asText();
                bookingService.confirmStripePayment(sessionId);
            } catch (Exception e) {
                // Log and continue — Stripe must not retry this event
            }
        }

        return ResponseEntity.ok("Stripe webhook processed");
    }
}
