-- For any slot_time with both a blocked=true and a blocked=false row,
-- delete the blocked=true row (the re-added/available state wins).
DELETE FROM schedule_overrides s1
WHERE s1.blocked = true
  AND EXISTS (
    SELECT 1 FROM schedule_overrides s2
    WHERE s2.slot_time = s1.slot_time
      AND s2.blocked = false
  );

-- For any remaining slot_time with duplicate rows (both same blocked value),
-- keep one arbitrary row per slot_time and delete the rest using ctid.
DELETE FROM schedule_overrides
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM schedule_overrides
    GROUP BY slot_time
);

-- Prevent future duplicates at the DB level.
ALTER TABLE schedule_overrides
    ADD CONSTRAINT uq_schedule_overrides_slot_time UNIQUE (slot_time);
