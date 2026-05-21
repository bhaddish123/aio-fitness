package com.a3fit.repository;

import com.a3fit.model.SessionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionTypeRepository extends JpaRepository<SessionType, UUID> {
}