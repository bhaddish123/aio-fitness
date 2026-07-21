package com.aiofitness.repository;

import com.aiofitness.model.ScheduleOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScheduleOverrideRepository extends JpaRepository<ScheduleOverride, UUID> {
    List<ScheduleOverride> findBySlotTimeBetween(Instant start, Instant end);
    Optional<ScheduleOverride> findBySlotTime(Instant slotTime);
}
