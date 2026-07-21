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

    public UUID getId()                    { return id; }
    public Integer getDayOfWeek()          { return dayOfWeek; }
    public void setDayOfWeek(Integer v)    { this.dayOfWeek = v; }

    private LocalTime startTime;
    public LocalTime getStartTime()        { return startTime; }
    public void setStartTime(LocalTime v)  { this.startTime = v; }

    private LocalTime endTime;
    public LocalTime getEndTime()          { return endTime; }
    public void setEndTime(LocalTime v)    { this.endTime = v; }

    private Boolean isActive = true;
    public Boolean getIsActive()           { return isActive; }
    public void setIsActive(Boolean v)     { this.isActive = v; }
}