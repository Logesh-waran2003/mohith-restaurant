package com.ringerr.dto;

public class PeakHourDto {

    private int hour;
    private long orderCount;

    public PeakHourDto() {}

    public PeakHourDto(int hour, long orderCount) {
        this.hour = hour;
        this.orderCount = orderCount;
    }

    public int getHour() { return hour; }
    public void setHour(int hour) { this.hour = hour; }
    public long getOrderCount() { return orderCount; }
    public void setOrderCount(long orderCount) { this.orderCount = orderCount; }
}
