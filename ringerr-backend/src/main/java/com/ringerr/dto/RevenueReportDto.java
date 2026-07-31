package com.ringerr.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RevenueReportDto {

    private String period;
    private LocalDateTime from;
    private LocalDateTime to;
    private BigDecimal revenue;
    private long orderCount;

    public RevenueReportDto() {}

    public RevenueReportDto(String period, LocalDateTime from, LocalDateTime to,
                             BigDecimal revenue, long orderCount) {
        this.period = period;
        this.from = from;
        this.to = to;
        this.revenue = revenue;
        this.orderCount = orderCount;
    }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public LocalDateTime getFrom() { return from; }
    public void setFrom(LocalDateTime from) { this.from = from; }
    public LocalDateTime getTo() { return to; }
    public void setTo(LocalDateTime to) { this.to = to; }
    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    public long getOrderCount() { return orderCount; }
    public void setOrderCount(long orderCount) { this.orderCount = orderCount; }
}
