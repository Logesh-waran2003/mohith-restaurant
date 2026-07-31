package com.ringerr.dto;

import java.math.BigDecimal;

public class BestSellerDto {

    private Long menuItemId;
    private String menuItemName;
    private long totalQty;
    private BigDecimal totalRevenue;

    public BestSellerDto() {}

    public BestSellerDto(Long menuItemId, String menuItemName, long totalQty, BigDecimal totalRevenue) {
        this.menuItemId = menuItemId;
        this.menuItemName = menuItemName;
        this.totalQty = totalQty;
        this.totalRevenue = totalRevenue;
    }

    public Long getMenuItemId() { return menuItemId; }
    public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
    public String getMenuItemName() { return menuItemName; }
    public void setMenuItemName(String menuItemName) { this.menuItemName = menuItemName; }
    public long getTotalQty() { return totalQty; }
    public void setTotalQty(long totalQty) { this.totalQty = totalQty; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}
