package com.mentorhub.controller;

import com.mentorhub.model.MentoringSession;
import com.mentorhub.repository.MentoringSessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {

    private final MentoringSessionRepository sessionRepository;

    public SessionController(MentoringSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
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
            session.setMeetingLink("https://meet.mentorhub.ai/room-" + System.currentTimeMillis());
        }

        MentoringSession saved = sessionRepository.save(session);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MentoringSession> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return sessionRepository.findById(id)
                .map(session -> {
                    session.setStatus(request.get("status"));
                    return ResponseEntity.ok(sessionRepository.save(session));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
