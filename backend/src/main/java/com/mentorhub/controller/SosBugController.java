package com.mentorhub.controller;

import com.mentorhub.model.SosBugRequest;
import com.mentorhub.model.User;
import com.mentorhub.repository.SosBugRepository;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/sos", "/api/v1/sos"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class SosBugController {

    private final SosBugRepository sosBugRepository;
    private final UserRepository userRepository;

    public SosBugController(SosBugRepository sosBugRepository, UserRepository userRepository) {
        this.sosBugRepository = sosBugRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/active")
    public ResponseEntity<List<SosBugRequest>> getActiveRequests() {
        return ResponseEntity.ok(sosBugRepository.findByStatus("OPEN"));
    }

    @GetMapping("/all")
    public ResponseEntity<List<SosBugRequest>> getAllRequests() {
        return ResponseEntity.ok(sosBugRepository.findAll());
    }

    @PostMapping("/create")
    public ResponseEntity<SosBugRequest> createRequest(@RequestBody SosBugRequest request) {
        if (request.getStatus() == null) request.setStatus("OPEN");
        if (request.getKarmaPoints() == null) request.setKarmaPoints(100);
        if (request.getCreatedAt() == null) request.setCreatedAt(LocalDateTime.now());
        SosBugRequest saved = sosBugRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/claim")
    public ResponseEntity<?> claimRequest(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        return sosBugRepository.findById(id)
                .map(req -> {
                    req.setStatus("CLAIMED");
                    if (payload.containsKey("mentorId") && payload.get("mentorId") != null) {
                        req.setMentorId(Long.valueOf(payload.get("mentorId").toString()));
                    }
                    if (payload.containsKey("mentorName") && payload.get("mentorName") != null) {
                        req.setMentorName(payload.get("mentorName").toString());
                    }
                    String roomId = "sos-" + UUID.randomUUID().toString().substring(0, 8);
                    req.setWorkspaceRoomId(roomId);
                    SosBugRequest saved = sosBugRepository.save(req);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolveRequest(@PathVariable("id") Long id) {
        return sosBugRepository.findById(id)
                .map(req -> {
                    req.setStatus("RESOLVED");
                    req.setResolvedAt(LocalDateTime.now());
                    SosBugRequest saved = sosBugRepository.save(req);

                    // Award +100 XP / Karma to the claiming mentor
                    if (req.getMentorId() != null) {
                        userRepository.findById(req.getMentorId()).ifPresent(mentor -> {
                            int currentXp = mentor.getXpPoints() != null ? mentor.getXpPoints() : 0;
                            int currentKarma = mentor.getKarmaPoints() != null ? mentor.getKarmaPoints() : 0;
                            mentor.setXpPoints(currentXp + 100);
                            mentor.setKarmaPoints(currentKarma + 100);
                            userRepository.save(mentor);
                        });
                    }
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
