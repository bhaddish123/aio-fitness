package com.aiofitness.controller;

import com.aiofitness.model.Booking;
import com.aiofitness.service.BookingService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import com.aiofitness.model.BookingStatus;
import com.stripe.model.checkout.Session;

import java.time.Instant;
import java.util.UUID;

import com.aiofitness.dto.ReserveBookingRequest;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/reserve")
    public ResponseEntity<Booking> reserve(@Valid @RequestBody ReserveBookingRequest request) {
        Booking saved = bookingService.reserveSlot(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/cancel/{token}")
    public ResponseEntity<Void> cancel(@PathVariable String token) throws Exception{
        bookingService.cancelByToken(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<String> checkout(@PathVariable UUID id) throws Exception {

        Booking booking = bookingService.getBookingById(id);

        if (booking.getStatus() != BookingStatus.RESERVED) {
            throw new RuntimeException("Booking is not in a reservable state");
        }

        if (booking.getReservedUntil() != null && Instant.now().isAfter(booking.getReservedUntil())) {
            throw new RuntimeException("Reservation has expired");
        }

        Session session = bookingService.createCheckoutSession(booking);

        booking.setStripeSessionId(session.getId());
        bookingService.save(booking);

        return ResponseEntity.ok(session.getUrl());
    }
}