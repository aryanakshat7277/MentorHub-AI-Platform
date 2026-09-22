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
        boolean needsReseed = false;
        long count = courseRepository.count();

        if (count < 350) {
            needsReseed = true;
        } else {
            // Check if existing records are using the old placeholder modules
            List<CutmCourse> existing = courseRepository.findAll();
            long placeholderCount = existing.stream()
                    .filter(c -> c.getModulesJson() != null && c.getModulesJson().contains("Foundations & Principles of"))
                    .count();
            if (placeholderCount > 0) {
                System.out.println("🔄 Detected " + placeholderCount + " courses with legacy placeholder modules in database. Reseeding with authentic CUTM Courseware syllabi...");
                needsReseed = true;
            }
        }

        if (needsReseed) {
            reseedData();
        } else {
            System.out.println("🏛️ Centurion University (CUTM) Course Catalog verified: " + count + " courses with authentic courseware modules.");
        }
    }

    /**
     * Reseeds the CUTM Course Catalog in the database from cutm_courses.json.
     * Clears existing records and saves authentic courseware modules.
     */
    public synchronized int reseedData() throws Exception {
        courseRepository.deleteAll();

        ClassPathResource resource = new ClassPathResource("cutm_courses.json");
        if (resource.exists()) {
            try (InputStream is = resource.getInputStream()) {
                List<CutmCourse> courses = objectMapper.readValue(is, new TypeReference<List<CutmCourse>>() {});
                for (CutmCourse c : courses) {
                    c.setId(null); // Ensure fresh database ID assignment
                }
                courseRepository.saveAll(courses);
                System.out.println("✅ Centurion University (CUTM) Course Catalog successfully populated with " +
                        courses.size() + " authentic Courseware & CBCS Courses in Cloud Database!");
                return courses.size();
            } catch (Exception e) {
                System.err.println("⚠️ Failed to load cutm_courses.json: " + e.getMessage());
                throw e;
            }
        } else {
            System.err.println("⚠️ cutm_courses.json resource not found on classpath!");
            return 0;
        }
    }
}
