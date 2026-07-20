package com.aiofitness.dto;

public class ScheduleOverrideRequest {

    /** e.g. "2026-04-07" */
    private String date;

    /** 24-hour local time, e.g. "09:00" */
    private String localTime;

    /** true = block this slot; false = add a manual available slot */
    private Boolean blocked;

    private String notes;

    public String getDate()       { return date; }
    public void setDate(String v) { this.date = v; }

    public String getLocalTime()       { return localTime; }
    public void setLocalTime(String v) { this.localTime = v; }

    public Boolean getBlocked()        { return blocked; }
    public void setBlocked(Boolean v)  { this.blocked = v; }

    public String getNotes()       { return notes; }
    public void setNotes(String v) { this.notes = v; }
}
