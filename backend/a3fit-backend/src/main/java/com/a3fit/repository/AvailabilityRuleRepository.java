package com.a3fit.repository;

import com.a3fit.model.AvailabilityRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AvailabilityRuleRepository extends JpaRepository<AvailabilityRule, UUID> {
}