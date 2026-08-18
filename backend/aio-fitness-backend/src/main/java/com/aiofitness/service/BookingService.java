package com.aiofitness.service;

import com.aiofitness.dto.ReserveBookingRequest;
import com.aiofitness.model.AvailabilityRule;
import com.aiofitness.model.Booking;
import com.aiofitness.model.BookingStatus;
import com.aiofitness.model.HelpNeededOption;
import com.aiofitness.model.SessionType;
import com.aiofitness.repository.AvailabilityRuleRepository;
import com.aiofitness.repository.BookingRepository;
import com.aiofitness.repository.ScheduleOverrideRepository;
import com.aiofitness.repository.SessionTypeRepository;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Value("${app.base-url}")
    private String baseUrl;

    private final BookingRepository bookingRepository;
    private final SessionTypeRepository sessionTypeRepository;
    private final AvailabilityRuleRepository availabilityRuleRepository;
    private final ScheduleOverrideRepository scheduleOverrideRepository;
    private final EmailService emailService;
    private final CalendarService calendarService;

    public BookingService(BookingRepository bookingRepository,
                          SessionTypeRepository sessionTypeRepository,
                          AvailabilityRuleRepository availabilityRuleRepository,
                          ScheduleOverrideRepository scheduleOverrideRepository,
                          EmailService emailService,
                          CalendarService calendarService) {
        this.bookingRepository = bookingRepository;
        this.sessionTypeRepository = sessionTypeRepository;
        this.availabilityRuleRepository = availabilityRuleRepository;
        this.scheduleOverrideRepository = scheduleOverrideRepository;
        this.emailService = emailService;
        this.calendarService = calendarService;
    }
    @Transactional
    public synchronized Booking reserveSlot(ReserveBookingRequest request) {
        if (!request.isWaiverAccepted()) {
            throw new RuntimeException("You must accept the waiver and policy to book a session");
        }

        if (request.getHelpNeeded().contains(HelpNeededOption.OTHER)
                && (request.getHelpNeededOther() == null || request.getHelpNeededOther().isBlank())) {
            throw new RuntimeException("Please specify what 'Other' refers to");
        }

        Instant now = Instant.now();
        Instant sixHoursFromNow = now.plusSeconds(6 * 60 * 60);

        if (request.getStartTime().isBefore(sixHoursFromNow)) {
            throw new RuntimeException("Bookings must be made at least 6 hours in advance");
        }

        SessionType sessionType = sessionTypeRepository
                .findById(request.getSessionTypeId())
                .orElseThrow(() -> new RuntimeException("Session type not found"));

        // Check for overlap with any active booking
        Instant reqStart = request.getStartTime();
        Instant reqEnd   = reqStart.plus(sessionType.getDurationMinutes(), ChronoUnit.MINUTES);
        boolean overlaps = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED ||
                            (b.getStatus() == BookingStatus.RESERVED &&
                             Instant.now().isBefore(b.getReservedUntil())))
                .anyMatch(b -> reqStart.isBefore(b.getEndTime()) && reqEnd.isAfter(b.getStartTime()));
        if (overlaps) throw new RuntimeException("Time slot already booked");

        // Validate that the session fits within an availability rule window,
        // OR that it was explicitly added as a manual override slot by the admin.
        ZonedDateTime startZdt = request.getStartTime().atZone(ZoneId.of("America/New_York"));
        LocalTime startLocal = startZdt.toLocalTime();
        LocalTime endLocal = startLocal.plusMinutes(sessionType.getDurationMinutes());
        int dayOfWeek = startZdt.getDayOfWeek().getValue() % 7;

        boolean isManualOverride = scheduleOverrideRepository
                .findBySlotTime(request.getStartTime())
                .map(o -> Boolean.FALSE.equals(o.getBlocked()))
                .orElse(false);

        if (!isManualOverride) {
            List<AvailabilityRule> rules = availabilityRuleRepository.findAll();
            boolean fitsInWindow = rules.stream()
                    .filter(AvailabilityRule::getIsActive)
                    .anyMatch(rule -> rule.getDayOfWeek() == dayOfWeek
                            && !startLocal.isBefore(rule.getStartTime())
                            && !endLocal.isAfter(rule.getEndTime()));

            if (!fitsInWindow) {
                throw new RuntimeException("Selected time slot does not fit within available hours");
            }
        }

        Booking booking = new Booking();
        booking.setSessionType(sessionType);
        booking.setClientName(request.getClientName());
        booking.setClientEmail(request.getClientEmail());
        booking.setClientPhone(request.getClientPhone());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getStartTime().plus(sessionType.getDurationMinutes(), ChronoUnit.MINUTES));
        booking.setIntakeNotes(request.getIntakeNotes());
        booking.setWaiverAccepted(request.isWaiverAccepted());
        booking.setAge(request.getAge());
        booking.setSex(request.getSex());
        booking.setGymSetup(request.getGymSetup());
        booking.setWeeklyCommitmentDays(request.getWeeklyCommitmentDays());
        booking.setExperienceLevel(request.getExperienceLevel());
        booking.setGoals(request.getGoals());
        booking.setHelpNeeded(new HashSet<>(request.getHelpNeeded()));
        booking.setHelpNeededOther(request.getHelpNeededOther());

        booking.setStatus(BookingStatus.RESERVED);
        booking.setReservedUntil(Instant.now().plusSeconds(300));
        booking.setCancellationToken(UUID.randomUUID().toString());

        Booking saved;
        try {
            saved = bookingRepository.save(booking);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Time slot already booked");
        }

        // Free sessions (e.g. Complimentary Consultation) skip Stripe entirely:
        // confirm immediately and trigger the same post-payment actions the
        // Stripe webhook would normally fire.
        if (sessionType.getPrice().compareTo(java.math.BigDecimal.ZERO) == 0) {
            saved.setStatus(BookingStatus.CONFIRMED);
            saved = bookingRepository.save(saved);
            try {
                emailService.sendConfirmation(saved);
            } catch (Exception e) {
                log.error("Failed to send confirmation email for free booking {}: {}", saved.getId(), e.getMessage(), e);
            }
            String eventId = calendarService.createEvent(saved);
            if (eventId != null) {
                saved.setGoogleCalendarEventId(eventId);
                saved = bookingRepository.save(saved);
            }
        }

        return saved;
    }

    public void confirmStripePayment(String stripeSessionId) {

        Booking booking = bookingRepository
                .findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Booking not found for Stripe session"));

        // Idempotency check
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            return; // already confirmed, ignore duplicate webhook
        }

        // Reject if the 5-minute reservation window has expired
        if (booking.getReservedUntil() != null && Instant.now().isAfter(booking.getReservedUntil())) {
            if (booking.getStripeSessionId() != null) {
                try {
                    Session expired = Session.retrieve(booking.getStripeSessionId());
                    if (expired.getPaymentIntent() != null) {
                        Refund.create(RefundCreateParams.builder()
                                .setPaymentIntent(expired.getPaymentIntent())
                                .build());
                    }
                } catch (Exception e) {
                    // Log and continue — booking is still marked refunded so it won't be confirmed
                }
            }
            booking.setStatus(BookingStatus.REFUNDED);
            bookingRepository.save(booking);
            try {
                emailService.sendFailedPayment(booking);
            } catch (Exception e) {
                // Log — don't fail if email fails
            }
            return;
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        try {
            emailService.sendConfirmation(booking);
        } catch (Exception e) {
            log.error("Failed to send confirmation email for booking {}: {}", booking.getId(), e.getMessage(), e);
        }

        // Calendar failures must never undo a confirmed/paid booking —
        // CalendarService already logs internally and returns null on failure.
        String eventId = calendarService.createEvent(booking);
        if (eventId != null) {
            booking.setGoogleCalendarEventId(eventId);
            bookingRepository.save(booking);
        }
    }

    public void cancelBooking(UUID bookingId) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.REFUNDED ||
            booking.getStatus() == BookingStatus.COMPLETED ||
            booking.getStatus() == BookingStatus.NO_SHOW) {
            throw new RuntimeException("This booking cannot be cancelled");
        }

        if (booking.getStripeSessionId() != null) {
            try {
                Session session = Session.retrieve(booking.getStripeSessionId());
                String paymentIntentId = session.getPaymentIntent();

                if (paymentIntentId != null) {
                    long hoursUntilSession = java.time.Duration.between(Instant.now(), booking.getStartTime()).toHours();

                    // No refund for cancellations within 24 hours of the session
                    if (hoursUntilSession > 24) {
                        Refund.create(RefundCreateParams.builder()
                                .setPaymentIntent(paymentIntentId)
                                .build());
                    } else {
                        log.info("No refund issued for booking {} — cancelled within 24 hours of session", booking.getId());
                    }
                }
            } catch (com.stripe.exception.StripeException e) {
                log.error("Stripe refund failed for booking {}: [{}] {}", booking.getId(), e.getCode(), e.getMessage());
                throw new RuntimeException("Stripe refund failed: " + e.getMessage(), e);
            }
        }

        booking.setStatus(booking.getStripeSessionId() != null ? BookingStatus.REFUNDED : BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        calendarService.deleteEvent(booking.getGoogleCalendarEventId());

        try {
            emailService.sendCancellation(booking);
        } catch (Exception e) {
            log.error("Failed to send cancellation email for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    public void cancelByToken(String token) throws Exception {
        Booking booking = bookingRepository
                .findByCancellationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid cancellation token"));

        if (booking.getStatus() == BookingStatus.REFUNDED ||
            booking.getStatus() == BookingStatus.COMPLETED ||
            booking.getStatus() == BookingStatus.NO_SHOW) {
            throw new RuntimeException("This booking cannot be cancelled");
        }

        // Save cancellation first so it always succeeds regardless of Stripe outcome
        booking.setStatus(booking.getStripeSessionId() != null ? BookingStatus.REFUNDED : BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        calendarService.deleteEvent(booking.getGoogleCalendarEventId());

        try {
            emailService.sendCancellation(booking);
        } catch (Exception e) {
            log.error("Failed to send cancellation email for booking {}: {}", booking.getId(), e.getMessage());
        }

        // Attempt Stripe refund after saving — failure here doesn't un-cancel the booking
        if (booking.getStripeSessionId() != null) {
            try {
                Session session = Session.retrieve(booking.getStripeSessionId());
                String paymentIntentId = session.getPaymentIntent();

                if (paymentIntentId != null) {
                    long hoursUntilSession = java.time.Duration.between(Instant.now(), booking.getStartTime()).toHours();

                    // No refund for cancellations within 24 hours of the session
                    if (hoursUntilSession <= 24) {
                        log.info("No refund issued for booking {} — cancelled within 24 hours of session", booking.getId());
                    } else {
                        Refund.create(RefundCreateParams.builder()
                                .setPaymentIntent(paymentIntentId)
                                .build());
                    }
                }
            } catch (Exception e) {
                log.error("Stripe refund failed for booking {} (booking still cancelled): {}", booking.getId(), e.getMessage());
            }
        }
    }

    public Session createCheckoutSession(Booking booking) throws Exception {

        SessionCreateParams params =
                SessionCreateParams.builder()
                        .setMode(SessionCreateParams.Mode.PAYMENT)
                        .setSuccessUrl(baseUrl + "/success")
                        .setCancelUrl(baseUrl + "/cancel")
                        .addLineItem(
                                SessionCreateParams.LineItem.builder()
                                        .setQuantity(1L)
                                        .setPriceData(
                                                SessionCreateParams.LineItem.PriceData.builder()
                                                        .setCurrency("usd")
                                                        .setUnitAmount(booking.getSessionType().getPrice().movePointRight(2).longValue())
                                                        .setProductData(
                                                                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                        .setName(booking.getSessionType().getName())
                                                                        .build())
                                                        .build())
                                        .build())
                        .putMetadata("bookingId", booking.getId().toString())
                        .build();

        return Session.create(params);
    }
    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    public Booking getBookingById(UUID id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }
}
