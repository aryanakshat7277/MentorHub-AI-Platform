package com.mentorhub;

import com.mentorhub.model.*;
import com.mentorhub.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@SpringBootApplication
public class MentorHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(MentorHubApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(
            UserRepository userRepository,
            GoalRepository goalRepository,
            ResourceRepository resourceRepository,
            BadgeRepository badgeRepository,
            MentoringSessionRepository sessionRepository,
            CertificateRepository certificateRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. GUARANTEE MENTOR ACCOUNT: AKSHAT ARYAN
            User mentor = userRepository.findByEmail("akshat@mentorhub.com")
                .or(() -> userRepository.findByEmail("mentor@mentorhub.com"))
                .orElseGet(() -> User.builder().email("akshat@mentorhub.com").build());
            
            mentor.setName("AKSHAT ARYAN");
            mentor.setEmail("akshat@mentorhub.com");
            mentor.setPassword(passwordEncoder.encode("password123"));
            mentor.setRole("MENTOR");
            mentor.setTitle("Principal AI & Full-Stack Mentor");
            mentor.setCompany("MetaLab Cybernetics");
            mentor.setBio("Guiding scholars in reactive microservices, Spring Boot 3, Angular 17, and RAG architectures.");
            mentor.setSkills("Java 21, Spring Boot 3, Angular 17, WebSockets, Python, C++, Docker");
            mentor.setAvatarUrl("assets/akshat-profile.jpg");
            mentor.setXpPoints(4890);
            mentor.setCurrentStreak(32);
            mentor.setRating(5.0);
            mentor.setHoursMentored(142);
            mentor.setTotalSessions(94);
            mentor.setBadgesCount(16);
            userRepository.save(mentor);

            // 2. GUARANTEE MENTEE 1: KRITI SAGAR
            User mentee1 = userRepository.findByEmail("kriti@mentorhub.com")
                .orElseGet(() -> User.builder().email("kriti@mentorhub.com").build());
            mentee1.setName("KRITI SAGAR");
            mentee1.setEmail("kriti@mentorhub.com");
            mentee1.setPassword(passwordEncoder.encode("password123"));
            mentee1.setRole("MENTEE");
            mentee1.setTitle("Junior AI Engineer & Full Stack Mentee");
            mentee1.setCompany("Quantum Dynamics");
            mentee1.setBio("Learning Spring Boot 3, Microservices, and Angular 17 Standalone Architecture under AKSHAT ARYAN.");
            mentee1.setSkills("Java 21, Spring Boot 3, Angular 17, WebSockets, PostgreSQL");
            mentee1.setAvatarUrl("assets/kriti-profile.jpg");
            mentee1.setXpPoints(2450);
            mentee1.setCurrentStreak(14);
            mentee1.setRating(4.9);
            mentee1.setHoursMentored(48);
            mentee1.setTotalSessions(32);
            mentee1.setBadgesCount(12);
            userRepository.save(mentee1);

            // 3. GUARANTEE MENTEE 2: VANAJA
            User mentee2 = userRepository.findByEmail("vanaja@mentorhub.com")
                .orElseGet(() -> User.builder().email("vanaja@mentorhub.com").build());
            mentee2.setName("VANAJA");
            mentee2.setEmail("vanaja@mentorhub.com");
            mentee2.setPassword(passwordEncoder.encode("password123"));
            mentee2.setRole("MENTEE");
            mentee2.setTitle("AI Systems & Data Scholar");
            mentee2.setCompany("CloudCore Systems");
            mentee2.setBio("Focusing on Machine Learning Data Pipelines & Web Architectures.");
            mentee2.setSkills("Python, C++, SQL, PyTorch, Docker");
            mentee2.setAvatarUrl("assets/vanaja-profile.jpg");
            mentee2.setXpPoints(2100);
            mentee2.setCurrentStreak(11);
            mentee2.setRating(4.85);
            mentee2.setHoursMentored(36);
            mentee2.setTotalSessions(24);
            mentee2.setBadgesCount(10);
            userRepository.save(mentee2);

            // 4. GUARANTEE MENTEE 3: PAVANI
            User mentee3 = userRepository.findByEmail("pavani@mentorhub.com")
                .orElseGet(() -> User.builder().email("pavani@mentorhub.com").build());
            mentee3.setName("PAVANI");
            mentee3.setEmail("pavani@mentorhub.com");
            mentee3.setPassword(passwordEncoder.encode("password123"));
            mentee3.setRole("MENTEE");
            mentee3.setTitle("Cloud & Frontend Systems Scholar");
            mentee3.setCompany("Apex Digital Labs");
            mentee3.setBio("Exploring Real-time WebSockets, HTML5 Canvas, & Microservices Architecture.");
            mentee3.setSkills("TypeScript, Angular 17, Java 21, Docker, Kubernetes");
            mentee3.setAvatarUrl("assets/pavani-profile.jpg");
            mentee3.setXpPoints(1950);
            mentee3.setCurrentStreak(9);
            mentee3.setRating(4.8);
            mentee3.setHoursMentored(30);
            mentee3.setTotalSessions(20);
            mentee3.setBadgesCount(9);
            userRepository.save(mentee3);

            // 5. GUARANTEE SYSTEM ADMIN
            User admin = userRepository.findByEmail("admin@mentorhub.com")
                .orElseGet(() -> User.builder().email("admin@mentorhub.com").build());
            admin.setName("SYSTEM ADMIN");
            admin.setEmail("admin@mentorhub.com");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole("ADMIN");
            admin.setTitle("Principal Security & Platform Governance");
            admin.setCompany("MentorHub Security Operations");
            admin.setBio("Managing platform security, audit logs, and verified certificate authority.");
            admin.setSkills("Spring Security 6, JWT, Microservices Ingress, Auditing");
            admin.setAvatarUrl("assets/mentorhub-logo.png");
            admin.setXpPoints(9990);
            admin.setCurrentStreak(60);
            admin.setRating(5.0);
            userRepository.save(admin);

            // 6. PRE-SEED SESSIONS IF EMPTY
            if (sessionRepository.count() == 0) {
                sessionRepository.save(MentoringSession.builder()
                        .mentorId(mentor.getId())
                        .mentorName(mentor.getName())
                        .menteeId(mentee1.getId())
                        .menteeName(mentee1.getName())
                        .topic("Spring Boot 3 WebSockets & Real-Time Sync")
                        .scheduledAt(LocalDateTime.now().plusDays(1))
                        .durationMinutes(60)
                        .status("CONFIRMED")
                        .meetingLink("http://localhost:4200/workspace")
                        .notes("Focusing on Signal state management and WebSocket STOMP protocol pairing.")
                        .build());

                sessionRepository.save(MentoringSession.builder()
                        .mentorId(mentor.getId())
                        .mentorName(mentor.getName())
                        .menteeId(mentee2.getId())
                        .menteeName(mentee2.getName())
                        .topic("Distributed RAG Vector Search & Embeddings")
                        .scheduledAt(LocalDateTime.now().plusDays(2))
                        .durationMinutes(45)
                        .status("PENDING")
                        .meetingLink("http://localhost:4200/workspace")
                        .notes("Reviewing cosine distance similarity and token chunking.")
                        .build());
            }

            // 7. PRE-SEED GOALS IF EMPTY
            if (goalRepository.count() == 0) {
                goalRepository.save(Goal.builder()
                        .userId(mentee1.getId())
                        .title("Master Spring Boot 3 Security & OAuth2")
                        .category("S")
                        .categoryName("Specific")
                        .description("Implement JWT tokens with role-based access control and method-level security")
                        .progressPercentage(85)
                        .status("IN_PROGRESS")
                        .targetDate("2026-09-15")
                        .build());

                goalRepository.save(Goal.builder()
                        .userId(mentee1.getId())
                        .title("Build Reactive Angular 17 UI Architecture")
                        .category("M")
                        .categoryName("Measurable")
                        .description("Construct Signal-driven state management with 3D claymorphic components")
                        .progressPercentage(70)
                        .status("IN_PROGRESS")
                        .targetDate("2026-09-30")
                        .build());

                goalRepository.save(Goal.builder()
                        .userId(mentee1.getId())
                        .title("Deploy Production AI Model Pipeline")
                        .category("R")
                        .categoryName("Relevant")
                        .description("Configure high-throughput inference endpoints with low latency SLA")
                        .progressPercentage(100)
                        .status("ACHIEVED")
                        .targetDate("2026-08-10")
                        .build());
            }

            // 8. PRE-SEED RESOURCES IF EMPTY
            if (resourceRepository.count() == 0) {
                resourceRepository.save(Resource.builder()
                        .title("Spring Boot 3 & Java 21 Architecture Guide")
                        .type("ARTICLE")
                        .category("Backend")
                        .url("https://spring.io/projects/spring-boot")
                        .description("Deep dive into Project Loom virtual threads, AOT compilation, and GraalVM native images.")
                        .author("AKSHAT ARYAN")
                        .readTime("12 mins")
                        .bookmarked(true)
                        .build());

                resourceRepository.save(Resource.builder()
                        .title("Angular 17 Signals & Skeuomorphic Design")
                        .type("COURSE")
                        .category("Frontend")
                        .url("https://angular.dev")
                        .description("Master standalone components, fine-grained reactivity with Signals, and 3D claymorphic design tokens.")
                        .author("PAVANI")
                        .readTime("25 mins")
                        .bookmarked(true)
                        .build());

                resourceRepository.save(Resource.builder()
                        .title("Microservices & Kubernetes Ingress Mesh")
                        .type("DOCUMENT")
                        .category("DevOps")
                        .url("https://kubernetes.io")
                        .description("Step-by-step production orchestration handbook for self-healing replica sets and zero-downtime rolling deploys.")
                        .author("VANAJA")
                        .readTime("18 mins")
                        .bookmarked(false)
                        .build());
            }

            // 9. PRE-SEED BADGES IF EMPTY
            if (badgeRepository.count() == 0) {
                badgeRepository.save(Badge.builder()
                        .name("👑 Master Mentor")
                        .description("Awarded for delivering over 100 hours of peer mentorship with 5-star rating.")
                        .category("Leadership")
                        .xpValue(500)
                        .iconUrl("👑")
                        .build());

                badgeRepository.save(Badge.builder()
                        .name("⚡ High Scholar")
                        .description("Maintained a continuous daily learning streak of 14 days.")
                        .category("Streak")
                        .xpValue(300)
                        .iconUrl("⚡")
                        .build());

                badgeRepository.save(Badge.builder()
                        .name("🌐 Cloud Pioneer")
                        .description("Successfully deployed a distributed microservices mesh with zero downtime.")
                        .category("Technical")
                        .xpValue(400)
                        .iconUrl("🌐")
                        .build());
            }

            // 10. PRE-SEED CERTIFICATES IF EMPTY
            if (certificateRepository.count() == 0) {
                certificateRepository.save(Certificate.builder()
                        .certificateNumber("MH-2026-8894-AK")
                        .studentName("KRITI SAGAR")
                        .courseName("Full-Stack Reactive Microservices Mastery")
                        .mentorName("AKSHAT ARYAN")
                        .completionDate("August 2026")
                        .verificationUrl("http://localhost:4200/verify/MH-2026-8894-AK")
                        .qrCodeData("VERIFIED: MH-2026-8894-AK | KRITI SAGAR | AKSHAT ARYAN")
                        .status("APPROVED")
                        .build());
            }
        };
    }
}
