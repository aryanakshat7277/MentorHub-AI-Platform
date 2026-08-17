package com.mentorhub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "goals")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String title;

    @Column(length = 1000)
    private String description;

    private Integer progressPercentage;
    private String targetDate;
    private String status; // TO_DO, IN_PROGRESS, ACHIEVED
    private String category; // S, M, A, R, T
    private String categoryName;

    public Goal() {}

    public Goal(Long id, Long userId, String title, String description, Integer progressPercentage, String targetDate, String status, String category, String categoryName) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.progressPercentage = progressPercentage;
        this.targetDate = targetDate;
        this.status = status;
        this.category = category;
        this.categoryName = categoryName;
    }

    public static GoalBuilder builder() { return new GoalBuilder(); }

    public static class GoalBuilder {
        private Long id;
        private Long userId;
        private String title;
        private String description;
        private Integer progressPercentage;
        private String targetDate;
        private String status;
        private String category;
        private String categoryName;

        public GoalBuilder id(Long id) { this.id = id; return this; }
        public GoalBuilder userId(Long userId) { this.userId = userId; return this; }
        public GoalBuilder title(String title) { this.title = title; return this; }
        public GoalBuilder description(String description) { this.description = description; return this; }
        public GoalBuilder progressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; return this; }
        public GoalBuilder targetDate(String targetDate) { this.targetDate = targetDate; return this; }
        public GoalBuilder status(String status) { this.status = status; return this; }
        public GoalBuilder category(String category) { this.category = category; return this; }
        public GoalBuilder categoryName(String categoryName) { this.categoryName = categoryName; return this; }

        public Goal build() {
            return new Goal(id, userId, title, description, progressPercentage, targetDate, status, category, categoryName);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }
    public String getTargetDate() { return targetDate; }
    public void setTargetDate(String targetDate) { this.targetDate = targetDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}
