package com.aiofitness.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
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

    private Integer age;

    @Enumerated(EnumType.STRING)
    private Sex sex;

    @Column(columnDefinition = "TEXT")
    private String gymSetup;

    private Integer weeklyCommitmentDays;

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Column(columnDefinition = "TEXT")
    private String goals;

    @ElementCollection(targetClass = HelpNeededOption.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "booking_help_needed", joinColumns = @JoinColumn(name = "booking_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "help_needed", nullable = false)
    private Set<HelpNeededOption> helpNeeded = new HashSet<>();

    private String helpNeededOther;

    public Integer getAge() {
        return age;
    }
    public void setAge(Integer age) {
        this.age = age;
    }
    public Sex getSex() {
        return sex;
    }
    public void setSex(Sex sex) {
        this.sex = sex;
    }
    public String getGymSetup() {
        return gymSetup;
    }
    public void setGymSetup(String gymSetup) {
        this.gymSetup = gymSetup;
    }
    public Integer getWeeklyCommitmentDays() {
        return weeklyCommitmentDays;
    }
    public void setWeeklyCommitmentDays(Integer weeklyCommitmentDays) {
        this.weeklyCommitmentDays = weeklyCommitmentDays;
    }
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
    public String getGoals() {
        return goals;
    }
    public void setGoals(String goals) {
        this.goals = goals;
    }
    public Set<HelpNeededOption> getHelpNeeded() {
        return helpNeeded;
    }
    public void setHelpNeeded(Set<HelpNeededOption> helpNeeded) {
        this.helpNeeded = helpNeeded;
    }
    public String getHelpNeededOther() {
        return helpNeededOther;
    }
    public void setHelpNeededOther(String helpNeededOther) {
        this.helpNeededOther = helpNeededOther;
    }

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

    @Column(name = "google_calendar_event_id")
    private String googleCalendarEventId;

    public String getGoogleCalendarEventId() {
        return googleCalendarEventId;
    }
    public void setGoogleCalendarEventId(String googleCalendarEventId) {
        this.googleCalendarEventId = googleCalendarEventId;
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
