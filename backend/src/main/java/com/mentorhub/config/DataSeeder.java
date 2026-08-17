package com.mentorhub.config;

import com.mentorhub.model.*;
import com.mentorhub.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MentoringSessionRepository sessionRepository;
    private final GoalRepository goalRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final CertificateRepository certificateRepository;
    private final ResourceRepository resourceRepository;
    private final WorkspaceSessionRepository workspaceSessionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      MentoringSessionRepository sessionRepository,
                      GoalRepository goalRepository,
                      BadgeRepository badgeRepository,
                      UserBadgeRepository userBadgeRepository,
                      CertificateRepository certificateRepository,
                      ResourceRepository resourceRepository,
                      WorkspaceSessionRepository workspaceSessionRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.goalRepository = goalRepository;
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.certificateRepository = certificateRepository;
        this.resourceRepository = resourceRepository;
        this.workspaceSessionRepository = workspaceSessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String mentorAvatar = "assets/akshat-profile.jpg";
        String mentee1Avatar = "assets/kriti-profile.jpg";
        String mentee2Avatar = "assets/pavani-profile.jpg";
        String mentee3Avatar = "assets/vanaja-profile.jpg";

        // Preserve any custom user-uploaded files across application restarts
        List<Resource> preservedUploadedResources = resourceRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsUserUploaded()) || (r.getFileData() != null && !r.getFileData().trim().isEmpty()))
                .collect(Collectors.toList());

        // ALWAYS perform a clean database purge to guarantee zero non-compliant legacy records
        userBadgeRepository.deleteAll();
        workspaceSessionRepository.deleteAll();
        sessionRepository.deleteAll();
        goalRepository.deleteAll();
        certificateRepository.deleteAll();
        resourceRepository.deleteAll();
        userRepository.deleteAll();
        badgeRepository.deleteAll();

        // 1. Seed Official Mentor: AKSHAT ARYAN (Role: MENTOR)
        User mentor = User.builder()
                .name("AKSHAT ARYAN")
                .email("akshat@mentorhub.com")
                .password(passwordEncoder.encode("password123"))
                .role("MENTOR")
                .title("Principal AI & Full Stack Mentor")
                .company("MetaLab Cybernetics")
                .bio("Principal AI & Full Stack Mentor specializing in Java 21, Spring Boot 3, Angular 17 Standalone Architecture, and Enterprise AI Systems.")
                .xpPoints(4890)
                .currentStreak(32)
                .rating(5.0)
                .hoursMentored(142)
                .totalSessions(94)
                .badgesCount(16)
                .avatarUrl(mentorAvatar)
                .skills("Java 21, Spring Boot 3, Angular 17, WebSockets, Neural Search, Microservices Architecture")
                .build();
        mentor = userRepository.save(mentor);

        // 2. Seed Official Mentees: KRITI SAGAR, PAVANI, VANAJA (Role: MENTEE)
        User mentee1 = User.builder()
                .name("KRITI SAGAR")
                .email("kriti@mentorhub.com")
                .password(passwordEncoder.encode("password123"))
                .role("MENTEE")
                .title("Junior AI Engineer & Full Stack Mentee")
                .company("Quantum Dynamics")
                .bio("Learning Spring Boot 3, Microservices, Angular 17 Standalone Architecture, and RAG AI Systems under mentor AKSHAT ARYAN.")
                .xpPoints(2450)
                .currentStreak(14)
                .rating(4.9)
                .hoursMentored(28)
                .totalSessions(18)
                .badgesCount(8)
                .avatarUrl(mentee1Avatar)
                .skills("Java 21, Spring Boot 3, Angular 17, WebSockets, H2/PostgreSQL Data Pipelines")
                .build();

        User mentee2 = User.builder()
                .name("PAVANI")
                .email("pavani@mentorhub.com")
                .password(passwordEncoder.encode("password123"))
                .role("MENTEE")
                .title("Full Stack & Cloud Mentee")
                .company("Cybernet Core Systems")
                .bio("Specializing in WebSockets, Spring Data JPA, and Reactive UI Component Systems under mentor AKSHAT ARYAN.")
                .xpPoints(2120)
                .currentStreak(11)
                .rating(4.85)
                .hoursMentored(22)
                .totalSessions(14)
                .badgesCount(6)
                .avatarUrl(mentee2Avatar)
                .skills("Angular 17, Standalone Components, RxJS, TypeScript, Canvas Graphics")
                .build();

        User mentee3 = User.builder()
                .name("VANAJA")
                .email("vanaja@mentorhub.com")
                .password(passwordEncoder.encode("password123"))
                .role("MENTEE")
                .title("AI Systems & DevOps Mentee")
                .company("CloudPulse Infrastructure")
                .bio("Focusing on Distributed Microservices, Docker Containers, and Automated CI/CD Pipelines under mentor AKSHAT ARYAN.")
                .xpPoints(1980)
                .currentStreak(9)
                .rating(4.8)
                .hoursMentored(18)
                .totalSessions(12)
                .badgesCount(5)
                .avatarUrl(mentee3Avatar)
                .skills("Spring WebSockets, Docker, Kubernetes, H2 Persistence, CI/CD")
                .build();

        userRepository.saveAll(List.of(mentee1, mentee2, mentee3));

        // 3. Seed Official System Admin (Role: ADMIN)
        User admin = User.builder()
                .name("SYSTEM ADMIN")
                .email("admin@mentorhub.com")
                .password(passwordEncoder.encode("password123"))
                .role("ADMIN")
                .title("Platform Chief System Administrator")
                .company("MentorHub Core")
                .bio("System Administrator managing global platform infrastructure, security policies, and AI matching matrices.")
                .xpPoints(9990)
                .currentStreak(100)
                .rating(5.0)
                .hoursMentored(500)
                .totalSessions(350)
                .badgesCount(50)
                .avatarUrl("assets/mentorhub-logo.png")
                .skills("Spring Boot 3, Security, System Administration, Infrastructure, H2 Database")
                .build();
        userRepository.save(admin);

        // Seed Sessions (Mentor: AKSHAT ARYAN, Mentees: KRITI SAGAR, PAVANI, VANAJA)
        MentoringSession session1 = MentoringSession.builder()
                .mentorId(mentor.getId())
                .mentorName(mentor.getName())
                .menteeId(mentee1.getId())
                .menteeName(mentee1.getName())
                .topic("Spring Boot 3 WebSockets & Real-Time Code Sync")
                .scheduledAt(LocalDateTime.now().plusDays(1).withHour(15).withMinute(0))
                .durationMinutes(60)
                .status("CONFIRMED")
                .meetingLink("https://meet.mentorhub.ai/ws-session-77")
                .notes("Focus on TextWebSocketHandler, JSON payload parsing, and state synchronization.")
                .build();

        MentoringSession session2 = MentoringSession.builder()
                .mentorId(mentor.getId())
                .mentorName(mentor.getName())
                .menteeId(mentee2.getId())
                .menteeName(mentee2.getName())
                .topic("Angular 17 Standalone Architecture & Signal State")
                .scheduledAt(LocalDateTime.now().plusDays(2).withHour(16).withMinute(30))
                .durationMinutes(45)
                .status("CONFIRMED")
                .meetingLink("https://meet.mentorhub.ai/ws-session-88")
                .notes("Review Standalone routes, Signal inputs/outputs, and SCSS cybernetic design tokens.")
                .build();

        MentoringSession session3 = MentoringSession.builder()
                .mentorId(mentor.getId())
                .mentorName(mentor.getName())
                .menteeId(mentee3.getId())
                .menteeName(mentee3.getName())
                .topic("Distributed RAG Vector Search & Embeddings")
                .scheduledAt(LocalDateTime.now().plusDays(4).withHour(11).withMinute(0))
                .durationMinutes(60)
                .status("PENDING")
                .meetingLink("https://meet.mentorhub.ai/ws-session-99")
                .notes("Explore H2/PostgreSQL vector extensions and cosine similarity calculation.")
                .build();

        sessionRepository.saveAll(List.of(session1, session2, session3));

        // Seed Goals across SMART Framework and 3 Status Columns (TO_DO, IN_PROGRESS, ACHIEVED)
        Goal goal1 = Goal.builder()
                .userId(mentee1.getId())
                .title("Master Spring Boot 3 Security & JWT Handlers")
                .description("Deep dive into JwtAuthenticationFilter, Custom UserDetailsService, and role-based access control.")
                .category("M")
                .categoryName("Measurable")
                .targetDate("2026-09-01")
                .progressPercentage(85)
                .status("IN_PROGRESS")
                .build();

        Goal goal2 = Goal.builder()
                .userId(mentee2.getId())
                .title("Build Reactive Canvas Graphics & Sci-Fi Dashboard")
                .description("Develop 300 DPI canvas rendering engine with WebGL neon particle overlays and responsive layout.")
                .category("R")
                .categoryName("Relevant")
                .targetDate("2026-09-15")
                .progressPercentage(70)
                .status("IN_PROGRESS")
                .build();

        Goal goal3 = Goal.builder()
                .userId(mentee3.getId())
                .title("Implement OAuth2 & Google Single Sign-On")
                .description("Integrate Spring Security 6 OAuth2 Client for seamless 1-click Google authentication.")
                .category("S")
                .categoryName("Specific")
                .targetDate("2026-09-25")
                .progressPercentage(0)
                .status("TO_DO")
                .build();

        Goal goal4 = Goal.builder()
                .userId(mentor.getId())
                .title("Design Microservice Circuit Breaker Resilience")
                .description("Configure Resilience4j fault tolerance and fallback handlers across REST endpoints.")
                .category("A")
                .categoryName("Achievable")
                .targetDate("2026-10-05")
                .progressPercentage(0)
                .status("TO_DO")
                .build();

        Goal goal5 = Goal.builder()
                .userId(mentee1.getId())
                .title("Complete Full-Stack Spring Boot & Angular Certification")
                .description("Passed official Masterclass assessment and earned 300 DPI Cryptographic Verified Certificate.")
                .category("S")
                .categoryName("Specific")
                .targetDate("2026-07-10")
                .progressPercentage(100)
                .status("ACHIEVED")
                .build();

        Goal goal6 = Goal.builder()
                .userId(mentee2.getId())
                .title("Deploy H2 Database Seeder & Dynamic Asset Binding")
                .description("Successfully configured automated schema seeding, permanent photo assets, and fallback resolvers.")
                .category("M")
                .categoryName("Measurable")
                .targetDate("2026-08-14")
                .progressPercentage(100)
                .status("ACHIEVED")
                .build();

        Goal goal7 = Goal.builder()
                .userId(mentee3.getId())
                .title("Setup WebSocket Text & Code Synchronization")
                .description("Implement STOMP over SockJS to enable multi-peer real-time collaborative coding and notes.")
                .category("T")
                .categoryName("Time-bound")
                .targetDate("2026-09-10")
                .progressPercentage(50)
                .status("IN_PROGRESS")
                .build();

        goalRepository.saveAll(List.of(goal1, goal2, goal3, goal4, goal5, goal6, goal7));

        // Seed Badges
        Badge badge1 = Badge.builder()
                .name("Quantum Architect")
                .description("Successfully orchestrated 50+ real-time mentoring sessions.")
                .iconUrl("⚡")
                .category("MENTORSHIP")
                .xpValue(300)
                .build();

        Badge badge2 = Badge.builder()
                .name("Code Titan")
                .description("Authored over 5,000 lines of verified Spring Boot & Angular code.")
                .iconUrl("💻")
                .category("CODING")
                .xpValue(500)
                .build();

        Badge badge3 = Badge.builder()
                .name("14-Day Streak Master")
                .description("Maintained an active continuous daily learning streak for 14 days.")
                .iconUrl("🔥")
                .category("STREAK")
                .xpValue(400)
                .build();

        Badge badge4 = Badge.builder()
                .name("Certified Specialist")
                .description("Earned an official verified AI Architecture Certificate.")
                .iconUrl("🎓")
                .category("COMMUNITY")
                .xpValue(600)
                .build();

        badgeRepository.saveAll(List.of(badge1, badge2, badge3, badge4));

        // Seed Certificates (Approved and Requested workflow testing)
        String cert1Text = "==================================================\n" +
                "🎓 MENTORHUB ACADEMY 🎓\n" +
                "ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026\n" +
                "==================================================\n\n" +
                "📜 CERTIFICATE OF MENTORSHIP\n" +
                "FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE\n\n" +
                "This official credential is proudly awarded to:\n" +
                "👤 MENTEE (RECIPIENT): Kriti Sagar\n\n" +
                "for demonstrating exceptional technical capability, architectural mastery, and 100% completion of mentorship requirements in:\n" +
                "📘 COURSE / MASTERCLASS: Full-Stack Spring Boot & Angular Architecture\n\n" +
                "✍️ CERTIFIED & AUDITED BY:\n" +
                "👨‍🏫 MASTER MENTOR: Akshat Aryan\n" +
                "DESIGNATION: Senior Software Architect & Master Mentor\n" +
                "ORGANIZATION: MentorHub AI Engineering Academy\n\n" +
                "🛡️ OFFICIAL VERIFICATION METADATA:\n" +
                "CERTIFICATE NUMBER: CERT-JRIN-OFFICIAL\n" +
                "ISSUE DATE: 2026-07-10\n" +
                "AUTHENTICITY STATUS: VERIFIED & APPROVED (100% AUTHENTIC)\n" +
                "VERIFICATION PORTAL: http://localhost:4200/verify-certificate/CERT-JRIN-OFFICIAL\n" +
                "==================================================";

        String cert1QrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=" +
                java.net.URLEncoder.encode(cert1Text, java.nio.charset.StandardCharsets.UTF_8);

        Certificate cert1 = Certificate.builder()
                .certificateNumber("CERT-JRIN-OFFICIAL")
                .studentName("Kriti Sagar")
                .courseName("Full-Stack Spring Boot & Angular Architecture")
                .mentorName("Akshat Aryan")
                .completionDate("2026-07-10")
                .verificationUrl("http://localhost:4200/verify-certificate/CERT-JRIN-OFFICIAL")
                .qrCodeData(cert1QrUrl)
                .status("APPROVED")
                .build();

        String cert2Text = "==================================================\n" +
                "🎓 MENTORHUB ACADEMY 🎓\n" +
                "ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026\n" +
                "==================================================\n\n" +
                "📜 CERTIFICATE OF MENTORSHIP\n" +
                "FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE\n\n" +
                "This official credential is proudly awarded to:\n" +
                "👤 MENTEE (RECIPIENT): Pavani\n\n" +
                "for demonstrating exceptional technical capability, architectural mastery, and 100% completion of mentorship requirements in:\n" +
                "📘 COURSE / MASTERCLASS: Reactive AI Systems & Distributed Architecture\n\n" +
                "✍️ CERTIFIED & AUDITED BY:\n" +
                "👨‍🏫 MASTER MENTOR: Akshat Aryan\n" +
                "DESIGNATION: Senior Software Architect & Master Mentor\n" +
                "ORGANIZATION: MentorHub AI Engineering Academy\n\n" +
                "🛡️ OFFICIAL VERIFICATION METADATA:\n" +
                "CERTIFICATE NUMBER: CERT-PVN-OFFICIAL\n" +
                "ISSUE DATE: 2026-08-14\n" +
                "AUTHENTICITY STATUS: VERIFIED & APPROVED (100% AUTHENTIC)\n" +
                "VERIFICATION PORTAL: http://localhost:4200/verify-certificate/CERT-PVN-OFFICIAL\n" +
                "==================================================";

        String cert2QrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=" +
                java.net.URLEncoder.encode(cert2Text, java.nio.charset.StandardCharsets.UTF_8);

        Certificate cert2 = Certificate.builder()
                .certificateNumber("CERT-PVN-OFFICIAL")
                .studentName("Pavani")
                .courseName("Reactive AI Systems & Distributed Architecture")
                .mentorName("Akshat Aryan")
                .completionDate("2026-08-14")
                .verificationUrl("http://localhost:4200/verify-certificate/CERT-PVN-OFFICIAL")
                .qrCodeData(cert2QrUrl)
                .status("APPROVED")
                .build();

        String cert3Text = "==================================================\n" +
                "🎓 MENTORHUB ACADEMY 🎓\n" +
                "ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026\n" +
                "==================================================\n\n" +
                "📜 CERTIFICATE OF MENTORSHIP\n" +
                "FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE\n\n" +
                "This official credential is proudly awarded to:\n" +
                "👤 MENTEE (RECIPIENT): Vanaja\n\n" +
                "for demonstrating exceptional technical capability, architectural mastery, and 100% completion of mentorship requirements in:\n" +
                "📘 COURSE / MASTERCLASS: Cloud Microservices & WebSockets Engineering\n\n" +
                "✍️ CERTIFIED & AUDITED BY:\n" +
                "👨‍🏫 MASTER MENTOR: Akshat Aryan\n" +
                "DESIGNATION: Senior Software Architect & Master Mentor\n" +
                "ORGANIZATION: MentorHub AI Engineering Academy\n\n" +
                "🛡️ OFFICIAL VERIFICATION METADATA:\n" +
                "CERTIFICATE NUMBER: CERT-VNJ-OFFICIAL\n" +
                "ISSUE DATE: 2026-08-14\n" +
                "AUTHENTICITY STATUS: VERIFIED & APPROVED (100% AUTHENTIC)\n" +
                "VERIFICATION PORTAL: http://localhost:4200/verify-certificate/CERT-VNJ-OFFICIAL\n" +
                "==================================================";

        String cert3QrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=" +
                java.net.URLEncoder.encode(cert3Text, java.nio.charset.StandardCharsets.UTF_8);

        Certificate cert3 = Certificate.builder()
                .certificateNumber("CERT-VNJ-OFFICIAL")
                .studentName("Vanaja")
                .courseName("Cloud Microservices & WebSockets Engineering")
                .mentorName("Akshat Aryan")
                .completionDate("2026-08-14")
                .verificationUrl("http://localhost:4200/verify-certificate/CERT-VNJ-OFFICIAL")
                .qrCodeData(cert3QrUrl)
                .status("APPROVED")
                .build();

        certificateRepository.saveAll(List.of(cert1, cert2, cert3));

        // Seed Resources
        Resource res1 = Resource.builder()
                .title("Spring Boot 3 WebSocket Deep Dive")
                .type("ARTICLE")
                .category("Backend")
                .url("https://spring.io/guides/gs/messaging-stomp-websocket/")
                .description("Step-by-step architectural guide to TextWebSocketHandler and real-time streaming.")
                .readTime("12 min read")
                .author("AKSHAT ARYAN")
                .bookmarked(true)
                .build();

        Resource res2 = Resource.builder()
                .title("Angular 17 Standalone Components Masterclass")
                .type("VIDEO")
                .category("Frontend")
                .url("https://angular.dev")
                .description("Learn standalone component routing, signals, and Sci-Fi styling tokens.")
                .readTime("24 min video")
                .author("AKSHAT ARYAN")
                .bookmarked(true)
                .build();

        Resource res3 = Resource.builder()
                .title("Building AI-Driven Peer Mentoring Platforms")
                .type("COURSE")
                .category("AI/ML")
                .url("https://mentorhub.ai/courses/ai-mentoring")
                .description("Architecting matching algorithms, skill vectors, and automated feedback loops.")
                .readTime("3 hours")
                .author("AKSHAT ARYAN")
                .bookmarked(false)
                .build();

        resourceRepository.saveAll(List.of(res1, res2, res3));

        if (preservedUploadedResources != null && !preservedUploadedResources.isEmpty()) {
            resourceRepository.saveAll(preservedUploadedResources);
        }

        // Seed Workspace Session
        WorkspaceSession workspaceSession = WorkspaceSession.builder()
                .sessionId(session1.getId())
                .activeLanguage("typescript")
                .sharedNotes("# Live Mentoring Workspace Session Notes\n\n- Mentor: AKSHAT ARYAN\n- Mentees: KRITI SAGAR, PAVANI, VANAJA\n- Discussing Spring Boot 3 WebSocket Handlers (`TextWebSocketHandler`).\n- Angular 17 Standalone Component integration.\n- Real-time text sync across peers.\n- Sci-Fi Dark theme token enforcement.")
                .sharedCode("// MentorHub TypeScript Execution (Piston API Sandbox)\nconsole.log(\"Compiler is ready to use\");\nconsole.log(\"Start working on your skills\");")
                .updatedAt(LocalDateTime.now())
                .build();

        workspaceSessionRepository.save(workspaceSession);

        System.out.println(">>> [MentorHub DataSeeder] Database initialized with clean purge! Accounts: AKSHAT ARYAN (MENTOR), KRITI SAGAR (MENTEE), PAVANI (MENTEE), VANAJA (MENTEE), and SYSTEM ADMIN (ADMIN). All passwords set to 'password123'.");
    }
}
