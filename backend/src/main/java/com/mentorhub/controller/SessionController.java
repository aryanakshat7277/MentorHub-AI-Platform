package com.mentorhub.controller;

import com.mentorhub.model.MentoringSession;
import com.mentorhub.model.User;
import com.mentorhub.repository.MentoringSessionRepository;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/sessions", "/api/v1/sessions"})
public class SessionController {

    private final MentoringSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public SessionController(MentoringSessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<MentoringSession>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSessionStats() {
        long total = sessionRepository.count();
        long pending = sessionRepository.findAll().stream().filter(s -> "PENDING".equalsIgnoreCase(s.getStatus())).count();
        long completed = sessionRepository.findAll().stream().filter(s -> "COMPLETED".equalsIgnoreCase(s.getStatus())).count();
        long confirmed = sessionRepository.findAll().stream().filter(s -> "CONFIRMED".equalsIgnoreCase(s.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("completed", completed);
        stats.put("confirmed", confirmed);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/book")
    public ResponseEntity<MentoringSession> bookSession(@RequestBody MentoringSession session) {
        if (session.getScheduledAt() == null) {
            session.setScheduledAt(LocalDateTime.now().plusDays(1));
        }
        if (session.getStatus() == null) {
            session.setStatus("PENDING");
        }
        if (session.getDurationMinutes() == null) {
            session.setDurationMinutes(45);
        }
        if (session.getMenteeName() == null) {
            session.setMenteeName("ARYANAKSHAT7277");
        }
        if (session.getMeetingLink() == null) {
            session.setMeetingLink("/workspace?sessionId=" + (session.getId() != null ? session.getId() : System.currentTimeMillis()));
        }

        MentoringSession saved = sessionRepository.save(session);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MentoringSession> updateStatus(@PathVariable("id") Long id, @RequestBody Map<String, String> request) {
        return sessionRepository.findById(id)
                .map(session -> {
                    String newStatus = request.get("status");
                    session.setStatus(newStatus);

                    // If completed and reverse mentoring, award reciprocal XP (+150 XP) to both mentee and mentor
                    if ("COMPLETED".equalsIgnoreCase(newStatus) && Boolean.TRUE.equals(session.getIsReverseMentoring())) {
                        if (session.getMenteeId() != null) {
                            userRepository.findById(session.getMenteeId()).ifPresent(mentee -> {
                                int xp = mentee.getXpPoints() != null ? mentee.getXpPoints() : 0;
                                mentee.setXpPoints(xp + 150);
                                int badges = mentee.getBadgesCount() != null ? mentee.getBadgesCount() : 0;
                                mentee.setBadgesCount(badges + 1);
                                userRepository.save(mentee);
                            });
                        }
                        if (session.getMentorId() != null) {
                            userRepository.findById(session.getMentorId()).ifPresent(mentor -> {
                                int xp = mentor.getXpPoints() != null ? mentor.getXpPoints() : 0;
                                mentor.setXpPoints(xp + 150);
                                int badges = mentor.getBadgesCount() != null ? mentor.getBadgesCount() : 0;
                                mentor.setBadgesCount(badges + 1);
                                userRepository.save(mentor);
                            });
                        }
                    }

                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/shadow/join")
    public ResponseEntity<MentoringSession> joinShadowSession(@PathVariable("id") Long id) {
        return sessionRepository.findById(id)
                .map(session -> {
                    int current = session.getSpectatorCount() != null ? session.getSpectatorCount() : 0;
                    session.setSpectatorCount(current + 1);
                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/transfer")
    public ResponseEntity<MentoringSession> transferSession(@PathVariable("id") Long id, @RequestBody Map<String, Object> request) {
        return sessionRepository.findById(id)
                .map(session -> {
                    String newMentorName = (String) request.get("newMentorName");
                    String transferReason = (String) request.get("transferReason");
                    Object newMentorIdObj = request.get("newMentorId");
                    Long newMentorId = newMentorIdObj != null ? Long.valueOf(newMentorIdObj.toString()) : null;

                    session.setPreviousMentorName(session.getMentorName());
                    if (newMentorName != null && !newMentorName.trim().isEmpty()) {
                        session.setMentorName(newMentorName);
                    }
                    if (newMentorId != null) {
                        session.setMentorId(newMentorId);
                    }
                    session.setTransferReason(transferReason);
                    session.setTransferredAt(LocalDateTime.now());
                    session.setStatus("PENDING"); // Place in new mentor's queue with referral details

                    if (transferReason != null && !transferReason.trim().isEmpty()) {
                        String currentNotes = session.getNotes() != null ? session.getNotes() : "";
                        session.setNotes(currentNotes + "\n[Handover Recommendation from " + session.getPreviousMentorName() + "]: " + transferReason);
                    }

                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
