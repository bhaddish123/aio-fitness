package com.aiofitness.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;

import java.util.UUID;
import java.math.BigDecimal;

@Entity
@Table(name = "session_types")
public class SessionType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name; // 30 min / 60 min

    public String getName() {
        return name;
    }

    private Integer durationMinutes;

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    private BigDecimal price;

    public BigDecimal getPrice() {
        return price;
    }

    public UUID getId() {
        return id;
    }
}