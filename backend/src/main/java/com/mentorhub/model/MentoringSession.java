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
    private String status; // PENDING, CONFIRMED, COMPLETED, CANCELLED, TRANSFERRED
    private String meetingLink;

    @Column(length = 2000)
    private String notes;

    private String previousMentorName;

    @Column(length = 1000)
    private String transferReason;

    private LocalDateTime transferredAt;

    private Boolean isReverseMentoring = false;
    private String reverseTopic;
    private Boolean isShadowingAllowed = true;
    private Integer spectatorCount = 0;

    public MentoringSession() {}

    public MentoringSession(Long id, Long mentorId, String mentorName, Long menteeId, String menteeName, String topic, LocalDateTime scheduledAt, Integer durationMinutes, String status, String meetingLink, String notes, String previousMentorName, String transferReason, LocalDateTime transferredAt) {
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
        this.previousMentorName = previousMentorName;
        this.transferReason = transferReason;
        this.transferredAt = transferredAt;
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
        private String previousMentorName;
        private String transferReason;
        private LocalDateTime transferredAt;

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
        public MentoringSessionBuilder previousMentorName(String previousMentorName) { this.previousMentorName = previousMentorName; return this; }
        public MentoringSessionBuilder transferReason(String transferReason) { this.transferReason = transferReason; return this; }
        public MentoringSessionBuilder transferredAt(LocalDateTime transferredAt) { this.transferredAt = transferredAt; return this; }

        public MentoringSession build() {
            return new MentoringSession(id, mentorId, mentorName, menteeId, menteeName, topic, scheduledAt, durationMinutes, status, meetingLink, notes, previousMentorName, transferReason, transferredAt);
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
    public String getPreviousMentorName() { return previousMentorName; }
    public void setPreviousMentorName(String previousMentorName) { this.previousMentorName = previousMentorName; }
    public String getTransferReason() { return transferReason; }
    public void setTransferReason(String transferReason) { this.transferReason = transferReason; }
    public LocalDateTime getTransferredAt() { return transferredAt; }
    public void setTransferredAt(LocalDateTime transferredAt) { this.transferredAt = transferredAt; }

    public Boolean getIsReverseMentoring() { return isReverseMentoring != null ? isReverseMentoring : false; }
    public void setIsReverseMentoring(Boolean isReverseMentoring) { this.isReverseMentoring = isReverseMentoring; }
    public String getReverseTopic() { return reverseTopic; }
    public void setReverseTopic(String reverseTopic) { this.reverseTopic = reverseTopic; }
    public Boolean getIsShadowingAllowed() { return isShadowingAllowed != null ? isShadowingAllowed : true; }
    public void setIsShadowingAllowed(Boolean isShadowingAllowed) { this.isShadowingAllowed = isShadowingAllowed; }
    public Integer getSpectatorCount() { return spectatorCount != null ? spectatorCount : 0; }
    public void setSpectatorCount(Integer spectatorCount) { this.spectatorCount = spectatorCount; }
}
