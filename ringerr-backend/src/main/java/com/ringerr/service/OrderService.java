package com.ringerr.service;

import com.ringerr.dto.*;
import com.ringerr.entity.*;
import com.ringerr.entity.Order.OrderStatus;
import com.ringerr.entity.RestaurantTable.TableStatus;
import com.ringerr.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final RestaurantTableRepository tableRepository;
    private final StaffRepository staffRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableService tableService;
    private final StaffService staffService;
    private final MenuItemService menuItemService;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderService(OrderRepository orderRepository,
                        RestaurantTableRepository tableRepository,
                        StaffRepository staffRepository,
                        MenuItemRepository menuItemRepository,
                        TableService tableService,
                        StaffService staffService,
                        MenuItemService menuItemService,
                        SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
        this.staffRepository = staffRepository;
        this.menuItemRepository = menuItemRepository;
        this.tableService = tableService;
        this.staffService = staffService;
        this.menuItemService = menuItemService;
        this.messagingTemplate = messagingTemplate;
    }

    public List<OrderDto> findAll() {
        return orderRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<OrderDto> findActive() {
        return orderRepository.findByStatusIn(
                List.of(OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED)
        ).stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<OrderDto> findByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream().map(this::toDto).collect(Collectors.toList());
    }

    public OrderDto findById(Long id) {
        return orderRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
    }

    public OrderDto create(OrderRequest req) {
        RestaurantTable table = tableRepository.findById(req.getTableId())
                .orElseThrow(() -> new RuntimeException("Table not found: " + req.getTableId()));

        Order order = new Order();
        order.setTable(table);
        order.setNotes(req.getNotes());
        order.setStatus(OrderStatus.PENDING);

        if (req.getStaffId() != null) {
            staffRepository.findById(req.getStaffId()).ifPresent(order::setStaff);
        }

        List<OrderItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemReq : req.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemReq.getMenuItemId()));
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setMenuItem(menuItem);
            oi.setQuantity(itemReq.getQuantity());
            oi.setUnitPrice(menuItem.getPrice());
            oi.setNotes(itemReq.getNotes());
            items.add(oi);
            total = total.add(menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        order.setItems(items);
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);

        // Mark table as occupied
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        OrderDto dto = toDto(saved);
        // Broadcast new order to kitchen via WebSocket
        messagingTemplate.convertAndSend("/topic/orders", dto);
        return dto;
    }

    public OrderDto updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(status);

        // If paid or cancelled, free the table
        if (status == OrderStatus.PAID || status == OrderStatus.CANCELLED) {
            RestaurantTable table = order.getTable();
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);
        }

        OrderDto dto = toDto(orderRepository.save(order));
        // Broadcast status change to all connected clients
        messagingTemplate.convertAndSend("/topic/orders", dto);
        return dto;
    }

    public void delete(Long id) {
        orderRepository.deleteById(id);
    }

    public OrderDto toDto(Order o) {
        OrderDto dto = new OrderDto();
        dto.setId(o.getId());
        dto.setTable(tableService.toDto(o.getTable()));
        if (o.getStaff() != null) dto.setStaff(staffService.toDto(o.getStaff()));
        dto.setStatus(o.getStatus());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setNotes(o.getNotes());
        dto.setCreatedAt(o.getCreatedAt());
        dto.setUpdatedAt(o.getUpdatedAt());
        List<OrderItemDto> itemDtos = o.getItems().stream().map(oi -> {
            OrderItemDto oid = new OrderItemDto();
            oid.setId(oi.getId());
            oid.setMenuItemId(oi.getMenuItem().getId());
            oid.setMenuItemName(oi.getMenuItem().getName());
            oid.setQuantity(oi.getQuantity());
            oid.setUnitPrice(oi.getUnitPrice());
            oid.setSubtotal(oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())));
            oid.setNotes(oi.getNotes());
            return oid;
        }).collect(Collectors.toList());
        dto.setItems(itemDtos);
        return dto;
    }
}
