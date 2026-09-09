package com.mentorhub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sos_bug_requests")
public class SosBugRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long menteeId;
    private String menteeName;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String problemDescription;

    private String techStack; // Spring Boot, Angular, Java, Python, SQL, Docker
    private String status; // OPEN, CLAIMED, RESOLVED, EXPIRED

    private Long mentorId;
    private String mentorName;
    private String workspaceRoomId;

    private Integer karmaPoints = 100;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;

    public SosBugRequest() {}

    public SosBugRequest(Long id, Long menteeId, String menteeName, String title, String problemDescription, String techStack, String status, Long mentorId, String mentorName, String workspaceRoomId, Integer karmaPoints, LocalDateTime createdAt, LocalDateTime resolvedAt) {
        this.id = id;
        this.menteeId = menteeId;
        this.menteeName = menteeName;
        this.title = title;
        this.problemDescription = problemDescription;
        this.techStack = techStack;
        this.status = status != null ? status : "OPEN";
        this.mentorId = mentorId;
        this.mentorName = mentorName;
        this.workspaceRoomId = workspaceRoomId;
        this.karmaPoints = karmaPoints != null ? karmaPoints : 100;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.resolvedAt = resolvedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMenteeId() { return menteeId; }
    public void setMenteeId(Long menteeId) { this.menteeId = menteeId; }

    public String getMenteeName() { return menteeName; }
    public void setMenteeName(String menteeName) { this.menteeName = menteeName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getProblemDescription() { return problemDescription; }
    public void setProblemDescription(String problemDescription) { this.problemDescription = problemDescription; }

    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }

    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }

    public String getWorkspaceRoomId() { return workspaceRoomId; }
    public void setWorkspaceRoomId(String workspaceRoomId) { this.workspaceRoomId = workspaceRoomId; }

    public Integer getKarmaPoints() { return karmaPoints; }
    public void setKarmaPoints(Integer karmaPoints) { this.karmaPoints = karmaPoints; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}
