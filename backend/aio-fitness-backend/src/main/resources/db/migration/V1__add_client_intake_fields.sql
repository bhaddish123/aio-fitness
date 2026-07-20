-- Adds the client intake questionnaire fields collected in Step 3 ("Your Details")
-- of the booking wizard, and links them to the bookings table.
--
-- Columns are nullable at the database level (consistent with clientName/clientEmail/
-- clientPhone above them) because pre-existing bookings won't have these values;
-- "required" is enforced at the application layer via Bean Validation on new submissions.

ALTER TABLE bookings
    ADD COLUMN age INTEGER,
    ADD COLUMN sex VARCHAR(10),
    ADD COLUMN gym_setup TEXT,
    ADD COLUMN weekly_commitment_days INTEGER,
    ADD COLUMN experience_level VARCHAR(20),
    ADD COLUMN goals TEXT,
    ADD COLUMN help_needed_other VARCHAR(255);

ALTER TABLE bookings
    ADD CONSTRAINT chk_bookings_age
        CHECK (age IS NULL OR (age BETWEEN 13 AND 110)),
    ADD CONSTRAINT chk_bookings_sex
        CHECK (sex IS NULL OR sex IN ('MALE', 'FEMALE')),
    ADD CONSTRAINT chk_bookings_weekly_commitment_days
        CHECK (weekly_commitment_days IS NULL OR (weekly_commitment_days BETWEEN 1 AND 7)),
    ADD CONSTRAINT chk_bookings_experience_level
        CHECK (experience_level IS NULL OR experience_level IN ('ONE_YEAR_OR_LESS', 'TWO_TO_FOUR_YEARS', 'FOUR_PLUS_YEARS'));

-- Multi-select "What do you need help most with?" answers, one row per selected option.
CREATE TABLE booking_help_needed (
    booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    help_needed VARCHAR(40) NOT NULL,
    CONSTRAINT chk_booking_help_needed_value CHECK (help_needed IN (
        'WEIGHT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'BODYBUILDING',
        'NUTRITION', 'FLEXIBILITY', 'INJURY_PAIN', 'CARDIO', 'OTHER'
    )),
    CONSTRAINT uq_booking_help_needed UNIQUE (booking_id, help_needed)
);

CREATE INDEX idx_booking_help_needed_booking_id ON booking_help_needed(booking_id);
