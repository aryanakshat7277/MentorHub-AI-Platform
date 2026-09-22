package com.mentorhub.controller;

import com.mentorhub.model.CutmCourse;
import com.mentorhub.repository.CutmCourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

import com.mentorhub.config.CutmCourseDataSeeder;

@RestController
@RequestMapping({"/api/cutm-courses", "/api/v1/cutm-courses"})
public class CutmCourseController {

    private final CutmCourseRepository courseRepository;
    private final CutmCourseDataSeeder cutmCourseDataSeeder;

    public CutmCourseController(CutmCourseRepository courseRepository, CutmCourseDataSeeder cutmCourseDataSeeder) {
        this.courseRepository = courseRepository;
        this.cutmCourseDataSeeder = cutmCourseDataSeeder;
    }

    /**
     * Reseed the CUTM courses database with authentic courseware modules
     */
    @PostMapping("/reseed")
    public ResponseEntity<Map<String, Object>> reseedCatalog() {
        try {
            int count = cutmCourseDataSeeder.reseedData();
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Catalog successfully reseeded with authentic CUTM Courseware modules");
            resp.put("coursesLoaded", count);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("error", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * Get all CUTM Courses (Courseware & CBCS Baskets)
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
     * Get single CUTM course by official Courseware ID (e.g. 1115, 1114, 1020)
     */
    @GetMapping("/courseware/{coursewareId}")
    public ResponseEntity<CutmCourse> getCourseByCoursewareId(@PathVariable Long coursewareId) {
        return courseRepository.findByCoursewareId(coursewareId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get course by official CUTM Course Code (e.g. CUTM1011, CUTM1601, CUFS1092)
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
     * Filter courses by CUTM Courseware Category (Core, Domain, Skill, Certificate, Advanced Certificate, Diploma)
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CutmCourse>> getCoursesByCategory(@PathVariable String category) {
        return ResponseEntity.ok(courseRepository.findByCourseCategoryIgnoreCaseOrderByCourseCodeAsc(category));
    }

    /**
     * Search courses by faculty instructor name
     */
    @GetMapping("/faculty")
    public ResponseEntity<List<CutmCourse>> getCoursesByFaculty(@RequestParam(name = "name", defaultValue = "") String facultyName) {
        if (facultyName.trim().isEmpty()) {
            return ResponseEntity.ok(courseRepository.findAll());
        }
        return ResponseEntity.ok(courseRepository.findByFacultyContainingIgnoreCaseOrderByCourseCodeAsc(facultyName.trim()));
    }

    /**
     * Search courses and modules by keyword across code, title, faculty, and topics
     */
    @GetMapping("/search")
    public ResponseEntity<List<CutmCourse>> searchCourses(@RequestParam(name = "q", defaultValue = "") String query) {
        if (query.trim().isEmpty()) {
            return ResponseEntity.ok(courseRepository.findAll());
        }
        return ResponseEntity.ok(courseRepository.searchCourses(query.trim()));
    }

    /**
     * Aggregate statistics across CUTM Courseware categories and CBCS baskets
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCourseStats() {
        List<CutmCourse> all = courseRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", all.size());
        stats.put("totalCredits", all.stream().mapToInt(c -> c.getCredits() != null ? c.getCredits() : 0).sum());

        Map<String, Long> basketCounts = new HashMap<>();
        Map<String, Long> categoryCounts = new HashMap<>();
        Set<String> uniqueFaculties = new HashSet<>();

        for (CutmCourse c : all) {
            String b = c.getBasketCategory() != null ? c.getBasketCategory() : "OTHER";
            basketCounts.put(b, basketCounts.getOrDefault(b, 0L) + 1);

            String cat = c.getCourseCategory() != null ? c.getCourseCategory() : "General";
            categoryCounts.put(cat, categoryCounts.getOrDefault(cat, 0L) + 1);

            if (c.getFaculty() != null && !c.getFaculty().isEmpty()) {
                uniqueFaculties.add(c.getFaculty());
            }
        }

        stats.put("basketCounts", basketCounts);
        stats.put("categoryCounts", categoryCounts);
        stats.put("totalFacultyInstructors", uniqueFaculties.size());
        stats.put("cloudDatabase", "Centurion University Courseware & CBCS Cloud Repository (Spring Boot JPA)");
        stats.put("officialCoursewareUrl", "https://courseware.cutm.ac.in/courses");
        stats.put("synced", true);

        return ResponseEntity.ok(stats);
    }
}
