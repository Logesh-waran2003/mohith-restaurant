package com.ringerr.controller;

import com.ringerr.dto.TableDto;
import com.ringerr.entity.RestaurantTable.TableStatus;
import com.ringerr.service.TableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    public ResponseEntity<List<TableDto>> findAll() {
        return ResponseEntity.ok(tableService.findAll());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TableDto>> findByStatus(@PathVariable TableStatus status) {
        return ResponseEntity.ok(tableService.findByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TableDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TableDto> create(@RequestBody TableDto req) {
        return ResponseEntity.ok(tableService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TableDto> update(@PathVariable Long id, @RequestBody TableDto req) {
        return ResponseEntity.ok(tableService.update(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TableDto> updateStatus(@PathVariable Long id, @RequestParam TableStatus status) {
        return ResponseEntity.ok(tableService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

