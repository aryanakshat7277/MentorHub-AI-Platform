package com.mentorhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/mentor", "/api/v1/mentor"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class MentorController {

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getMentorDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "role", "ROLE_MENTOR",
                "message", "Welcome to Mentor Command Center! Manage mentees, schedule video sessions, & award badges."
        ));
    }
}
