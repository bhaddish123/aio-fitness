package com.aiofitness.service;

import com.aiofitness.model.AvailabilityRule;
import com.aiofitness.model.Booking;
import com.aiofitness.model.BookingStatus;
import com.aiofitness.model.ScheduleOverride;
import com.aiofitness.model.SessionType;
import com.aiofitness.repository.AvailabilityRuleRepository;
import com.aiofitness.repository.BookingRepository;
import com.aiofitness.repository.ScheduleOverrideRepository;
import com.aiofitness.repository.SessionTypeRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AvailabilityService {

    private final AvailabilityRuleRepository availabilityRuleRepository;
    private final BookingRepository bookingRepository;
    private final SessionTypeRepository sessionTypeRepository;
    private final ScheduleOverrideRepository scheduleOverrideRepository;
    private final CalendarService calendarService;

    public AvailabilityService(AvailabilityRuleRepository availabilityRuleRepository,
                                BookingRepository bookingRepository,
                                SessionTypeRepository sessionTypeRepository,
                                ScheduleOverrideRepository scheduleOverrideRepository,
                                CalendarService calendarService) {
        this.availabilityRuleRepository = availabilityRuleRepository;
        this.bookingRepository = bookingRepository;
        this.sessionTypeRepository = sessionTypeRepository;
        this.scheduleOverrideRepository = scheduleOverrideRepository;
        this.calendarService = calendarService;
    }

    public List<Instant> getAvailableSlots(UUID sessionTypeId) {
        SessionType sessionType = sessionTypeRepository.findById(sessionTypeId)
                .orElseThrow(() -> new RuntimeException("Session type not found"));

        int durationMinutes = sessionType.getDurationMinutes();

        List<AvailabilityRule> rules = availabilityRuleRepository.findAll();
        List<Booking> existingBookings = bookingRepository.findAll();

        // Active bookings as [start, end) intervals for overlap detection
        record BookedInterval(Instant start, Instant end) {}
        List<BookedInterval> bookedIntervals = new ArrayList<>();
        for (Booking b : existingBookings) {
            if (b.getStatus() == BookingStatus.CONFIRMED ||
               (b.getStatus() == BookingStatus.RESERVED &&
                Instant.now().isBefore(b.getReservedUntil()))) {
                bookedIntervals.add(new BookedInterval(b.getStartTime(), b.getEndTime()));
            }
        }

        // Times blocked by admin overrides (next 30 days window)
        ZoneId est = ZoneId.of("America/New_York");
        Instant windowStart = Instant.now();
        Instant windowEnd   = ZonedDateTime.now(est).plusDays(30).toInstant();
        List<ScheduleOverride> overrides = scheduleOverrideRepository.findBySlotTimeBetween(windowStart, windowEnd);

        Set<Instant> blockedSlots = new HashSet<>();
        Set<Instant> manualSlots  = new HashSet<>();
        for (ScheduleOverride o : overrides) {
            if (o.getBlocked()) {
                blockedSlots.add(o.getSlotTime());
            } else {
                manualSlots.add(o.getSlotTime());
            }
        }

        List<Instant> available = new ArrayList<>();
        Set<Instant> addedTimes = new HashSet<>();
        ZonedDateTime now = ZonedDateTime.now(est);

        for (AvailabilityRule rule : rules) {
            if (!rule.getIsActive()) continue;

            // Generate slots for the next 30 days
            for (int day = 0; day < 30; day++) {
                ZonedDateTime dayStart = now.toLocalDate().plusDays(day)
                        .atTime(rule.getStartTime())
                        .atZone(est);

                if (dayStart.getDayOfWeek().getValue() % 7 != rule.getDayOfWeek()) continue;

                ZonedDateTime dayEnd = now.toLocalDate().plusDays(day)
                        .atTime(rule.getEndTime())
                        .atZone(est);

                ZonedDateTime slot = dayStart;
                while (!slot.plusMinutes(durationMinutes).isAfter(dayEnd)) {
                    if (!slot.isBefore(now.plusHours(6))) {
                        Instant slotInstant = slot.toInstant();
                        Instant slotEnd = slot.plusMinutes(durationMinutes).toInstant();
                        boolean overlaps = bookedIntervals.stream()
                                .anyMatch(i -> slotInstant.isBefore(i.end()) && slotEnd.isAfter(i.start()));
                        if (!overlaps && !blockedSlots.contains(slotInstant) && addedTimes.add(slotInstant)) {
                            available.add(slotInstant);
                        }
                    }
                    slot = slot.plusMinutes(durationMinutes);
                }
            }
        }

        // Add manual (non-blocked) override slots not already covered by a rule
        for (Instant manualSlot : manualSlots) {
            if (addedTimes.contains(manualSlot)) continue; // already a rule-generated slot
            boolean overlaps = bookedIntervals.stream()
                    .anyMatch(i -> manualSlot.isBefore(i.end()) && manualSlot.plusSeconds(durationMinutes * 60L).isAfter(i.start()));
            if (!overlaps && !blockedSlots.contains(manualSlot) && addedTimes.add(manualSlot)) {
                available.add(manualSlot);
            }
        }

        // Filter out slots that overlap with existing events on Everett's Google Calendar
        List<CalendarService.BusyInterval> gcalBusy = calendarService.getBusyIntervals(windowStart, windowEnd);
        if (!gcalBusy.isEmpty()) {
            available.removeIf(slot -> {
                Instant slotEnd = slot.plusSeconds(durationMinutes * 60L);
                return gcalBusy.stream().anyMatch(b -> slot.isBefore(b.end()) && slotEnd.isAfter(b.start()));
            });
        }

        available.sort(Instant::compareTo);
        return available;
    }
}
