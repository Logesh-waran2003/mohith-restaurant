package com.ringerr.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SpaController {

    @RequestMapping(value = {
        "/login",
        "/register",
        "/dashboard",
        "/menu",
        "/tables",
        "/orders",
        "/staff",
        "/kitchen",
        "/reports",
        "/order/{token:[a-fA-F0-9\\-]{36}}"
    })
    public ResponseEntity<Resource> forwardToIndex(HttpServletRequest request) {
        Resource resource = new ClassPathResource("static/index.html");
        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_HTML)
            .body(resource);
    }
}
