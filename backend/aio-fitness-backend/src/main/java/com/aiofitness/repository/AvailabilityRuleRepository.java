package com.aiofitness.repository;

import com.aiofitness.model.AvailabilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AvailabilityRuleRepository extends JpaRepository<AvailabilityRule, UUID> {
}