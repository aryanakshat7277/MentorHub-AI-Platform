package com.mentorhub.controller;

import com.mentorhub.model.Goal;
import com.mentorhub.repository.GoalRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {

    private final GoalRepository goalRepository;

    public GoalController(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Goal>> getGoalsByUser(@PathVariable Long userId) {
        List<Goal> goals = goalRepository.findByUserId(userId);
        if (goals.isEmpty()) {
            goals = goalRepository.findAll();
        }
        return ResponseEntity.ok(goals);
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestBody Goal goal) {
        if (goal.getUserId() == null) goal.setUserId(1L);
        if (goal.getProgressPercentage() == null) goal.setProgressPercentage(0);
        if (goal.getStatus() == null) goal.setStatus("IN_PROGRESS");
        Goal saved = goalRepository.save(goal);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Goal> updateGoal(@PathVariable Long id, @RequestBody Goal goalDetails) {
        return goalRepository.findById(id)
                .map(goal -> {
                    if (goalDetails.getTitle() != null) goal.setTitle(goalDetails.getTitle());
                    if (goalDetails.getDescription() != null) goal.setDescription(goalDetails.getDescription());
                    if (goalDetails.getProgressPercentage() != null) goal.setProgressPercentage(goalDetails.getProgressPercentage());
                    if (goalDetails.getStatus() != null) goal.setStatus(goalDetails.getStatus());
                    if (goalDetails.getTargetDate() != null) goal.setTargetDate(goalDetails.getTargetDate());
                    return ResponseEntity.ok(goalRepository.save(goal));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        goalRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
