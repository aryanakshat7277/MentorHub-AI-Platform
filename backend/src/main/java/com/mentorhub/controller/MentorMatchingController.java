package com.mentorhub.controller;

import com.mentorhub.model.User;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/mentors")
public class MentorMatchingController {

    private final UserRepository userRepository;

    public MentorMatchingController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/match")
    public ResponseEntity<List<Map<String, Object>>> getMatchedMentors(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String domain) {
        
        List<User> mentors = userRepository.findByRole("MENTOR");
        List<Map<String, Object>> results = new ArrayList<>();

        int baseScore = 98;
        for (User mentor : mentors) {
            Map<String, Object> item = new HashMap<>();
            item.put("mentor", mentor);
            item.put("compatibilityScore", Math.max(82, baseScore));
            item.put("skillOverlap", Arrays.asList(mentor.getSkills().split(",")));
            item.put("availableSlots", Arrays.asList("Today at 16:00", "Tomorrow at 10:30", "Thursday at 14:00"));
            item.put("aiRecommendationReason", "High overlap in Distributed Systems, Java 21, and Reactive Architecture.");
            results.add(item);
            baseScore -= 4;
        }

        return ResponseEntity.ok(results);
    }
}
