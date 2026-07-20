package com.aiofitness.repository;

import com.aiofitness.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    Optional<Booking> findByStartTime(Instant startTime);
    Optional<Booking> findByCancellationToken(String cancellationToken);
    Optional<Booking> findByStripeSessionId(String stripeSessionId);
    List<Booking> findByStatusAndReservedUntilBefore(com.aiofitness.model.BookingStatus status, Instant time);

    // Bookings that need 24h reminder
    List<Booking> findByStatusAndSent24hReminderFalseAndStartTimeBetween(
            com.aiofitness.model.BookingStatus status, Instant from, Instant to);

    // Bookings that need 2h reminder
    List<Booking> findByStatusAndSent2hReminderFalseAndStartTimeBetween(
            com.aiofitness.model.BookingStatus status, Instant from, Instant to);

    // Bookings that need post-session email
    List<Booking> findByStatusAndSentPostSessionEmailFalseAndStartTimeBefore(
            com.aiofitness.model.BookingStatus status, Instant time);
}