package com.ringerr.service;

import com.ringerr.dto.StaffDto;
import com.ringerr.dto.StaffRequest;
import com.ringerr.entity.Staff;
import com.ringerr.entity.User;
import com.ringerr.repository.StaffRepository;
import com.ringerr.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;

    public StaffService(StaffRepository staffRepository, UserRepository userRepository) {
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
    }

    public List<StaffDto> findAll() {
        return staffRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<StaffDto> findActive() {
        return staffRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public StaffDto findById(Long id) {
        return staffRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + id));
    }

    public StaffDto create(StaffRequest req) {
        if (staffRepository.existsByUserId(req.getUserId())) {
            throw new RuntimeException("Staff already exists for user: " + req.getUserId());
        }
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found: " + req.getUserId()));
        Staff staff = new Staff();
        staff.setUser(user);
        staff.setPosition(req.getPosition());
        staff.setPhone(req.getPhone());
        staff.setHireDate(req.getHireDate());
        staff.setActive(true);
        return toDto(staffRepository.save(staff));
    }

    public StaffDto update(Long id, StaffRequest req) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + id));
        staff.setPosition(req.getPosition());
        staff.setPhone(req.getPhone());
        staff.setHireDate(req.getHireDate());
        return toDto(staffRepository.save(staff));
    }

    public StaffDto deactivate(Long id) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found: " + id));
        if (staff.getUser() != null && "admin@ringerr.com".equals(staff.getUser().getEmail())) {
            throw new RuntimeException("Cannot deactivate the main admin account");
        }
        staff.setActive(false);
        return toDto(staffRepository.save(staff));
    }

    public void delete(Long id) {
        staffRepository.deleteById(id);
    }

    public StaffDto toDto(Staff s) {
        StaffDto dto = new StaffDto();
        dto.setId(s.getId());
        dto.setUserId(s.getUser().getId());
        dto.setFullName(s.getUser().getFullName());
        dto.setEmail(s.getUser().getEmail());
        dto.setPosition(s.getPosition());
        dto.setPhone(s.getPhone());
        dto.setHireDate(s.getHireDate());
        dto.setActive(s.isActive());
        return dto;
    }
}
