package com.mentorhub.model;

import java.util.List;

public class KnowledgeImpact {

    private Long mentorId;
    private String mentorName;
    private String mentorAvatar;
    private Double mentorRating;
    private Integer studentsHelped;
    private Integer sessionsCompleted;
    private Integer studentsImproved;
    private Integer impactScore;
    private Integer totalReach;
    private String impactSummary;
    private List<KnowledgeChainNode> chainNodes;
    private List<String> impactStories;

    public KnowledgeImpact() {}

    public KnowledgeImpact(Long mentorId, String mentorName, String mentorAvatar, Double mentorRating, Integer studentsHelped, Integer sessionsCompleted, Integer studentsImproved, Integer impactScore, Integer totalReach, String impactSummary, List<KnowledgeChainNode> chainNodes, List<String> impactStories) {
        this.mentorId = mentorId;
        this.mentorName = mentorName;
        this.mentorAvatar = mentorAvatar;
        this.mentorRating = mentorRating;
        this.studentsHelped = studentsHelped;
        this.sessionsCompleted = sessionsCompleted;
        this.studentsImproved = studentsImproved;
        this.impactScore = impactScore;
        this.totalReach = totalReach;
        this.impactSummary = impactSummary;
        this.chainNodes = chainNodes;
        this.impactStories = impactStories;
    }

    public static class KnowledgeChainNode {
        private String name;
        private String role; // "MENTOR", "STUDENT", "PEER_MENTOR"
        private String avatar;
        private String action; // e.g. "Taught by Pavani", "Learned & Built Canvas App", "Helped Sneha on RxJS"
        private String topic;
        private int stepNumber;

        public KnowledgeChainNode() {}

        public KnowledgeChainNode(String name, String role, String avatar, String action, String topic, int stepNumber) {
            this.name = name;
            this.role = role;
            this.avatar = avatar;
            this.action = action;
            this.topic = topic;
            this.stepNumber = stepNumber;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getTopic() { return topic; }
        public void setTopic(String topic) { this.topic = topic; }
        public int getStepNumber() { return stepNumber; }
        public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }
    }

    // Getters and Setters
    public Long getMentorId() { return mentorId; }
    public void setMentorId(Long mentorId) { this.mentorId = mentorId; }

    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }

    public String getMentorAvatar() { return mentorAvatar; }
    public void setMentorAvatar(String mentorAvatar) { this.mentorAvatar = mentorAvatar; }

    public Double getMentorRating() { return mentorRating; }
    public void setMentorRating(Double mentorRating) { this.mentorRating = mentorRating; }

    public Integer getStudentsHelped() { return studentsHelped; }
    public void setStudentsHelped(Integer studentsHelped) { this.studentsHelped = studentsHelped; }

    public Integer getSessionsCompleted() { return sessionsCompleted; }
    public void setSessionsCompleted(Integer sessionsCompleted) { this.sessionsCompleted = sessionsCompleted; }

    public Integer getStudentsImproved() { return studentsImproved; }
    public void setStudentsImproved(Integer studentsImproved) { this.studentsImproved = studentsImproved; }

    public Integer getImpactScore() { return impactScore; }
    public void setImpactScore(Integer impactScore) { this.impactScore = impactScore; }

    public Integer getTotalReach() { return totalReach; }
    public void setTotalReach(Integer totalReach) { this.totalReach = totalReach; }

    public String getImpactSummary() { return impactSummary; }
    public void setImpactSummary(String impactSummary) { this.impactSummary = impactSummary; }

    public List<KnowledgeChainNode> getChainNodes() { return chainNodes; }
    public void setChainNodes(List<KnowledgeChainNode> chainNodes) { this.chainNodes = chainNodes; }

    public List<String> getImpactStories() { return impactStories; }
    public void setImpactStories(List<String> impactStories) { this.impactStories = impactStories; }
}
