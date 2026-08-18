package com.aiofitness.controller;

import com.aiofitness.config.JwtUtil;
import com.aiofitness.dto.DaySlotDto;
import com.aiofitness.dto.LoginRequest;
import com.aiofitness.dto.ScheduleOverrideRequest;
import com.aiofitness.model.*;
import com.aiofitness.repository.AvailabilityRuleRepository;
import com.aiofitness.repository.BookingRepository;
import com.aiofitness.repository.ScheduleOverrideRepository;
import com.aiofitness.service.BookingService;
import com.aiofitness.service.CalendarService;
import com.aiofitness.service.EmailService;
import com.aiofitness.service.LoginAttemptService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final BookingRepository bookingRepository;
    private final AvailabilityRuleRepository availabilityRuleRepository;
    private final ScheduleOverrideRepository scheduleOverrideRepository;
    private final BookingService bookingService;
    private final CalendarService calendarService;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final LoginAttemptService loginAttemptService;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    public AdminController(BookingRepository bookingRepository,
                           AvailabilityRuleRepository availabilityRuleRepository,
                           ScheduleOverrideRepository scheduleOverrideRepository,
                           BookingService bookingService,
                           CalendarService calendarService,
                           EmailService emailService,
                           JwtUtil jwtUtil,
                           LoginAttemptService loginAttemptService) {
        this.bookingRepository = bookingRepository;
        this.availabilityRuleRepository = availabilityRuleRepository;
        this.scheduleOverrideRepository = scheduleOverrideRepository;
        this.bookingService = bookingService;
        this.calendarService = calendarService;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
        this.loginAttemptService = loginAttemptService;
    }

    /** GET /admin/dev/email-preview?type=confirmation — renders email HTML in the browser for design review. Remove before final deploy. */
    @GetMapping(value = "/dev/email-preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> emailPreview(@RequestParam(defaultValue = "confirmation") String type) {
        String html = emailService.previewHtml(type);
        return ResponseEntity.ok(html);
    }

    /** GET /admin/dev/freebusy-test — returns what Google Calendar FreeBusy sees for the next 7 days. Remove before final deploy. */
    @GetMapping("/dev/freebusy-test")
    public ResponseEntity<?> freeBusyTest() {
        java.time.Instant from = java.time.Instant.now();
        java.time.Instant to = from.plus(7, java.time.temporal.ChronoUnit.DAYS);
        List<CalendarService.BusyInterval> busy = calendarService.getBusyIntervals(from, to);
        return ResponseEntity.ok(Map.of(
                "from", from.toString(),
                "to", to.toString(),
                "busyCount", busy.size(),
                "intervals", busy.stream()
                        .map(b -> Map.of("start", b.start().toString(), "end", b.end().toString()))
                        .toList()
        ));
    }

    /* ── Auth ──────────────────────────────────────────────────── */

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String username = request.getUsername();

        if (loginAttemptService.isLocked(username)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many failed login attempts. Try again in 15 minutes."));
        }

        if (adminUsername.equals(username) && adminPassword.equals(request.getPassword())) {
            loginAttemptService.recordSuccess(username);
            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Map.of("token", token));
        }

        loginAttemptService.recordFailure(username);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
    }

    /* ── Bookings ──────────────────────────────────────────────── */

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @PatchMapping("/bookings/{id}")
    public ResponseEntity<Booking> updateBooking(
            @PathVariable String id,
            @RequestBody Map<String, String> updates) {

        Booking booking = bookingRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (updates.containsKey("status")) {
            booking.setStatus(BookingStatus.valueOf(updates.get("status")));
        }
        if (updates.containsKey("clientName")) {
            booking.setClientName(updates.get("clientName"));
        }
        if (updates.containsKey("notes")) {
            booking.setIntakeNotes(updates.get("notes"));
        }

        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    /** POST /admin/bookings/{id}/refund — cancel and issue Stripe refund */
    @PostMapping("/bookings/{id}/refund")
    public ResponseEntity<?> refundBooking(@PathVariable String id) {
        try {
            bookingService.cancelBooking(java.util.UUID.fromString(id));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /* ── Schedule Day View ─────────────────────────────────────── */

    /**
     * GET /admin/schedule/day?date=YYYY-MM-DD
     * Returns every time slot for the given day: rule-generated, manual overrides,
     * and any bookings, merged into a unified list ordered by time.
     */
    @GetMapping("/schedule/day")
    public ResponseEntity<List<DaySlotDto>> getDaySlots(@RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        ZoneId est = ZoneId.of("America/New_York");

        Instant dayStart = localDate.atStartOfDay(est).toInstant();
        Instant dayEnd   = localDate.plusDays(1).atStartOfDay(est).toInstant();

        // Day-of-week code matching the existing AvailabilityRule convention
        // Java DayOfWeek: Mon=1 … Sun=7; rule stores 0=Sun, 1=Mon … 6=Sat
        int dayCode = localDate.getDayOfWeek().getValue() % 7;

        // ── Rule-generated slots (30-min steps) ──────────────────
        List<AvailabilityRule> rules = availabilityRuleRepository.findAll();
        Set<Instant> ruleSlots = new LinkedHashSet<>();
        for (AvailabilityRule rule : rules) {
            if (!rule.getIsActive()) continue;
            if (!rule.getDayOfWeek().equals(dayCode)) continue;

            ZonedDateTime slotZdt = localDate.atTime(rule.getStartTime()).atZone(est);
            ZonedDateTime endZdt  = localDate.atTime(rule.getEndTime()).atZone(est);

            while (!slotZdt.isAfter(endZdt.minusMinutes(30))) {
                ruleSlots.add(slotZdt.toInstant());
                slotZdt = slotZdt.plusMinutes(30);
            }
        }

        // ── Overrides for this day ────────────────────────────────
        List<ScheduleOverride> overrides = scheduleOverrideRepository.findBySlotTimeBetween(dayStart, dayEnd);
        Map<Instant, ScheduleOverride> overrideByTime = new HashMap<>();
        for (ScheduleOverride o : overrides) {
            overrideByTime.put(o.getSlotTime(), o);
        }

        // ── Bookings for this day ─────────────────────────────────
        List<Booking> dayBookings = bookingRepository.findAll().stream()
                .filter(b -> !b.getStartTime().isBefore(dayStart) && b.getStartTime().isBefore(dayEnd))
                .collect(Collectors.toList());
        Map<Instant, Booking> bookingByTime = new HashMap<>();
        for (Booking b : dayBookings) {
            // Prefer the most recently created booking if there are duplicates
            bookingByTime.merge(b.getStartTime(), b, (existing, newer) ->
                    existing.getCreatedAt().isAfter(newer.getCreatedAt()) ? existing : newer);
        }

        // ── Unified slot set ──────────────────────────────────────
        Set<Instant> allTimes = new TreeSet<>();
        allTimes.addAll(ruleSlots);
        // Add manually-added (non-blocked) override slots
        for (ScheduleOverride o : overrides) {
            if (!o.getBlocked()) allTimes.add(o.getSlotTime());
        }
        // Also include booking times not already covered (edge cases)
        allTimes.addAll(bookingByTime.keySet());

        // ── Build result ──────────────────────────────────────────
        List<DaySlotDto> result = new ArrayList<>();
        for (Instant slotTime : allTimes) {
            ScheduleOverride override = overrideByTime.get(slotTime);
            Booking booking = bookingByTime.get(slotTime);

            String status;
            if (override != null && override.getBlocked()) {
                status = "BLOCKED";
            } else if (booking != null) {
                status = booking.getStatus().name();
            } else {
                status = "AVAILABLE";
            }

            UUID overrideId  = override != null ? override.getId()       : null;
            UUID bookingId   = booking  != null ? booking.getId()        : null;
            String clientName = booking != null ? booking.getClientName() : null;
            String notes     = booking  != null ? booking.getIntakeNotes()
                             : override != null ? override.getNotes()     : null;

            result.add(new DaySlotDto(
                    slotTime.toString(), status, overrideId, bookingId,
                    clientName, notes, ruleSlots.contains(slotTime)));
        }

        // Mark AVAILABLE slots as BLOCKED if they overlap with existing Google Calendar events
        List<CalendarService.BusyInterval> gcalBusy = calendarService.getBusyIntervals(dayStart, dayEnd);
        if (!gcalBusy.isEmpty()) {
            result = result.stream().map(slot -> {
                if (!"AVAILABLE".equals(slot.getStatus())) return slot;
                Instant slotInstant = Instant.parse(slot.getSlotTime());
                Instant slotEnd = slotInstant.plusSeconds(30 * 60);
                boolean busy = gcalBusy.stream().anyMatch(b ->
                        slotInstant.isBefore(b.end()) && slotEnd.isAfter(b.start()));
                return busy
                        ? new DaySlotDto(slot.getSlotTime(), "BLOCKED", null, null, null, "Google Calendar", slot.isRuleGenerated())
                        : slot;
            }).toList();
        }

        return ResponseEntity.ok(result);
    }

    /* ── Schedule Overrides ────────────────────────────────────── */

    /**
     * POST /admin/schedule/overrides
     * Body: { date, localTime, blocked, notes }
     * Creates a schedule override — either blocking a rule-generated slot
     * or adding a manual available slot.
     */
    @PostMapping("/schedule/overrides")
    public ResponseEntity<ScheduleOverride> createOverride(@RequestBody ScheduleOverrideRequest request) {
        LocalDate localDate = LocalDate.parse(request.getDate());
        LocalTime localTime = LocalTime.parse(request.getLocalTime());
        ZoneId est = ZoneId.of("America/New_York");
        Instant slotTime = localDate.atTime(localTime).atZone(est).toInstant();

        ScheduleOverride override = scheduleOverrideRepository.findBySlotTime(slotTime)
                .orElse(new ScheduleOverride());
        override.setSlotTime(slotTime);
        override.setBlocked(request.getBlocked() != null ? request.getBlocked() : false);
        override.setNotes(request.getNotes());

        // If switching from blocked → unblocked, delete the existing GCal block event first
        if (Boolean.FALSE.equals(override.getBlocked()) && override.getGoogleCalendarEventId() != null) {
            calendarService.deleteEvent(override.getGoogleCalendarEventId());
            override.setGoogleCalendarEventId(null);
        }

        scheduleOverrideRepository.save(override);

        if (Boolean.TRUE.equals(override.getBlocked())) {
            Instant slotEnd = slotTime.plusSeconds(30 * 60);
            String gcalId = calendarService.createBlockEvent(slotTime, slotEnd, override.getNotes());
            if (gcalId != null) {
                override.setGoogleCalendarEventId(gcalId);
                scheduleOverrideRepository.save(override);
            }
        }

        return ResponseEntity.ok(override);
    }

    /**
     * GET /admin/schedule/overrides
     * Returns all schedule overrides so the calendar can display blocked slots.
     */
    @GetMapping("/schedule/overrides")
    public ResponseEntity<List<ScheduleOverride>> getOverrides() {
        return ResponseEntity.ok(scheduleOverrideRepository.findAll());
    }

    /**
     * DELETE /admin/schedule/overrides/{id}
     * Removes a schedule override (unblocks a slot or removes a manual slot).
     */
    @DeleteMapping("/schedule/overrides/{id}")
    public ResponseEntity<Void> deleteOverride(@PathVariable UUID id) {
        scheduleOverrideRepository.findById(id).ifPresent(o -> {
            if (o.getGoogleCalendarEventId() != null) {
                calendarService.deleteEvent(o.getGoogleCalendarEventId());
            }
        });
        scheduleOverrideRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /* ── Availability Rules ────────────────────────────────────── */

    @GetMapping("/availability-rules")
    public ResponseEntity<List<AvailabilityRule>> getAvailabilityRules() {
        return ResponseEntity.ok(availabilityRuleRepository.findAll());
    }

    @PostMapping("/availability-rules")
    public ResponseEntity<?> createAvailabilityRule(@RequestBody AvailabilityRule rule) {
        if (!rule.getEndTime().isAfter(rule.getStartTime()))
            return ResponseEntity.badRequest().body(Map.of("error", "End time must be after start time."));
        if (rule.getIsActive() == null || rule.getIsActive()) {
            AvailabilityRule conflict = findOverlappingRule(null, rule.getDayOfWeek(), rule.getStartTime(), rule.getEndTime());
            if (conflict != null)
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Overlaps existing rule: " + conflict.getStartTime() + "–" + conflict.getEndTime()));
        }
        return ResponseEntity.ok(availabilityRuleRepository.save(rule));
    }

    @PatchMapping("/availability-rules/{id}")
    public ResponseEntity<?> updateAvailabilityRule(@PathVariable UUID id,
                                                     @RequestBody Map<String, Object> updates) {
        AvailabilityRule rule = availabilityRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        if (updates.containsKey("dayOfWeek")) rule.setDayOfWeek((Integer) updates.get("dayOfWeek"));
        if (updates.containsKey("startTime")) rule.setStartTime(LocalTime.parse((String) updates.get("startTime")));
        if (updates.containsKey("endTime"))   rule.setEndTime(LocalTime.parse((String) updates.get("endTime")));
        if (updates.containsKey("isActive"))  rule.setIsActive((Boolean) updates.get("isActive"));
        if (!rule.getEndTime().isAfter(rule.getStartTime()))
            return ResponseEntity.badRequest().body(Map.of("error", "End time must be after start time."));
        if (Boolean.TRUE.equals(rule.getIsActive())) {
            AvailabilityRule conflict = findOverlappingRule(id, rule.getDayOfWeek(), rule.getStartTime(), rule.getEndTime());
            if (conflict != null)
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Overlaps existing rule: " + conflict.getStartTime() + "–" + conflict.getEndTime()));
        }
        return ResponseEntity.ok(availabilityRuleRepository.save(rule));
    }

    @DeleteMapping("/availability-rules/{id}")
    public ResponseEntity<Void> deleteAvailabilityRule(@PathVariable UUID id) {
        availabilityRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private AvailabilityRule findOverlappingRule(UUID excludeId, int day, LocalTime start, LocalTime end) {
        return availabilityRuleRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsActive())
                        && r.getDayOfWeek() == day
                        && !r.getId().equals(excludeId)
                        && r.getStartTime().isBefore(end)
                        && r.getEndTime().isAfter(start))
                .findFirst().orElse(null);
    }

    /* ── Legacy availability stub ──────────────────────────────── */

    @PatchMapping("/availability")
    public ResponseEntity<String> updateAvailability() {
        return ResponseEntity.ok("Use /admin/schedule/overrides instead");
    }
}
