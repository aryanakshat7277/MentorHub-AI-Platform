package com.mentorhub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_sessions")
public class WorkspaceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long sessionId;

    @Column(length = 5000)
    private String sharedNotes;

    @Column(length = 10000)
    private String sharedCode;

    private String activeLanguage;
    private LocalDateTime updatedAt;

    public WorkspaceSession() {}

    public WorkspaceSession(Long id, Long sessionId, String sharedNotes, String sharedCode, String activeLanguage, LocalDateTime updatedAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.sharedNotes = sharedNotes;
        this.sharedCode = sharedCode;
        this.activeLanguage = activeLanguage;
        this.updatedAt = updatedAt;
    }

    public static WorkspaceSessionBuilder builder() { return new WorkspaceSessionBuilder(); }

    public static class WorkspaceSessionBuilder {
        private Long id;
        private Long sessionId;
        private String sharedNotes;
        private String sharedCode;
        private String activeLanguage;
        private LocalDateTime updatedAt;

        public WorkspaceSessionBuilder id(Long id) { this.id = id; return this; }
        public WorkspaceSessionBuilder sessionId(Long sessionId) { this.sessionId = sessionId; return this; }
        public WorkspaceSessionBuilder sharedNotes(String sharedNotes) { this.sharedNotes = sharedNotes; return this; }
        public WorkspaceSessionBuilder sharedCode(String sharedCode) { this.sharedCode = sharedCode; return this; }
        public WorkspaceSessionBuilder activeLanguage(String activeLanguage) { this.activeLanguage = activeLanguage; return this; }
        public WorkspaceSessionBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public WorkspaceSession build() {
            return new WorkspaceSession(id, sessionId, sharedNotes, sharedCode, activeLanguage, updatedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getSharedNotes() { return sharedNotes; }
    public void setSharedNotes(String sharedNotes) { this.sharedNotes = sharedNotes; }
    public String getSharedCode() { return sharedCode; }
    public void setSharedCode(String sharedCode) { this.sharedCode = sharedCode; }
    public String getActiveLanguage() { return activeLanguage; }
    public void setActiveLanguage(String activeLanguage) { this.activeLanguage = activeLanguage; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
