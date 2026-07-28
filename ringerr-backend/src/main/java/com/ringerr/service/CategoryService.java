package com.ringerr.service;

import com.ringerr.dto.CategoryDto;
import com.ringerr.entity.Category;
import com.ringerr.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDto> findAll() {
        return categoryRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<CategoryDto> findActive() {
        return categoryRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public CategoryDto findById(Long id) {
        return categoryRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));
    }

    public CategoryDto create(CategoryDto dto) {
        if (categoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Category already exists: " + dto.getName());
        }
        Category c = new Category();
        c.setName(dto.getName());
        c.setDescription(dto.getDescription());
        c.setActive(true);
        return toDto(categoryRepository.save(c));
    }

    public CategoryDto update(Long id, CategoryDto dto) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));
        c.setName(dto.getName());
        c.setDescription(dto.getDescription());
        c.setActive(dto.isActive());
        return toDto(categoryRepository.save(c));
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    public CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getDescription(), c.isActive(), c.getCreatedAt());
    }
}
