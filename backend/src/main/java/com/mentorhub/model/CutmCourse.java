package com.mentorhub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cutm_courses")
public class CutmCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String courseCode; // e.g. CUTM1001, CUTM1010, CUTM1601

    @Column(nullable = false, length = 255)
    private String courseTitle;

    @Column(nullable = false, length = 100)
    private String basketCategory; // BASKET_I, BASKET_II, BASKET_III, BASKET_IV, BASKET_V

    @Column(nullable = false, length = 150)
    private String basketName; // Basket I: Foundation Courses, etc.

    private Integer credits; // 2, 3, 4

    @Column(length = 50)
    private String ltp; // e.g. 3-0-2, 3-1-0

    @Column(length = 200)
    private String department; // School of Engineering & Technology - CSE

    @Column(length = 50)
    private String semester; // Semester I, II, etc.

    @Column(length = 3000)
    private String description;

    @Column(length = 500)
    private String prerequisites;

    @Column(columnDefinition = "TEXT")
    private String modulesJson; // JSON string array of 4-5 modules with titles, topics, labs, viva questions

    public CutmCourse() {}

    public CutmCourse(Long id, String courseCode, String courseTitle, String basketCategory, String basketName, Integer credits, String ltp, String department, String semester, String description, String prerequisites, String modulesJson) {
        this.id = id;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.basketCategory = basketCategory;
        this.basketName = basketName;
        this.credits = credits;
        this.ltp = ltp;
        this.department = department;
        this.semester = semester;
        this.description = description;
        this.prerequisites = prerequisites;
        this.modulesJson = modulesJson;
    }

    public static CutmCourseBuilder builder() {
        return new CutmCourseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getBasketCategory() { return basketCategory; }
    public void setBasketCategory(String basketCategory) { this.basketCategory = basketCategory; }

    public String getBasketName() { return basketName; }
    public void setBasketName(String basketName) { this.basketName = basketName; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public String getLtp() { return ltp; }
    public void setLtp(String ltp) { this.ltp = ltp; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPrerequisites() { return prerequisites; }
    public void setPrerequisites(String prerequisites) { this.prerequisites = prerequisites; }

    public String getModulesJson() { return modulesJson; }
    public void setModulesJson(String modulesJson) { this.modulesJson = modulesJson; }

    public static class CutmCourseBuilder {
        private Long id;
        private String courseCode;
        private String courseTitle;
        private String basketCategory;
        private String basketName;
        private Integer credits;
        private String ltp;
        private String department;
        private String semester;
        private String description;
        private String prerequisites;
        private String modulesJson;

        public CutmCourseBuilder id(Long id) { this.id = id; return this; }
        public CutmCourseBuilder courseCode(String courseCode) { this.courseCode = courseCode; return this; }
        public CutmCourseBuilder courseTitle(String courseTitle) { this.courseTitle = courseTitle; return this; }
        public CutmCourseBuilder basketCategory(String basketCategory) { this.basketCategory = basketCategory; return this; }
        public CutmCourseBuilder basketName(String basketName) { this.basketName = basketName; return this; }
        public CutmCourseBuilder credits(Integer credits) { this.credits = credits; return this; }
        public CutmCourseBuilder ltp(String ltp) { this.ltp = ltp; return this; }
        public CutmCourseBuilder department(String department) { this.department = department; return this; }
        public CutmCourseBuilder semester(String semester) { this.semester = semester; return this; }
        public CutmCourseBuilder description(String description) { this.description = description; return this; }
        public CutmCourseBuilder prerequisites(String prerequisites) { this.prerequisites = prerequisites; return this; }
        public CutmCourseBuilder modulesJson(String modulesJson) { this.modulesJson = modulesJson; return this; }

        public CutmCourse build() {
            return new CutmCourse(id, courseCode, courseTitle, basketCategory, basketName, credits, ltp, department, semester, description, prerequisites, modulesJson);
        }
    }
}
