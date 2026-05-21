package com.a3fit.dto;

import java.util.UUID;

/**
 * Represents a single time slot in the admin day-view modal.
 * Status is one of: AVAILABLE, BLOCKED, RESERVED, CONFIRMED, CANCELLED, REFUNDED
 */
public class DaySlotDto {

    private final String slotTime;   // ISO-8601 UTC instant
    private final String status;
    private final UUID overrideId;   // non-null if there is a ScheduleOverride for this slot
    private final UUID bookingId;    // non-null if there is a Booking for this slot
    private final String clientName;
    private final String notes;
    private final boolean ruleGenerated;

    public DaySlotDto(String slotTime, String status, UUID overrideId, UUID bookingId,
                      String clientName, String notes, boolean ruleGenerated) {
        this.slotTime      = slotTime;
        this.status        = status;
        this.overrideId    = overrideId;
        this.bookingId     = bookingId;
        this.clientName    = clientName;
        this.notes         = notes;
        this.ruleGenerated = ruleGenerated;
    }

    public String getSlotTime()      { return slotTime; }
    public String getStatus()        { return status; }
    public UUID getOverrideId()      { return overrideId; }
    public UUID getBookingId()       { return bookingId; }
    public String getClientName()    { return clientName; }
    public String getNotes()         { return notes; }
    public boolean isRuleGenerated() { return ruleGenerated; }
}
