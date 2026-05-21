package com.a3fit.repository;

import com.a3fit.model.ScheduleOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ScheduleOverrideRepository extends JpaRepository<ScheduleOverride, UUID> {
    List<ScheduleOverride> findBySlotTimeBetween(Instant start, Instant end);
}
