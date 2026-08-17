package com.mentorhub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "resources")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String type; // ARTICLE, VIDEO, COURSE, BOOK, PDF, PICTURE, DOCUMENT
    private String category;
    private String url;

    @Column(length = 2000)
    private String description;

    private String readTime;
    private String author;
    private Boolean bookmarked = false;

    private String fileName;
    private String fileType;

    @Lob
    @Column(columnDefinition = "CLOB")
    private String fileData;

    private Boolean isUserUploaded = false;

    public Resource() {}

    public Resource(Long id, String title, String type, String category, String url, String description, String readTime, String author, Boolean bookmarked, String fileName, String fileType, String fileData, Boolean isUserUploaded) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.category = category;
        this.url = url;
        this.description = description;
        this.readTime = readTime;
        this.author = author;
        this.bookmarked = bookmarked != null ? bookmarked : false;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileData = fileData;
        this.isUserUploaded = isUserUploaded != null ? isUserUploaded : false;
    }

    public static ResourceBuilder builder() { return new ResourceBuilder(); }

    public static class ResourceBuilder {
        private Long id;
        private String title;
        private String type;
        private String category;
        private String url;
        private String description;
        private String readTime;
        private String author;
        private Boolean bookmarked = false;
        private String fileName;
        private String fileType;
        private String fileData;
        private Boolean isUserUploaded = false;

        public ResourceBuilder id(Long id) { this.id = id; return this; }
        public ResourceBuilder title(String title) { this.title = title; return this; }
        public ResourceBuilder type(String type) { this.type = type; return this; }
        public ResourceBuilder category(String category) { this.category = category; return this; }
        public ResourceBuilder url(String url) { this.url = url; return this; }
        public ResourceBuilder description(String description) { this.description = description; return this; }
        public ResourceBuilder readTime(String readTime) { this.readTime = readTime; return this; }
        public ResourceBuilder author(String author) { this.author = author; return this; }
        public ResourceBuilder bookmarked(Boolean bookmarked) { this.bookmarked = bookmarked; return this; }
        public ResourceBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public ResourceBuilder fileType(String fileType) { this.fileType = fileType; return this; }
        public ResourceBuilder fileData(String fileData) { this.fileData = fileData; return this; }
        public ResourceBuilder isUserUploaded(Boolean isUserUploaded) { this.isUserUploaded = isUserUploaded; return this; }

        public Resource build() {
            return new Resource(id, title, type, category, url, description, readTime, author, bookmarked, fileName, fileType, fileData, isUserUploaded);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReadTime() { return readTime; }
    public void setReadTime(String readTime) { this.readTime = readTime; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public Boolean getBookmarked() { return bookmarked; }
    public void setBookmarked(Boolean bookmarked) { this.bookmarked = bookmarked; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public String getFileData() { return fileData; }
    public void setFileData(String fileData) { this.fileData = fileData; }
    public Boolean getIsUserUploaded() { return isUserUploaded; }
    public void setIsUserUploaded(Boolean isUserUploaded) { this.isUserUploaded = isUserUploaded; }
}
