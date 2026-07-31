package com.ringerr.repository;

import com.ringerr.entity.Order;
import com.ringerr.entity.Order.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByTableId(Long tableId);
    List<Order> findByStaffId(Long staffId);
    List<Order> findByStatusIn(List<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'PAID' AND o.createdAt >= :from AND o.createdAt < :to")
    BigDecimal sumRevenueByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :from AND o.createdAt < :to")
    long countOrdersByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT oi.menuItem.id, oi.menuItem.name, SUM(oi.quantity), SUM(oi.quantity * oi.unitPrice) " +
           "FROM OrderItem oi JOIN oi.order o " +
           "WHERE o.status = 'PAID' " +
           "GROUP BY oi.menuItem.id, oi.menuItem.name " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findBestSellers();

    @Query(value = "SELECT EXTRACT(HOUR FROM o.created_at)::int AS hour, COUNT(o.id) AS order_count " +
                   "FROM orders o " +
                   "WHERE o.status = 'PAID' AND o.created_at >= :from AND o.created_at < :to " +
                   "GROUP BY EXTRACT(HOUR FROM o.created_at)",
           nativeQuery = true)
    List<Object[]> findOrdersByHour(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = 'PAID' AND o.createdAt >= :from AND o.createdAt < :to")
    BigDecimal sumPaidRevenueByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'PAID' AND o.createdAt >= :from AND o.createdAt < :to")
    long countPaidOrdersByDateRange(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Order> findByCreatedAtBetweenAndStatus(LocalDateTime from, LocalDateTime to, OrderStatus status);
}
