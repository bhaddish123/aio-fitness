package com.aiofitness.service;

import com.aiofitness.model.BookingStatus;
import com.aiofitness.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class BookingCleanupService {

    private final BookingRepository bookingRepository;

    public BookingCleanupService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // Runs every minute
    @Scheduled(fixedRate = 60000)
    public void deleteExpiredReservations() {
        bookingRepository
                .findByStatusAndReservedUntilBefore(BookingStatus.RESERVED, Instant.now())
                .forEach(bookingRepository::delete);
    }
}
