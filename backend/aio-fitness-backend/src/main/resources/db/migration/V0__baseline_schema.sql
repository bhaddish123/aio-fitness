-- Baseline schema for a brand-new, empty database.
--
-- The original a3fit_backend database had this schema created automatically by
-- Hibernate's old ddl-auto:update strategy, so it was never captured in a migration
-- script. For that database, Flyway's baseline-on-migrate marks it as already being
-- at version 0, so this script never actually runs there — it only matters when
-- pointing the app at a genuinely empty database for the first time.
--
-- Deliberately does NOT include a unique constraint on bookings.start_time —
-- that was a legacy mistake in the old database, cleaned up for it in
-- V2__drop_legacy_start_time_unique_constraint.sql. New databases should never have it.

CREATE TABLE IF NOT EXISTS session_types (
    id               UUID PRIMARY KEY,
    name             VARCHAR(255),
    duration_minutes INTEGER,
    price            NUMERIC(38,2)
);

CREATE TABLE IF NOT EXISTS availability_rules (
    id           UUID PRIMARY KEY,
    day_of_week  INTEGER,
    start_time   TIME,
    end_time     TIME,
    is_active    BOOLEAN
);

CREATE TABLE IF NOT EXISTS schedule_overrides (
    id        UUID PRIMARY KEY,
    slot_time TIMESTAMP NOT NULL,
    blocked   BOOLEAN NOT NULL,
    notes     VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bookings (
    id                       UUID PRIMARY KEY,
    session_type_id          UUID NOT NULL REFERENCES session_types(id),
    client_name              VARCHAR(255),
    client_email             VARCHAR(255),
    client_phone             VARCHAR(255),
    intake_notes              TEXT,
    waiver_accepted           BOOLEAN NOT NULL DEFAULT false,
    start_time                TIMESTAMP,
    end_time                  TIMESTAMP,
    status                    VARCHAR(20),
    reserved_until            TIMESTAMP,
    stripe_session_id         VARCHAR(255),
    cancellation_token        VARCHAR(255) UNIQUE,
    sent24h_reminder          BOOLEAN NOT NULL DEFAULT false,
    sent2h_reminder           BOOLEAN NOT NULL DEFAULT false,
    sent_post_session_email   BOOLEAN NOT NULL DEFAULT false,
    created_at                TIMESTAMP,
    updated_at                TIMESTAMP
);
