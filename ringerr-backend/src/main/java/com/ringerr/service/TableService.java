package com.ringerr.service;

import com.ringerr.dto.TableDto;
import com.ringerr.entity.RestaurantTable;
import com.ringerr.entity.RestaurantTable.TableStatus;
import com.ringerr.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TableService {

    private final RestaurantTableRepository tableRepository;

    public TableService(RestaurantTableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    public List<TableDto> findAll() {
        return tableRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<TableDto> findByStatus(TableStatus status) {
        return tableRepository.findByStatus(status).stream().map(this::toDto).collect(Collectors.toList());
    }

    public TableDto findById(Long id) {
        return tableRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Table not found: " + id));
    }

    public TableDto create(TableDto req) {
        if (tableRepository.findByTableNumber(req.getTableNumber()).isPresent()) {
            throw new RuntimeException("Table number already exists: " + req.getTableNumber());
        }
        RestaurantTable table = new RestaurantTable();
        table.setTableNumber(req.getTableNumber());
        table.setCapacity(req.getCapacity() != null ? req.getCapacity() : 4);
        table.setLocation(req.getLocation());
        table.setStatus(TableStatus.AVAILABLE);
        return toDto(tableRepository.save(table));
    }

    public TableDto update(Long id, TableDto req) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        if (req.getTableNumber() != null) table.setTableNumber(req.getTableNumber());
        if (req.getCapacity() != null) table.setCapacity(req.getCapacity());
        if (req.getLocation() != null) table.setLocation(req.getLocation());
        if (req.getStatus() != null) table.setStatus(req.getStatus());
        return toDto(tableRepository.save(table));
    }

    public TableDto updateStatus(Long id, TableStatus status) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found: " + id));
        table.setStatus(status);
        return toDto(tableRepository.save(table));
    }

    public void delete(Long id) {
        tableRepository.deleteById(id);
    }

    public TableDto toDto(RestaurantTable t) {
        TableDto dto = new TableDto();
        dto.setId(t.getId());
        dto.setTableNumber(t.getTableNumber());
        dto.setCapacity(t.getCapacity());
        dto.setStatus(t.getStatus());
        dto.setLocation(t.getLocation());
        dto.setPublicToken(t.getPublicToken());
        return dto;
    }
}
