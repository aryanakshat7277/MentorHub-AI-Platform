package com.mentorhub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @Column(length = 1000)
    private String description;

    private String iconUrl;
    private String category;
    private Integer xpValue;

    public Badge() {}

    public Badge(Long id, String name, String description, String iconUrl, String category, Integer xpValue) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.iconUrl = iconUrl;
        this.category = category;
        this.xpValue = xpValue;
    }

    public static BadgeBuilder builder() { return new BadgeBuilder(); }

    public static class BadgeBuilder {
        private Long id;
        private String name;
        private String description;
        private String iconUrl;
        private String category;
        private Integer xpValue;

        public BadgeBuilder id(Long id) { this.id = id; return this; }
        public BadgeBuilder name(String name) { this.name = name; return this; }
        public BadgeBuilder description(String description) { this.description = description; return this; }
        public BadgeBuilder iconUrl(String iconUrl) { this.iconUrl = iconUrl; return this; }
        public BadgeBuilder category(String category) { this.category = category; return this; }
        public BadgeBuilder xpValue(Integer xpValue) { this.xpValue = xpValue; return this; }

        public Badge build() {
            return new Badge(id, name, description, iconUrl, category, xpValue);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getXpValue() { return xpValue; }
    public void setXpValue(Integer xpValue) { this.xpValue = xpValue; }
}
