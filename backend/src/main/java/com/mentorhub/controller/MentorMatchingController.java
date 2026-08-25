package com.mentorhub.controller;

import com.mentorhub.model.User;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/mentors", "/api/v1/mentors"})
public class MentorMatchingController {

    private final UserRepository userRepository;

    public MentorMatchingController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/match")
    public ResponseEntity<List<Map<String, Object>>> getMatchedMentors(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String domain) {
        
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();

        // 1. Akshat Aryan
        Optional<User> akshat = allUsers.stream().filter(u -> u.getName().toUpperCase().contains("AKSHAT")).findFirst();
        if (akshat.isPresent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("mentor", akshat.get());
            item.put("compatibilityScore", 98);
            item.put("skillOverlap", Arrays.asList("Java 21", "Spring Boot 3", "Angular 17", "WebSockets", "Neural Search", "Microservices Architecture"));
            item.put("availableSlots", Arrays.asList("Today at 16:00", "Tomorrow at 10:30", "Thursday at 14:00"));
            item.put("aiRecommendationReason", "High overlap in Distributed Systems, Java 21, and Reactive Architecture.");
            results.add(item);
        }

        // 2. Kriti Sagar
        Optional<User> kriti = allUsers.stream().filter(u -> u.getName().toUpperCase().contains("KRITI")).findFirst();
        if (kriti.isPresent()) {
            Map<String, Object> item = new HashMap<>();
            User k = kriti.get();
            item.put("mentor", k);
            item.put("compatibilityScore", 94);
            item.put("skillOverlap", Arrays.asList("Spring Boot 3", "Microservices", "Angular 17", "RAG AI Systems", "PostgreSQL"));
            item.put("availableSlots", Arrays.asList("Tomorrow at 11:00", "Friday at 15:30"));
            item.put("aiRecommendationReason", "Exceptional affinity in Full-Stack Spring Boot and Reactive Signal UI.");
            results.add(item);
        }

        // 3. Pavani
        Optional<User> pavani = allUsers.stream().filter(u -> u.getName().toUpperCase().contains("PAVANI")).findFirst();
        if (pavani.isPresent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("mentor", pavani.get());
            item.put("compatibilityScore", 91);
            item.put("skillOverlap", Arrays.asList("Angular 17", "RxJS", "TypeScript", "Canvas Graphics", "WebSockets"));
            item.put("availableSlots", Arrays.asList("Wednesday at 14:00", "Saturday at 10:00"));
            item.put("aiRecommendationReason", "Strong match for Reactive Frontend Engineering & Canvas Visuals.");
            results.add(item);
        }

        // 4. Vanaja
        Optional<User> vanaja = allUsers.stream().filter(u -> u.getName().toUpperCase().contains("VANAJA")).findFirst();
        if (vanaja.isPresent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("mentor", vanaja.get());
            item.put("compatibilityScore", 88);
            item.put("skillOverlap", Arrays.asList("Docker", "Kubernetes", "Microservices", "CI/CD", "WebSockets"));
            item.put("availableSlots", Arrays.asList("Thursday at 17:00", "Friday at 12:00"));
            item.put("aiRecommendationReason", "Recommended for Cloud Infrastructure, Microservices, and DevOps.");
            results.add(item);
        }

        return ResponseEntity.ok(results);
    }
}
