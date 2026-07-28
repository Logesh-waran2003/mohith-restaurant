package com.ringerr.repository;

import com.ringerr.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByActiveTrue();
    Optional<Staff> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
