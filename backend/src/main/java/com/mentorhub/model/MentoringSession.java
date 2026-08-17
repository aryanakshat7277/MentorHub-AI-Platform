package com.mentorhub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mentoring_sessions")
public class MentoringSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long mentorId;
    private String mentorName;
    private Long menteeId;
    private String menteeName;
    private String topic;
    private LocalDateTime scheduledAt;
    private Integer durationMinutes;
    private String status; // PENDING, CONFIRMED, COMPLETED, CANCELLED
    private String meetingLink;

    @Column(length = 2000)
    private String notes;

    public MentoringSession() {}

    public MentoringSession(Long id, Long mentorId, String mentorName, Long menteeId, String menteeName, String topic, LocalDateTime scheduledAt, Integer durationMinutes, String status, String meetingLink, String notes) {
        this.id = id;
        this.mentorId = mentorId;
        this.mentorName = mentorName;
        this.menteeId = menteeId;
        this.menteeName = menteeName;
        this.topic = topic;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.status = status;
        this.meetingLink = meetingLink;
        this.notes = notes;
    }

    public static MentoringSessionBuilder builder() {
        return new MentoringSessionBuilder();
    }

    public static class MentoringSessionBuilder {
        private Long id;
        private Long mentorId;
        private String mentorName;
        private Long menteeId;
        private String menteeName;
        private String topic;
        private LocalDateTime scheduledAt;
        private Integer durationMinutes;
        private String status;
        private String meetingLink;
        private String notes;

        public MentoringSessionBuilder id(Long id) { this.id = id; return this; }
        public MentoringSessionBuilder mentorId(Long mentorId) { this.mentorId = mentorId; return this; }
        public MentoringSessionBuilder mentorName(String mentorName) { this.mentorName = mentorName; return this; }
        public MentoringSessionBuilder menteeId(Long menteeId) { this.menteeId = menteeId; return this; }
        public MentoringSessionBuilder menteeName(String menteeName) { this.menteeName = menteeName; return this; }
        public MentoringSessionBuilder topic(String topic) { this.topic = topic; return this; }
        public MentoringSessionBuilder scheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; return this; }
        public MentoringSessionBuilder durationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public MentoringSessionBuilder status(String status) { this.status = status; return this; }
        public MentoringSessionBuilder meetingLink(String meetingLink) { this.meetingLink = meetingLink; return this; }
        public MentoringSessionBuilder notes(String notes) { this.notes = notes; return this; }

        public MentoringSession build() {
            return new MentoringSession(id, mentorId, mentorName, menteeId, menteeName, topic, scheduledAt, durationMinutes, status, meetingLink, notes);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }
    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }
    public Long getMenteeId() { return menteeId; }
    public void setMenteeId(Long menteeId) { this.menteeId = menteeId; }
    public String getMenteeName() { return menteeName; }
    public void setMenteeName(String menteeName) { this.menteeName = menteeName; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
