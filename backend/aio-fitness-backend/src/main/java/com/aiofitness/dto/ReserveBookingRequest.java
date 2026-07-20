package com.aiofitness.dto;

import com.aiofitness.model.ExperienceLevel;
import com.aiofitness.model.HelpNeededOption;
import com.aiofitness.model.Sex;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Set;
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

    @NotNull(message = "Age is required")
    @Min(value = 13, message = "Age must be at least 13")
    @Max(value = 110, message = "Age must be realistic")
    private Integer age;

    @NotNull(message = "Sex is required")
    private Sex sex;

    @NotBlank(message = "Gym set up is required")
    private String gymSetup;

    @NotNull(message = "Weekly commitment is required")
    @Min(value = 1, message = "Weekly commitment must be between 1 and 7 days")
    @Max(value = 7, message = "Weekly commitment must be between 1 and 7 days")
    private Integer weeklyCommitmentDays;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotBlank(message = "Goals are required")
    private String goals;

    @NotEmpty(message = "Please select at least one area you need help with")
    private Set<HelpNeededOption> helpNeeded;

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
}
