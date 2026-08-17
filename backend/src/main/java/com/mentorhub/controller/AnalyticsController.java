package com.mentorhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getAnalytics(@PathVariable Long userId) {
        Map<String, Object> data = new HashMap<>();
        
        List<String> labels = Arrays.asList("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
        List<Integer> weeklySessions = Arrays.asList(4, 7, 5, 9, 6, 8, 11);
        List<Integer> xpGained = Arrays.asList(120, 210, 150, 320, 180, 240, 390);

        Map<String, Integer> topicDistribution = new LinkedHashMap<>();
        topicDistribution.put("Distributed Systems & Spring Boot", 40);
        topicDistribution.put("Angular Architecture & RxJS", 25);
        topicDistribution.put("AI/ML Infrastructure & RAG", 20);
        topicDistribution.put("Database Tuning & Cloud DevOps", 15);

        Map<String, Object> weeklyChart = new HashMap<>();
        weeklyChart.put("labels", labels);
        weeklyChart.put("sessions", weeklySessions);
        weeklyChart.put("xp", xpGained);

        data.put("weeklyChart", weeklyChart);
        data.put("topicDistribution", topicDistribution);
        data.put("completionRate", 96.4);
        data.put("avgFeedbackScore", 4.92);
        data.put("totalHoursThisMonth", 34);

        return ResponseEntity.ok(data);
    }
}
