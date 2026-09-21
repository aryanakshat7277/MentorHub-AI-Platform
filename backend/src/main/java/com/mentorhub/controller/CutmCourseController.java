package com.mentorhub.controller;

import com.mentorhub.model.CutmCourse;
import com.mentorhub.repository.CutmCourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/cutm-courses", "/api/v1/cutm-courses"})
public class CutmCourseController {

    private final CutmCourseRepository courseRepository;

    public CutmCourseController(CutmCourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    /**
     * Get all CUTM CBCS Basket Courses
     */
    @GetMapping
    public ResponseEntity<List<CutmCourse>> getAllCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }

    /**
     * Get single CUTM course by database ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CutmCourse> getCourseById(@PathVariable Long id) {
        return courseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get course by official CUTM Course Code (e.g. CUTM1011, CUTM1601)
     */
    @GetMapping("/code/{courseCode}")
    public ResponseEntity<CutmCourse> getCourseByCode(@PathVariable String courseCode) {
        return courseRepository.findByCourseCodeIgnoreCase(courseCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Filter courses by Basket (BASKET_I, BASKET_II, BASKET_III, BASKET_IV, BASKET_V)
     */
    @GetMapping("/basket/{basketCategory}")
    public ResponseEntity<List<CutmCourse>> getCoursesByBasket(@PathVariable String basketCategory) {
        return ResponseEntity.ok(courseRepository.findByBasketCategoryOrderByCourseCodeAsc(basketCategory.toUpperCase()));
    }

    /**
     * Search courses and modules by keyword
     */
    @GetMapping("/search")
    public ResponseEntity<List<CutmCourse>> searchCourses(@RequestParam(name = "q", defaultValue = "") String query) {
        if (query.trim().isEmpty()) {
            return ResponseEntity.ok(courseRepository.findAll());
        }
        return ResponseEntity.ok(courseRepository.searchCourses(query.trim()));
    }

    /**
     * Aggregate statistics across CUTM CBCS baskets
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats() {
        List<CutmCourse> all = courseRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", all.size());
        stats.put("totalCredits", all.stream().mapToInt(c -> c.getCredits() != null ? c.getCredits() : 0).sum());

        Map<String, Long> basketCounts = new HashMap<>();
        for (CutmCourse c : all) {
            String b = c.getBasketCategory() != null ? c.getBasketCategory() : "OTHER";
            basketCounts.put(b, basketCounts.getOrDefault(b, 0L) + 1);
        }
        stats.put("basketCounts", basketCounts);
        stats.put("cloudDatabase", "Centurion University CBCS Repository (H2/PostgreSQL Live Cloud)");
        stats.put("synced", true);

        return ResponseEntity.ok(stats);
    }
}
