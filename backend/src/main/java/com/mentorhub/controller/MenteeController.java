package com.mentorhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/mentee")
@CrossOrigin(origins = "*")
public class MenteeController {

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getMenteeDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "role", "ROLE_MENTEE",
                "message", "Welcome to Mentee Scholar Portal! Explore AI top mentor matches, track SMART goals, & earn certificates."
        ));
    }
}
