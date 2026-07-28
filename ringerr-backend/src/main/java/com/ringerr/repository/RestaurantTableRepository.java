package com.ringerr.repository;

import com.ringerr.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByTableNumber(Integer tableNumber);
    Optional<RestaurantTable> findByPublicToken(UUID publicToken);
    List<RestaurantTable> findByStatus(RestaurantTable.TableStatus status);
    long countByStatus(RestaurantTable.TableStatus status);
}
