package com.ringerr.controller;

import com.ringerr.dto.StaffDto;
import com.ringerr.dto.StaffRequest;
import com.ringerr.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<List<StaffDto>> findAll() {
        return ResponseEntity.ok(staffService.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<StaffDto>> findActive() {
        return ResponseEntity.ok(staffService.findActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.findById(id));
    }

    @PostMapping
    public ResponseEntity<StaffDto> create(@Valid @RequestBody StaffRequest req) {
        return ResponseEntity.ok(staffService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffDto> update(@PathVariable Long id, @Valid @RequestBody StaffRequest req) {
        return ResponseEntity.ok(staffService.update(id, req));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<StaffDto> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(staffService.deactivate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        staffService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
