package com.ringerr.service;

import com.ringerr.dto.MenuItemDto;
import com.ringerr.dto.MenuItemRequest;
import com.ringerr.entity.Category;
import com.ringerr.entity.MenuItem;
import com.ringerr.repository.CategoryRepository;
import com.ringerr.repository.MenuItemRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public MenuItemService(MenuItemRepository menuItemRepository,
                           CategoryRepository categoryRepository,
                           CategoryService categoryService) {
        this.menuItemRepository = menuItemRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    @Cacheable(value = "menu:all")
    public List<MenuItemDto> findAll() {
        return menuItemRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Cacheable(value = "menu:available")
    public List<MenuItemDto> findAvailable() {
        return menuItemRepository.findByAvailableTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<MenuItemDto> findByCategory(Long categoryId) {
        return menuItemRepository.findByCategoryId(categoryId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public MenuItemDto findById(Long id) {
        return menuItemRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));
    }

    @CacheEvict(value = {"menu:all", "menu:available"}, allEntries = true)
    public MenuItemDto create(MenuItemRequest req) {
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + req.getCategoryId()));
        MenuItem item = new MenuItem();
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setPrice(req.getPrice());
        item.setCategory(category);
        item.setImageUrl(req.getImageUrl());
        item.setAvailable(req.isAvailable());
        item.setVeg(req.isVeg());
        return toDto(menuItemRepository.save(item));
    }

    @CacheEvict(value = {"menu:all", "menu:available"}, allEntries = true)
    public MenuItemDto update(Long id, MenuItemRequest req) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + req.getCategoryId()));
        item.setName(req.getName());
        item.setDescription(req.getDescription());
        item.setPrice(req.getPrice());
        item.setCategory(category);
        item.setImageUrl(req.getImageUrl());
        item.setAvailable(req.isAvailable());
        item.setVeg(req.isVeg());
        return toDto(menuItemRepository.save(item));
    }

    @CacheEvict(value = {"menu:all", "menu:available"}, allEntries = true)
    public void delete(Long id) {
        menuItemRepository.deleteById(id);
    }

    @CacheEvict(value = {"menu:all", "menu:available"}, allEntries = true)
    public MenuItemDto toggleAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found: " + id));
        item.setAvailable(!item.isAvailable());
        return toDto(menuItemRepository.save(item));
    }

    public MenuItemDto toDto(MenuItem item) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setCategory(categoryService.toDto(item.getCategory()));
        dto.setImageUrl(item.getImageUrl());
        dto.setAvailable(item.isAvailable());
        dto.setVeg(item.isVeg());
        dto.setCreatedAt(item.getCreatedAt());
        return dto;
    }
}
