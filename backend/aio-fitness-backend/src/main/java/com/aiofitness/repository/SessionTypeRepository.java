package com.aiofitness.repository;

import com.aiofitness.model.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionTypeRepository extends JpaRepository<SessionType, UUID> {
}