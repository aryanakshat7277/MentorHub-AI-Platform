package com.mentorhub.controller;

import com.mentorhub.model.Certificate;
import com.mentorhub.repository.CertificateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/certificates")
public class CertificateController {

    private final CertificateRepository certificateRepository;

    public CertificateController(CertificateRepository certificateRepository) {
        this.certificateRepository = certificateRepository;
    }

    @GetMapping
    public ResponseEntity<List<Certificate>> getCertificates() {
        return ResponseEntity.ok(certificateRepository.findAll());
    }

    @PostMapping("/request")
    public ResponseEntity<Certificate> requestCertificate(@RequestBody Certificate certRequest) {
        String certNo = "CERT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase() + "-OFFICIAL";
        certRequest.setCertificateNumber(certNo);
        if (certRequest.getCompletionDate() == null) {
            certRequest.setCompletionDate(LocalDate.now().toString());
        }
        if (certRequest.getMentorName() == null || certRequest.getMentorName().trim().isEmpty()) {
            certRequest.setMentorName("Akshat Aryan");
        }
        if (certRequest.getStudentName() == null || certRequest.getStudentName().trim().isEmpty()) {
            certRequest.setStudentName("Kriti Sagar");
        }
        if (certRequest.getCourseName() == null || certRequest.getCourseName().trim().isEmpty()) {
            certRequest.setCourseName("Full-Stack Spring Boot & Angular Architecture");
        }

        certRequest.setVerificationUrl("http://localhost:4200/verify-certificate/" + certNo);
        // Initially set status to REQUESTED (Pending mentor approval - no QR code yet)
        certRequest.setStatus("REQUESTED");
        certRequest.setQrCodeData(null);

        Certificate saved = certificateRepository.save(certRequest);
        return ResponseEntity.ok(saved);
    }

    private String buildQrCodeUrl(Certificate cert) {
        String student = cert.getStudentName() != null ? cert.getStudentName() : "Kriti Sagar";
        String course = cert.getCourseName() != null ? cert.getCourseName() : "Full-Stack Spring Boot & Angular Architecture";
        String mentor = cert.getMentorName() != null ? cert.getMentorName() : "Akshat Aryan";
        String certNo = cert.getCertificateNumber() != null ? cert.getCertificateNumber() : "CERT-OFFICIAL";
        String issueDate = cert.getCompletionDate() != null ? cert.getCompletionDate() : "2026-07-10";
        String verifyUrl = cert.getVerificationUrl() != null ? cert.getVerificationUrl() : ("http://localhost:4200/verify-certificate/" + certNo);

        String fullTextPayload = String.format(
            "==================================================\n" +
            "🎓 MENTORHUB ACADEMY 🎓\n" +
            "ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026\n" +
            "==================================================\n\n" +
            "📜 CERTIFICATE OF MENTORSHIP\n" +
            "FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE\n\n" +
            "This official credential is proudly awarded to:\n" +
            "👤 MENTEE (RECIPIENT): %s\n\n" +
            "for demonstrating exceptional technical capability, architectural mastery, and 100%% completion of mentorship requirements in:\n" +
            "📘 COURSE / MASTERCLASS: %s\n\n" +
            "✍️ CERTIFIED & AUDITED BY:\n" +
            "👨‍🏫 MASTER MENTOR: %s\n" +
            "DESIGNATION: Senior Software Architect & Master Mentor\n" +
            "ORGANIZATION: MentorHub AI Engineering Academy\n\n" +
            "🛡️ OFFICIAL VERIFICATION METADATA:\n" +
            "CERTIFICATE NUMBER: %s\n" +
            "ISSUE DATE: %s\n" +
            "AUTHENTICITY STATUS: VERIFIED & APPROVED (100%% AUTHENTIC)\n" +
            "VERIFICATION PORTAL: %s\n" +
            "==================================================",
            student, course, mentor, certNo, issueDate, verifyUrl
        );

        try {
            String encodedPayload = java.net.URLEncoder.encode(fullTextPayload, java.nio.charset.StandardCharsets.UTF_8.name());
            return "https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=" + encodedPayload;
        } catch (Exception e) {
            return "https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=" + certNo;
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Certificate> approveCertificate(@PathVariable Long id) {
        return certificateRepository.findById(id)
                .map(cert -> {
                    cert.setStatus("APPROVED");
                    if (cert.getVerificationUrl() == null) {
                        cert.setVerificationUrl("http://localhost:4200/verify-certificate/" + cert.getCertificateNumber());
                    }
                    // Generate official QR code containing complete certificate record
                    cert.setQrCodeData(buildQrCodeUrl(cert));
                    return ResponseEntity.ok(certificateRepository.save(cert));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Certificate> rejectCertificate(@PathVariable Long id) {
        return certificateRepository.findById(id)
                .map(cert -> {
                    cert.setStatus("REJECTED");
                    cert.setQrCodeData(null);
                    return ResponseEntity.ok(certificateRepository.save(cert));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/generate")
    public ResponseEntity<Certificate> generateCertificate(@RequestBody Certificate certRequest) {
        String certNo = "CERT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase() + "-OFFICIAL";
        certRequest.setCertificateNumber(certNo);
        if (certRequest.getCompletionDate() == null) {
            certRequest.setCompletionDate(LocalDate.now().toString());
        }
        certRequest.setVerificationUrl("http://localhost:4200/verify-certificate/" + certNo);
        certRequest.setQrCodeData(buildQrCodeUrl(certRequest));
        certRequest.setStatus("APPROVED");

        Certificate saved = certificateRepository.save(certRequest);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<?> verifyCertificate(@PathVariable String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
