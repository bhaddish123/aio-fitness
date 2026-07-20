package com.aiofitness.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "site_content")
public class SiteContent {

    @Id
    private String key;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String value;

    @Column(nullable = false)
    private Instant updatedAt;

    public SiteContent() {}

    public SiteContent(String key, String value) {
        this.key       = key;
        this.value     = value;
        this.updatedAt = Instant.now();
    }

    public String  getKey()              { return key; }
    public void    setKey(String key)    { this.key = key; }
    public String  getValue()            { return value; }
    public void    setValue(String v)    { this.value = v; }
    public Instant getUpdatedAt()        { return updatedAt; }
    public void    setUpdatedAt(Instant v) { this.updatedAt = v; }
}
