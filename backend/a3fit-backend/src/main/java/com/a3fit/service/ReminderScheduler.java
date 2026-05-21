package com.a3fit.service;

import com.a3fit.model.Booking;
import com.a3fit.model.BookingStatus;
import com.a3fit.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReminderScheduler {

    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    public ReminderScheduler(BookingRepository bookingRepository, EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
    }

    // Runs every 5 minutes
    @Scheduled(fixedRate = 300000)
    public void send24hReminders() {
        Instant from = Instant.now().plus(23, ChronoUnit.HOURS).plus(50, ChronoUnit.MINUTES);
        Instant to = Instant.now().plus(24, ChronoUnit.HOURS).plus(10, ChronoUnit.MINUTES);

        List<Booking> bookings = bookingRepository
                .findByStatusAndSent24hReminderFalseAndStartTimeBetween(BookingStatus.CONFIRMED, from, to);

        for (Booking booking : bookings) {
            try {
                emailService.send24hReminder(booking);
                booking.setSent24hReminder(true);
                bookingRepository.save(booking);
            } catch (Exception e) {
                // Log and continue — try again next cycle
            }
        }
    }

    // Runs every 5 minutes
    @Scheduled(fixedRate = 300000)
    public void send2hReminders() {
        Instant from = Instant.now().plus(110, ChronoUnit.MINUTES);
        Instant to = Instant.now().plus(130, ChronoUnit.MINUTES);

        List<Booking> bookings = bookingRepository
                .findByStatusAndSent2hReminderFalseAndStartTimeBetween(BookingStatus.CONFIRMED, from, to);

        for (Booking booking : bookings) {
            try {
                emailService.send2hReminder(booking);
                booking.setSent2hReminder(true);
                bookingRepository.save(booking);
            } catch (Exception e) {
                // Log and continue — try again next cycle
            }
        }
    }

    // Runs every 5 minutes
    @Scheduled(fixedRate = 300000)
    public void sendPostSessionEmails() {
        // Sessions that ended within the last 30 minutes
        Instant cutoff = Instant.now().minus(30, ChronoUnit.MINUTES);

        List<Booking> bookings = bookingRepository
                .findByStatusAndSentPostSessionEmailFalseAndStartTimeBefore(BookingStatus.CONFIRMED, cutoff);

        for (Booking booking : bookings) {
            try {
                emailService.sendPostSession(booking);
                booking.setSentPostSessionEmail(true);
                bookingRepository.save(booking);
            } catch (Exception e) {
                // Log and continue — try again next cycle
            }
        }
    }
}
