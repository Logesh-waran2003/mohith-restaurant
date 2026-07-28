package com.ringerr.service;

import com.ringerr.dto.DashboardStatsDto;
import com.ringerr.entity.Order.OrderStatus;
import com.ringerr.entity.RestaurantTable.TableStatus;
import com.ringerr.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final StaffRepository staffRepository;

    public DashboardService(OrderRepository orderRepository,
                            RestaurantTableRepository tableRepository,
                            MenuItemRepository menuItemRepository,
                            StaffRepository staffRepository) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.staffRepository = staffRepository;
    }

    public DashboardStatsDto getStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        stats.setTotalTables(tableRepository.count());
        stats.setAvailableTables(tableRepository.countByStatus(TableStatus.AVAILABLE));
        stats.setOccupiedTables(tableRepository.countByStatus(TableStatus.OCCUPIED));
        stats.setTotalMenuItems(menuItemRepository.countByAvailableTrue());
        stats.setPendingOrders(orderRepository.countByStatus(OrderStatus.PENDING));
        stats.setPreparingOrders(orderRepository.countByStatus(OrderStatus.PREPARING));
        stats.setTotalStaff(staffRepository.findByActiveTrue().size());

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        stats.setTodayOrders(orderRepository.countOrdersByDateRange(todayStart, todayEnd));
        stats.setTodayRevenue(orderRepository.sumRevenueByDateRange(todayStart, todayEnd));

        return stats;
    }
}
