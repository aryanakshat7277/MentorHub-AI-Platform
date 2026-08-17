package com.mentorhub.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges")
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long badgeId;
    private LocalDateTime earnedAt;

    public UserBadge() {}

    public UserBadge(Long id, Long userId, Long badgeId, LocalDateTime earnedAt) {
        this.id = id;
        this.userId = userId;
        this.badgeId = badgeId;
        this.earnedAt = earnedAt;
    }

    public static UserBadgeBuilder builder() { return new UserBadgeBuilder(); }

    public static class UserBadgeBuilder {
        private Long id;
        private Long userId;
        private Long badgeId;
        private LocalDateTime earnedAt;

        public UserBadgeBuilder id(Long id) { this.id = id; return this; }
        public UserBadgeBuilder userId(Long userId) { this.userId = userId; return this; }
        public UserBadgeBuilder badgeId(Long badgeId) { this.badgeId = badgeId; return this; }
        public UserBadgeBuilder earnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; return this; }

        public UserBadge build() {
            return new UserBadge(id, userId, badgeId, earnedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBadgeId() { return badgeId; }
    public void setBadgeId(Long badgeId) { this.badgeId = badgeId; }
    public LocalDateTime getEarnedAt() { return earnedAt; }
    public void setEarnedAt(LocalDateTime earnedAt) { this.earnedAt = earnedAt; }
}
