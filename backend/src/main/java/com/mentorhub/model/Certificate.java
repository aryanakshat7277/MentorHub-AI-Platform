package com.mentorhub.model;

import jakarta.persistence.*;

@Entity
@Table(name = "certificates")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String certificateNumber;

    private String studentName;
    private String courseName;
    private String mentorName;
    private String completionDate;
    private String verificationUrl;

    @Column(length = 2000)
    private String qrCodeData;
    private String status;

    public Certificate() {}

    public Certificate(Long id, String certificateNumber, String studentName, String courseName, String mentorName, String completionDate, String verificationUrl, String qrCodeData, String status) {
        this.id = id;
        this.certificateNumber = certificateNumber;
        this.studentName = studentName;
        this.courseName = courseName;
        this.mentorName = mentorName;
        this.completionDate = completionDate;
        this.verificationUrl = verificationUrl;
        this.qrCodeData = qrCodeData;
        this.status = status;
    }

    public static CertificateBuilder builder() { return new CertificateBuilder(); }

    public static class CertificateBuilder {
        private Long id;
        private String certificateNumber;
        private String studentName;
        private String courseName;
        private String mentorName;
        private String completionDate;
        private String verificationUrl;
        private String qrCodeData;
        private String status;

        public CertificateBuilder id(Long id) { this.id = id; return this; }
        public CertificateBuilder certificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; return this; }
        public CertificateBuilder studentName(String studentName) { this.studentName = studentName; return this; }
        public CertificateBuilder courseName(String courseName) { this.courseName = courseName; return this; }
        public CertificateBuilder mentorName(String mentorName) { this.mentorName = mentorName; return this; }
        public CertificateBuilder completionDate(String completionDate) { this.completionDate = completionDate; return this; }
        public CertificateBuilder verificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; return this; }
        public CertificateBuilder qrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; return this; }
        public CertificateBuilder status(String status) { this.status = status; return this; }

        public Certificate build() {
            return new Certificate(id, certificateNumber, studentName, courseName, mentorName, completionDate, verificationUrl, qrCodeData, status);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getMentorName() { return mentorName; }
    public void setMentorName(String mentorName) { this.mentorName = mentorName; }
    public String getCompletionDate() { return completionDate; }
    public void setCompletionDate(String completionDate) { this.completionDate = completionDate; }
    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }
    public String getQrCodeData() { return qrCodeData; }
    public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
