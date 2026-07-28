package com.ringerr.dto;

import java.math.BigDecimal;

public class DashboardStatsDto {
    private long totalTables;
    private long availableTables;
    private long occupiedTables;
    private long totalMenuItems;
    private long pendingOrders;
    private long preparingOrders;
    private long todayOrders;
    private BigDecimal todayRevenue;
    private long totalStaff;

    public long getTotalTables() { return totalTables; }
    public void setTotalTables(long totalTables) { this.totalTables = totalTables; }
    public long getAvailableTables() { return availableTables; }
    public void setAvailableTables(long availableTables) { this.availableTables = availableTables; }
    public long getOccupiedTables() { return occupiedTables; }
    public void setOccupiedTables(long occupiedTables) { this.occupiedTables = occupiedTables; }
    public long getTotalMenuItems() { return totalMenuItems; }
    public void setTotalMenuItems(long totalMenuItems) { this.totalMenuItems = totalMenuItems; }
    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }
    public long getPreparingOrders() { return preparingOrders; }
    public void setPreparingOrders(long preparingOrders) { this.preparingOrders = preparingOrders; }
    public long getTodayOrders() { return todayOrders; }
    public void setTodayOrders(long todayOrders) { this.todayOrders = todayOrders; }
    public BigDecimal getTodayRevenue() { return todayRevenue; }
    public void setTodayRevenue(BigDecimal todayRevenue) { this.todayRevenue = todayRevenue; }
    public long getTotalStaff() { return totalStaff; }
    public void setTotalStaff(long totalStaff) { this.totalStaff = totalStaff; }
}
