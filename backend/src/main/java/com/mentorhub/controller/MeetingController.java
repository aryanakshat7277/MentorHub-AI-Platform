package com.mentorhub.controller;

import com.mentorhub.dto.MeetingResponse;
import com.mentorhub.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping("/{sessionId}")
    public ResponseEntity<MeetingResponse> createMeeting(@PathVariable Long sessionId) {
        MeetingResponse meeting = meetingService.getOrCreateMeeting(sessionId);
        return ResponseEntity.ok(meeting);
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<MeetingResponse> getMeeting(@PathVariable Long sessionId) {
        MeetingResponse meeting = meetingService.getMeeting(sessionId);
        return ResponseEntity.ok(meeting);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> endMeeting(@PathVariable Long sessionId) {
        boolean ended = meetingService.endMeeting(sessionId);
        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "ended", ended,
                "message", "Mentoring session call ended cleanly."
        ));
    }
}
