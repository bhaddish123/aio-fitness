package com.aiofitness.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "schedule_overrides")
public class ScheduleOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Instant slotTime;

    /** true = this slot is blocked (removed from availability); false = manually added */
    @Column(nullable = false)
    private Boolean blocked;

    private String notes;

    public UUID getId()             { return id; }
    public Instant getSlotTime()    { return slotTime; }
    public void setSlotTime(Instant v) { this.slotTime = v; }
    public Boolean getBlocked()     { return blocked; }
    public void setBlocked(Boolean v)  { this.blocked = v; }
    public String getNotes()        { return notes; }
    public void setNotes(String v)  { this.notes = v; }
}
