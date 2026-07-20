package com.aiofitness.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalTime;
import java.util.UUID;
import jakarta.persistence.Table;


@Entity
@Table(name = "availability_rules")
public class AvailabilityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private Integer dayOfWeek; // 0-6

    public Integer getDayOfWeek() {
        return dayOfWeek;
    }

    private LocalTime startTime;
    public LocalTime getStartTime() {
        return startTime;
    }

    private LocalTime endTime;

    public LocalTime getEndTime() {
        return endTime;
    }

    private Boolean isActive = true;

    public Boolean getIsActive() {
        return isActive;
    }
}