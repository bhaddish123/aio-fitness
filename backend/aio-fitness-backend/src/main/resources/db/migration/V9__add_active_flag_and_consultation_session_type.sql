-- Add active flag to session_types so individual types can be deactivated
-- without hard-deleting rows that existing bookings may reference via FK.
ALTER TABLE session_types ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Deactivate the original in-person price tiers — they are replaced by the
-- Complimentary Consultation (free) as the primary bookable slot.
UPDATE session_types SET active = false
WHERE name IN ('30-Minute Session', '1-Hour Session');

-- Seed the primary booking CTA target: a free consultation slot.
INSERT INTO session_types (id, name, duration_minutes, price, active)
VALUES (gen_random_uuid(), 'Complimentary Consultation', 30, 0.00, true);
