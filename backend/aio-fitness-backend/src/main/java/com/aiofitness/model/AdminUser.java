package com.aiofitness.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import java.util.UUID;


@Entity
public class AdminUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String username;

    public String getUsername() {
        return username;
    }

    private String password; // hashed

    public String getPassword() {
        return password;
    }

    private String role; // e.g. ADMIN

    public String getRole() {
        return role;
    }
}