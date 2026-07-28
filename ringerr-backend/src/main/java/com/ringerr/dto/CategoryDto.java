package com.ringerr.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CategoryDto {
    private Long id;
    private String name;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;

    public CategoryDto() {}

    public CategoryDto(Long id, String name, String description, boolean active, LocalDateTime createdAt) {
        this.id = id; this.name = name; this.description = description;
        this.active = active; this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
