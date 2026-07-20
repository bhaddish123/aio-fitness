package com.aiofitness.service;

import com.aiofitness.model.Booking;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

/**
 * Puts confirmed bookings onto Everett's Google Calendar via a service
 * account — he shares his calendar with the service account's email
 * once, and from then on events appear with no login/consent flow on
 * his end. Every public method swallows its own exceptions and logs;
 * a Calendar API outage must never block a booking from confirming.
 */
@Service
public class CalendarService {

    private static final Logger log = LoggerFactory.getLogger(CalendarService.class);
    private static final String APPLICATION_NAME = "AIO Fitness Booking";
    private static final ZoneId ZONE = ZoneId.of("America/New_York");

    @Value("${google.calendar.id:}")
    private String calendarId;

    @Value("${google.calendar.credentials-json:}")
    private String credentialsJson;

    private Calendar calendar;

    private boolean isConfigured() {
        return calendarId != null && !calendarId.isBlank()
                && credentialsJson != null && !credentialsJson.isBlank();
    }

    private synchronized Calendar getClient() throws IOException, GeneralSecurityException {
        if (calendar != null) return calendar;

        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8)))
                .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

        calendar = new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
        return calendar;
    }

    /** Creates the calendar event for a newly-confirmed booking and returns its event ID (or null if skipped/failed). */
    public String createEvent(Booking booking) {
        if (!isConfigured()) {
            log.warn("Google Calendar not configured (google.calendar.id / google.calendar.credentials-json) — skipping event creation for booking {}", booking.getId());
            return null;
        }

        try {
            com.google.api.services.calendar.model.Event event = new com.google.api.services.calendar.model.Event()
                    .setSummary("Training Session — " + booking.getClientName())
                    .setLocation("Devon, PA")
                    .setDescription(buildDescription(booking))
                    .setStart(toEventDateTime(booking.getStartTime()))
                    .setEnd(toEventDateTime(booking.getEndTime()));

            com.google.api.services.calendar.model.Event created = getClient()
                    .events()
                    .insert(calendarId, event)
                    .execute();

            log.info("Created Google Calendar event {} for booking {}", created.getId(), booking.getId());
            return created.getId();
        } catch (Exception e) {
            log.error("Failed to create Google Calendar event for booking {}: {}", booking.getId(), e.getMessage(), e);
            return null;
        }
    }

    /** Removes the calendar event for a cancelled/refunded booking, if one was created. */
    public void deleteEvent(String eventId) {
        if (eventId == null || eventId.isBlank() || !isConfigured()) return;

        try {
            getClient().events().delete(calendarId, eventId).execute();
            log.info("Deleted Google Calendar event {}", eventId);
        } catch (Exception e) {
            log.error("Failed to delete Google Calendar event {}: {}", eventId, e.getMessage(), e);
        }
    }

    private EventDateTime toEventDateTime(java.time.Instant instant) {
        return new EventDateTime()
                .setDateTime(new com.google.api.client.util.DateTime(instant.toEpochMilli()))
                .setTimeZone(ZONE.getId());
    }

    private String buildDescription(Booking booking) {
        List<String> lines = List.of(
                "Session: " + booking.getSessionType().getName(),
                "Client: " + booking.getClientName(),
                "Email: " + booking.getClientEmail(),
                "Phone: " + (booking.getClientPhone() == null ? "n/a" : booking.getClientPhone())
        );
        return String.join("\n", lines);
    }
}
