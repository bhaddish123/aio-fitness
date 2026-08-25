-- Deactivate the paid virtual session type for now — the booking flow
-- should only offer the free Complimentary Consultation.
UPDATE session_types SET active = false
WHERE name = 'Virtual Training Session';
