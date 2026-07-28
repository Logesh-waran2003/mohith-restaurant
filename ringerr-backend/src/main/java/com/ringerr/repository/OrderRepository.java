package com.ringerr.repository;

import com.ringerr.entity.Order;
import com.ringerr.entity.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByTableId(Long tableId);
    List<Order> findByStaffId(Long staffId);
    List<Order> findByStatusIn(List<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'PAID' AND o.createdAt >= :from AND o.createdAt < :to")
    BigDecimal sumRevenueByDateRange(LocalDateTime from, LocalDateTime to);

    long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from AND o.createdAt < :to")
    long countOrdersByDateRange(LocalDateTime from, LocalDateTime to);
}
