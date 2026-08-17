package com.mentorhub.controller;

import com.mentorhub.model.Badge;
import com.mentorhub.model.User;
import com.mentorhub.repository.BadgeRepository;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/gamification")
public class GamificationController {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;

    public GamificationController(UserRepository userRepository, BadgeRepository badgeRepository) {
        this.userRepository = userRepository;
        this.badgeRepository = badgeRepository;
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseGet(() -> 
            userRepository.findById(1L).orElse(null)
        );

        Map<String, Object> stats = new HashMap<>();
        if (user != null) {
            stats.put("xpPoints", user.getXpPoints());
            stats.put("level", (user.getXpPoints() / 500) + 1);
            stats.put("nextLevelXp", (((user.getXpPoints() / 500) + 1) * 500));
            stats.put("currentStreak", user.getCurrentStreak());
            stats.put("hoursMentored", user.getHoursMentored());
            stats.put("totalSessions", user.getTotalSessions());
            stats.put("badgesCount", user.getBadgesCount());
            stats.put("rating", user.getRating());
        }
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getLeaderboard() {
        List<User> users = userRepository.findAllByOrderByXpPointsDesc();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/badges")
    public ResponseEntity<List<Badge>> getBadges() {
        return ResponseEntity.ok(badgeRepository.findAll());
    }
}
