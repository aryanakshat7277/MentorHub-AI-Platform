package com.mentorhub.service;

import com.mentorhub.dto.MeetingResponse;
import com.mentorhub.model.MentoringSession;
import com.mentorhub.repository.MentoringSessionRepository;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MeetingService {

    private final MentoringSessionRepository sessionRepository;
    private final Map<Long, String> sessionRoomMap = new ConcurrentHashMap<>();

    public MeetingService(MentoringSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public MeetingResponse getOrCreateMeeting(Long sessionId) {
        MentoringSession session = sessionRepository.findById(sessionId).orElse(null);

        String mentorName = (session != null && session.getMentorName() != null) ? session.getMentorName() : "AKSHAT ARYAN";
        String menteeName = (session != null && session.getMenteeName() != null) ? session.getMenteeName() : "KRITI SAGAR";
        String topic = (session != null && session.getTopic() != null) ? session.getTopic() : "Spring Boot 3 & Angular 17 Mentorship";

        // Reuse existing room name if session already has one created
        String roomName = sessionRoomMap.computeIfAbsent(sessionId, id -> {
            String randomHash = UUID.randomUUID().toString().substring(0, 8);
            return "mentorhub-session-" + id + "-" + randomHash;
        });

        if (session != null && (session.getMeetingLink() == null || session.getMeetingLink().contains("room-"))) {
            session.setMeetingLink("https://meet.jit.si/" + roomName);
            sessionRepository.save(session);
        }

        return new MeetingResponse(
                sessionId,
                roomName,
                "meet.jit.si",
                mentorName,
                menteeName,
                topic,
                "ACTIVE"
        );
    }

    public MeetingResponse getMeeting(Long sessionId) {
        return getOrCreateMeeting(sessionId);
    }

    public boolean endMeeting(Long sessionId) {
        sessionRoomMap.remove(sessionId);
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.setStatus("COMPLETED");
            sessionRepository.save(session);
        });
        return true;
    }
}
