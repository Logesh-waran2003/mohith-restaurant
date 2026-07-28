package com.ringerr.dto;

import com.ringerr.entity.RestaurantTable.TableStatus;
import java.util.UUID;

public class TableDto {
    private Long id;
    private Integer tableNumber;
    private Integer capacity;
    private TableStatus status;
    private String location;
    private UUID publicToken;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getTableNumber() { return tableNumber; }
    public void setTableNumber(Integer tableNumber) { this.tableNumber = tableNumber; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public TableStatus getStatus() { return status; }
    public void setStatus(TableStatus status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public UUID getPublicToken() { return publicToken; }
    public void setPublicToken(UUID publicToken) { this.publicToken = publicToken; }
}
