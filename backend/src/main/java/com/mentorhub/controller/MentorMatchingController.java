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
    private final com.mentorhub.service.MentorMatchingService mentorMatchingService;

    public MentorMatchingController(UserRepository userRepository, com.mentorhub.service.MentorMatchingService mentorMatchingService) {
        this.userRepository = userRepository;
        this.mentorMatchingService = mentorMatchingService;
    }

    @GetMapping("/match")
    public ResponseEntity<List<Map<String, Object>>> getMatchedMentors(
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String domain,
            @RequestParam(required = false) Long menteeId) {
        List<Map<String, Object>> matches = mentorMatchingService.calculateMatches(skill, domain, menteeId);
        return ResponseEntity.ok(matches);
    }

    @PutMapping("/{id}/recharge-toggle")
    public ResponseEntity<?> toggleRecharge(@PathVariable("id") Long id, @RequestBody(required = false) Map<String, Object> body) {
        return userRepository.findById(id)
                .map(user -> {
                    boolean current = Boolean.TRUE.equals(user.getIsRecharging());
                    user.setIsRecharging(!current);
                    if (!current) {
                        user.setRechargeUntil(java.time.LocalDateTime.now().plusHours(24));
                    } else {
                        user.setRechargeUntil(null);
                    }
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
