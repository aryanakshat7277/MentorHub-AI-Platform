package com.mentorhub.dto;

public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role; // MENTOR, MENTEE
    private String title;
    private String company;
    private String bio;
    private String skills;

    public RegisterRequest() {}

    public RegisterRequest(String name, String email, String password, String role, String title, String company, String bio, String skills) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.title = title;
        this.company = company;
        this.bio = bio;
        this.skills = skills;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
}
