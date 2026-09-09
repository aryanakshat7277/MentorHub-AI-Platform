package com.mentorhub.controller;

import com.mentorhub.model.Goal;
import com.mentorhub.model.User;
import com.mentorhub.repository.GoalRepository;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/goals", "/api/v1/goals"})
public class GoalController {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalController(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
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
        if (goal.getStatus() == null) goal.setStatus("TO_DO");
        
        // Auto-fill category name if missing
        if (goal.getCategory() != null && goal.getCategoryName() == null) {
            switch (goal.getCategory().toUpperCase()) {
                case "S": goal.setCategoryName("Specific"); break;
                case "M": goal.setCategoryName("Measurable"); break;
                case "A": goal.setCategoryName("Achievable"); break;
                case "R": goal.setCategoryName("Relevant"); break;
                case "T": goal.setCategoryName("Time-bound"); break;
                default: goal.setCategoryName("Milestone"); break;
            }
        }
        
        Goal saved = goalRepository.save(goal);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Goal> updateGoal(@PathVariable Long id, @RequestBody Goal goalDetails) {
        return goalRepository.findById(id)
                .map(goal -> {
                    String oldStatus = goal.getStatus();
                    if (goalDetails.getTitle() != null) goal.setTitle(goalDetails.getTitle());
                    if (goalDetails.getDescription() != null) goal.setDescription(goalDetails.getDescription());
                    if (goalDetails.getProgressPercentage() != null) goal.setProgressPercentage(goalDetails.getProgressPercentage());
                    if (goalDetails.getStatus() != null) goal.setStatus(goalDetails.getStatus());
                    if (goalDetails.getTargetDate() != null) goal.setTargetDate(goalDetails.getTargetDate());
                    if (goalDetails.getCategory() != null) goal.setCategory(goalDetails.getCategory());
                    if (goalDetails.getCategoryName() != null) goal.setCategoryName(goalDetails.getCategoryName());

                    // If newly achieved or 100% progress, award XP to the user
                    if ("ACHIEVED".equalsIgnoreCase(goal.getStatus()) && !"ACHIEVED".equalsIgnoreCase(oldStatus)) {
                        goal.setProgressPercentage(100);
                        if (goal.getUserId() != null) {
                            userRepository.findById(goal.getUserId()).ifPresent(user -> {
                                user.setXpPoints((user.getXpPoints() != null ? user.getXpPoints() : 0) + 50);
                                userRepository.save(user);
                            });
                        }
                    }

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
