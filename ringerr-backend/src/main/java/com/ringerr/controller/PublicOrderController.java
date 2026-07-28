package com.ringerr.controller;

import com.ringerr.dto.MenuItemDto;
import com.ringerr.dto.OrderDto;
import com.ringerr.dto.OrderRequest;
import com.ringerr.dto.TableDto;
import com.ringerr.entity.MenuItem;
import com.ringerr.entity.RestaurantTable;
import com.ringerr.repository.MenuItemRepository;
import com.ringerr.repository.RestaurantTableRepository;
import com.ringerr.service.MenuItemService;
import com.ringerr.service.OrderService;
import com.ringerr.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
public class PublicOrderController {

    private final RestaurantTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderService orderService;
    private final TableService tableService;
    private final MenuItemService menuItemService;

    public PublicOrderController(RestaurantTableRepository tableRepository,
                                  MenuItemRepository menuItemRepository,
                                  OrderService orderService,
                                  TableService tableService,
                                  MenuItemService menuItemService) {
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderService = orderService;
        this.tableService = tableService;
        this.menuItemService = menuItemService;
    }

    @GetMapping("/tables/{token}")
    public ResponseEntity<TableDto> getTableByToken(@PathVariable UUID token) {
        RestaurantTable table = tableRepository.findByPublicToken(token)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        return ResponseEntity.ok(tableService.toDto(table));
    }

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemDto>> getMenu() {
        List<MenuItem> items = menuItemRepository.findByAvailableTrue();
        return ResponseEntity.ok(items.stream().map(menuItemService::toDto).collect(Collectors.toList()));
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDto> placeOrder(@RequestBody OrderRequest req) {
        return ResponseEntity.ok(orderService.create(req));
    }
}
