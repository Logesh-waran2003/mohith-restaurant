package com.ringerr.controller;

import com.ringerr.dto.MenuItemDto;
import com.ringerr.dto.MenuItemRequest;
import com.ringerr.service.MenuItemService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @GetMapping
    public ResponseEntity<List<MenuItemDto>> findAll() {
        return ResponseEntity.ok(menuItemService.findAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<MenuItemDto>> findAvailable() {
        return ResponseEntity.ok(menuItemService.findAvailable());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<MenuItemDto>> findByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(menuItemService.findByCategory(categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.findById(id));
    }

    @PostMapping
    public ResponseEntity<MenuItemDto> create(@Valid @RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuItemService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemDto> update(@PathVariable Long id, @Valid @RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuItemService.update(id, req));
    }

    @PatchMapping("/{id}/toggle-availability")
    public ResponseEntity<MenuItemDto> toggleAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.toggleAvailability(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
