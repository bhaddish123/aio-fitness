-- Seed real session types and business-hour availability rules.
--
-- Session types: removes any existing rows not referenced by a confirmed booking
-- (safe on a fresh or dev database), then inserts the live pricing.
--
-- Availability rules: replaces any previous dev/placeholder rules with
-- Mon–Sat 7 am–2 pm Eastern, which covers the in-person coaching window.
-- Everett can add extra slots (e.g. late-afternoon intro-call windows) via
-- the admin panel's Schedule Overrides without changing these base rules.

DELETE FROM session_types
WHERE id NOT IN (
    SELECT DISTINCT session_type_id FROM bookings WHERE session_type_id IS NOT NULL
);

INSERT INTO session_types (id, name, duration_minutes, price) VALUES
    (gen_random_uuid(), '30-Minute Session', 30,  75.00),
    (gen_random_uuid(), '1-Hour Session',    60, 150.00);

-- day_of_week encoding matches Java DayOfWeek.getValue() % 7:
--   0=Sunday  1=Monday  2=Tuesday  3=Wednesday  4=Thursday  5=Friday  6=Saturday
DELETE FROM availability_rules;

INSERT INTO availability_rules (id, day_of_week, start_time, end_time, is_active) VALUES
    (gen_random_uuid(), 1, '07:00', '14:00', true),  -- Monday
    (gen_random_uuid(), 2, '07:00', '14:00', true),  -- Tuesday
    (gen_random_uuid(), 3, '07:00', '14:00', true),  -- Wednesday
    (gen_random_uuid(), 4, '07:00', '14:00', true),  -- Thursday
    (gen_random_uuid(), 5, '07:00', '14:00', true),  -- Friday
    (gen_random_uuid(), 6, '07:00', '14:00', true);  -- Saturday
