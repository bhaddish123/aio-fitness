-- Add virtual personal training as a bookable session type.
-- Availability window for virtual sessions (7am–6pm) is wider than the
-- in-person window seeded in V6 (7am–2pm). The current availability_rules
-- schema applies one window to all session types, so afternoon virtual-only
-- slots should be opened via admin Schedule Overrides until a per-type
-- availability schema is added.
INSERT INTO session_types (id, name, duration_minutes, price) VALUES
    (gen_random_uuid(), 'Virtual Training Session', 60, 100.00);
