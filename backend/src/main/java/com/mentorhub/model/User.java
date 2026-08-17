package com.mentorhub.model;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;
    private String role; // MENTOR, MENTEE

    @Column(length = 1000)
    private String bio;

    private Integer xpPoints = 0;
    private Integer currentStreak = 0;
    private Double rating = 5.0;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String avatarUrl;

    private String title;
    private String company;

    @Column(length = 1000)
    private String skills;

    private Integer hoursMentored = 0;
    private Integer totalSessions = 0;
    private Integer badgesCount = 0;

    public User() {}

    public User(Long id, String name, String email, String password, String role, String bio, Integer xpPoints, Integer currentStreak, Double rating, String avatarUrl, String title, String company, String skills, Integer hoursMentored, Integer totalSessions, Integer badgesCount) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.bio = bio;
        this.xpPoints = xpPoints != null ? xpPoints : 0;
        this.currentStreak = currentStreak != null ? currentStreak : 0;
        this.rating = rating != null ? rating : 5.0;
        this.avatarUrl = avatarUrl;
        this.title = title;
        this.company = company;
        this.skills = skills;
        this.hoursMentored = hoursMentored != null ? hoursMentored : 0;
        this.totalSessions = totalSessions != null ? totalSessions : 0;
        this.badgesCount = badgesCount != null ? badgesCount : 0;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = (role != null) ? role.toUpperCase() : "MENTEE";
        return List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String name;
        private String email;
        private String password;
        private String role;
        private String bio;
        private Integer xpPoints = 0;
        private Integer currentStreak = 0;
        private Double rating = 5.0;
        private String avatarUrl;
        private String title;
        private String company;
        private String skills;
        private Integer hoursMentored = 0;
        private Integer totalSessions = 0;
        private Integer badgesCount = 0;

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder name(String name) { this.name = name; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder role(String role) { this.role = role; return this; }
        public UserBuilder bio(String bio) { this.bio = bio; return this; }
        public UserBuilder xpPoints(Integer xpPoints) { this.xpPoints = xpPoints; return this; }
        public UserBuilder currentStreak(Integer currentStreak) { this.currentStreak = currentStreak; return this; }
        public UserBuilder rating(Double rating) { this.rating = rating; return this; }
        public UserBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserBuilder title(String title) { this.title = title; return this; }
        public UserBuilder company(String company) { this.company = company; return this; }
        public UserBuilder skills(String skills) { this.skills = skills; return this; }
        public UserBuilder hoursMentored(Integer hoursMentored) { this.hoursMentored = hoursMentored; return this; }
        public UserBuilder totalSessions(Integer totalSessions) { this.totalSessions = totalSessions; return this; }
        public UserBuilder badgesCount(Integer badgesCount) { this.badgesCount = badgesCount; return this; }

        public User build() {
            return new User(id, name, email, password, role, bio, xpPoints, currentStreak, rating, avatarUrl, title, company, skills, hoursMentored, totalSessions, badgesCount);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public Integer getXpPoints() { return xpPoints; }
    public void setXpPoints(Integer xpPoints) { this.xpPoints = xpPoints; }
    public Integer getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(Integer currentStreak) { this.currentStreak = currentStreak; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public Integer getHoursMentored() { return hoursMentored; }
    public void setHoursMentored(Integer hoursMentored) { this.hoursMentored = hoursMentored; }
    public Integer getTotalSessions() { return totalSessions; }
    public void setTotalSessions(Integer totalSessions) { this.totalSessions = totalSessions; }
    public Integer getBadgesCount() { return badgesCount; }
    public void setBadgesCount(Integer badgesCount) { this.badgesCount = badgesCount; }
}
