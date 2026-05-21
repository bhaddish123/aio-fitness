package com.a3fit.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "session_type_id", nullable = false)
    private SessionType sessionType;

    private String clientName;
    public String getClientName() {
        return clientName;
    }
    public void setClientName(String clientName) {
        this.clientName = clientName;
    }
    private String clientEmail;
    public String getClientEmail() {
        return clientEmail;
    }
    public void setClientEmail(String clientEmail) {
        this.clientEmail = clientEmail;
    }
    private String clientPhone;

    public String getClientPhone() {
        return clientPhone;
    }
    public void setClientPhone(String clientPhone) {
        this.clientPhone = clientPhone;
    }
    @Column(columnDefinition = "TEXT")
    private String intakeNotes;

    @Column(nullable = false)
    private boolean waiverAccepted = false;

    public String getIntakeNotes() {
        return intakeNotes;
    }

    public Instant getStartTime() {
        return startTime;
    }
    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }
    public BookingStatus getStatus() {
        return status;
    }
    public void setStatus(BookingStatus status) {
        this.status = status;
    }
    public Instant getReservedUntil() {
        return reservedUntil;
    }
    public void setReservedUntil(Instant reservedUntil) {
        this.reservedUntil = reservedUntil;
    }
    private Instant startTime;
    private Instant endTime;

    public Instant getEndTime() {
        return endTime;
    }
    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }
    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private Instant reservedUntil;

    private String stripeSessionId;

    public String getStripeSessionId() {
        return stripeSessionId;
    }

    public void setId(UUID id) {
        this.id = id;
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
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    @Column(unique = true)
    private String cancellationToken;

    public String getCancellationToken() {
        return cancellationToken;
    }
    public void setCancellationToken(String cancellationToken) {
        this.cancellationToken = cancellationToken;
    }
    @Column(nullable = false)
    private boolean sent24hReminder = false;

    @Column(nullable = false)
    private boolean sent2hReminder = false;

    @Column(nullable = false)
    private boolean sentPostSessionEmail = false;

    public boolean isSent24hReminder() { return sent24hReminder; }
    public void setSent24hReminder(boolean sent24hReminder) { this.sent24hReminder = sent24hReminder; }

    public boolean isSent2hReminder() { return sent2hReminder; }
    public void setSent2hReminder(boolean sent2hReminder) { this.sent2hReminder = sent2hReminder; }

    public boolean isSentPostSessionEmail() { return sentPostSessionEmail; }
    public void setSentPostSessionEmail(boolean sentPostSessionEmail) { this.sentPostSessionEmail = sentPostSessionEmail; }

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId(){
        return id;
    }

    public SessionType getSessionType() {
        return sessionType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setSessionType(SessionType sessionType) {
        this.sessionType = sessionType;
    }

    public void setStripeSessionId(String stripeSessionId) {
        this.stripeSessionId = stripeSessionId;
    }
}
