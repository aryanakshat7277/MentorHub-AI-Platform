package com.mentorhub.controller;

import com.mentorhub.model.Resource;
import com.mentorhub.repository.ResourceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {

    private final ResourceRepository resourceRepository;

    public ResourceController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @GetMapping
    public ResponseEntity<List<Resource>> getResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category) {
        if (type != null && !"ALL".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(resourceRepository.findByType(type.toUpperCase()));
        }
        return ResponseEntity.ok(resourceRepository.findAll());
    }

    @PostMapping("/upload")
    public ResponseEntity<Resource> uploadResource(@RequestBody Resource resource) {
        if (resource.getAuthor() == null || resource.getAuthor().trim().isEmpty()) {
            resource.setAuthor("AKSHAT ARYAN");
        }
        if (resource.getReadTime() == null || resource.getReadTime().trim().isEmpty()) {
            resource.setReadTime("File Resource");
        }
        resource.setIsUserUploaded(true);
        Resource saved = resourceRepository.save(resource);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Resource> toggleBookmark(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .map(r -> {
                    r.setBookmarked(!Boolean.TRUE.equals(r.getBookmarked()));
                    return ResponseEntity.ok(resourceRepository.save(r));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteResource(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .map(r -> {
                    resourceRepository.delete(r);
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("id", id);
                    resp.put("deleted", true);
                    resp.put("message", "Resource successfully deleted from database.");
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
