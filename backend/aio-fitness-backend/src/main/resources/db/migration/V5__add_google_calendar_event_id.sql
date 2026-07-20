-- Tracks the Google Calendar event created for a confirmed booking, so it
-- can be deleted again if the booking is later cancelled/refunded.
ALTER TABLE bookings ADD COLUMN google_calendar_event_id VARCHAR(255);
