package com.a3fit.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public class ReserveBookingRequest {

    @NotNull(message = "Session type is required")
    private UUID sessionTypeId;

    @NotBlank(message = "Name is required")
    private String clientName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String clientEmail;

    @NotBlank(message = "Phone is required")
    private String clientPhone;

    @NotNull(message = "Start time is required")
    private Instant startTime;
    public UUID getSessionTypeId() {
        return sessionTypeId;
    }
    public void setSessionTypeId(UUID sessionTypeId) {
        this.sessionTypeId = sessionTypeId;
    }
    public String getClientName() {
        return clientName;
    }
    public void setClientName(String clientName) {
        this.clientName = clientName;
    }
    public String getClientEmail() {
        return clientEmail;
    }
    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }
    public String getClientPhone() {
        return clientPhone;
    }
    public void setClientPhone(String clientPhone) {
        this.clientPhone = clientPhone;
    }
    public Instant getStartTime() {
        return startTime;
    }
    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }
    private String intakeNotes;
    private boolean waiverAccepted;

    public String getIntakeNotes() {
        return intakeNotes;
    }
    public void setIntakeNotes(String intakeNotes) {
        this.intakeNotes = intakeNotes;
    }

    public boolean isWaiverAccepted() {
        return waiverAccepted;
    }
    public void setWaiverAccepted(boolean waiverAccepted) {
        this.waiverAccepted = waiverAccepted;
    }
}