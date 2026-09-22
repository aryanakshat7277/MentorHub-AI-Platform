package com.mentorhub.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorhub.model.CutmCourse;
import com.mentorhub.repository.CutmCourseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
@Order(10)
public class CutmCourseDataSeeder implements CommandLineRunner {

    private final CutmCourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    public CutmCourseDataSeeder(CutmCourseRepository courseRepository, ObjectMapper objectMapper) {
        this.courseRepository = courseRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) throws Exception {
        // If already populated with the full courseware catalog, don't reseed
        if (courseRepository.count() >= 350) {
            System.out.println("🏛️ Centurion University (CUTM) Course Catalog already populated: " + courseRepository.count() + " courses.");
            return;
        }

        courseRepository.deleteAll();

        ClassPathResource resource = new ClassPathResource("cutm_courses.json");
        if (resource.exists()) {
            try (InputStream is = resource.getInputStream()) {
                List<CutmCourse> courses = objectMapper.readValue(is, new TypeReference<List<CutmCourse>>() {});
                courseRepository.saveAll(courses);
                System.out.println("✅ Centurion University (CUTM) Course Catalog successfully populated with " +
                        courses.size() + " Courseware & CBCS Courses in Cloud Database!");
                return;
            } catch (Exception e) {
                System.err.println("⚠️ Failed to load cutm_courses.json: " + e.getMessage());
            }
        } else {
            System.err.println("⚠️ cutm_courses.json resource not found on classpath!");
        }
    }
}
