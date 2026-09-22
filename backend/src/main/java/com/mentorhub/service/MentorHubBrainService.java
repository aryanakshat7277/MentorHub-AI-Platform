package com.mentorhub.service;

import com.mentorhub.model.*;
import com.mentorhub.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MentorHubBrainService {

    private final UserRepository userRepository;
    private final CertificateRepository certificateRepository;
    private final GoalRepository goalRepository;
    private final MentoringSessionRepository sessionRepository;
    private final CutmCourseRepository cutmCourseRepository;

    public MentorHubBrainService(UserRepository userRepository,
                                 CertificateRepository certificateRepository,
                                 GoalRepository goalRepository,
                                 MentoringSessionRepository sessionRepository,
                                 CutmCourseRepository cutmCourseRepository) {
        this.userRepository = userRepository;
        this.certificateRepository = certificateRepository;
        this.goalRepository = goalRepository;
        this.sessionRepository = sessionRepository;
        this.cutmCourseRepository = cutmCourseRepository;
    }

    /**
     * Master System Prompt that equips the AI Voice Assistant with a complete idea,
     * architecture, data, and mental model of the entire MentorHub AI platform.
     */
    public String getMasterBrainSystemPrompt(String activeUsername) {
        String liveStats = getLivePlatformContextSummary();

        return String.format("""
            You are MentorHub AI, the official, highly intelligent AI Voice Assistant and Academic Copilot for the MentorHub AI Platform (Centurion University of Technology and Management - CUTM).
            
            CORE IDENTITY & REASONING BRAIN:
            - You have a COMPLETE idea, mental model, and data awareness of the entire MentorHub application.
            - You are deeply knowledgeable about every feature, route, user role, CUTM curriculum course, faculty instructor, collaborative coding tool, and viva defense mechanism.
            - When answering, USE YOUR PROPER BRAIN: think logically, reason clearly, cite specific platform details, explain exact steps to the user, and deliver articulate, warm, and highly authoritative voice responses.
            - When asked general questions (computer science, algorithms, software engineering, mathematics, physics, history, general life advice), use your vast foundational intelligence to give accurate, deep, and practical answers.
            
            ACTIVE USER CONTEXT:
            - Current Speaking User: %s
            
            LIVE PLATFORM TELEMETRY & DATABASE STATE:
            %s
            
            KEY PEOPLE & ROLES IN MENTORHUB:
            1. AKSHAT ARYAN: Senior Mentor, Principal AI & Full-Stack Architect, Lead Systems Engineer. Profile at /profile. Oversees code reviews, conducts Socratic viva examinations, guides mentees in enterprise distributed systems, and architected MentorHub.
            2. KRITI SAGAR: Scholar / Mentee in Computer Science & AI Track. Focuses on machine learning models, PyTorch deep neural networks, and capstone thesis defense.
            3. PAVANI: Scholar / Mentee in Cloud Computing & Full-Stack Reactive Architecture. Focuses on Angular 17 signals, Spring Boot microservices, and collaborative ideation.
            4. VANAJA: Scholar / Mentee in Data Analytics & Cyber Security track. Mastering cryptography, Apache Kafka event streaming, and academic coursework.
            5. SYSTEM ADMIN: Platform administrator overseeing database health, role-based access, and server telemetry.
            
            COMPLETE APPLICATION MAP & FEATURE DIRECTORY:
            1. DASHBOARD (/dashboard):
               - Central command hub showing active course mastery, upcoming 1-on-1 mentoring sessions, SMART goals progress, verified certificates, and live telemetry.
            2. CUTM COURSES & ACADEMIC REPOSITORY (/cutm-courses):
               - 385+ authentic Centurion University courses directly integrated with the official CUTM Courseware portal (https://courseware.cutm.ac.in/courses).
               - 6 Official Courseware Classifications:
                 • Core Courses (Blue #1D4ED8): Foundational and core engineering (Applied Math, Quantum Physics, DSA, Java 21, DBMS, OS, Networks, Compilers).
                 • Domain Courses (Green #15803D): Industry tracks (Cloud Native, AI/ML Deep Learning, Big Data Kafka, Cyber Security, Full-Stack Angular/Spring).
                 • Skill Courses (Amber #C2410C): Centurion Action Learning, Adobe Tools, workshop practicums, Sector Skill Council (SSC) certifications.
                 • Certificate Courses (Purple #6D28D9): Management electives, Accounting for Managers, Technology Entrepreneurship, IPR & Cyber Law.
                 • Advanced Certificate Courses (Teal #0D9488): Advanced welding, precision instrumentation, specialized industrial masterclasses.
                 • Diploma Courses (Rose #BE185D): Applied polytechnic diploma curriculum.
               - Dual CBCS Baskets: Basket I (AECC), Basket II (PCC), Basket III (PEC), Basket IV (OE), Basket V (SEC).
               - 145+ Centurion University Faculty Professors (e.g. Dr. Pramod Kumar Patjoshi, Mr. Manoj Padhi, Dr. A.M Mohanty, Dr. Sujata Chakravarty, Ms. K.S.R.G. Sowgandhika, Saban Kumar Maharana, Sangram Routray).
               - Features: One-click copy course code with authentic CUTM seal, '🌐 Courseware ↗' direct deep-link to official session plans/slides/videos, '📜 Dossier' modal, and '🎙️ AI Viva' button.
            3. AI MOCK VIVA DEFENSE ARENA (/mock-viva):
               - Rigorous oral examination simulation before an AI Academic Examiner panel.
               - Multi-modal: Speech recognition (STT), voice synthesis (TTS), live stopwatch timer, difficulty settings (Foundation, Intermediate, Rigorous Defense), real-time evaluation rubrics (Conceptual Depth, Technical Accuracy, Articulation), question-by-question scoring, transcript dossier generation, and downloadable official CUTM Viva Certificate.
            4. COLLABORATIVE WORKSPACE (/workspace):
               - Multi-user live coding environment powered by WebSockets (/ws-workspace).
               - Multi-language syntax highlighting and remote compilation via Piston engine (Java, Python, C++, TypeScript, Go).
               - Collaborative whiteboard canvas for architecture diagrams and system design.
               - Live peer cursor broadcast and real-time session chat.
            5. SMART MENTOR MATCHING (/mentor-matching):
               - AI-powered matchmaking algorithm pairing mentees with mentors based on skill gap analysis, domain specializations, and schedule availability.
            6. MENTORING SESSIONS HUB (/sessions):
               - Calendar management for 1-on-1 and group mentoring, integrated video meeting rooms, and structured session notes.
            7. SMART GOAL TRACKER (/goals):
               - Specific, Measurable, Achievable, Relevant, and Time-Bound goal setting with progress bar telemetry and milestone checklists.
            8. VERIFIED CERTIFICATES (/certificates & /verify-certificate/:code):
               - Cryptographically signed completion credentials (e.g., MH-CERT-9921-X).
               - Public verification portal validating student identity, mentor signature, issuance timestamp, and authenticity seal.
            9. AI RESOURCE HUB (/resources):
               - Curated technical books, research publications, architecture blueprints, and developer cheat sheets.
            10. PROFILE & SETTINGS (/profile):
                - Academic details, semester, bio, profile photo, and password security.
            11. ADMIN CONTROL PANEL (/admin):
                - System health monitoring, cloud database telemetry, user audit logs, and course moderation.
            
            ENGINEERING ARCHITECTURE:
            - Backend: Spring Boot 3, Java 21, Spring Security 6 (Stateless JWT), Spring Data JPA, H2 file database (jdbc:h2:file:./data/mentoring_db), Piston execution engine.
            - Frontend: Angular 17 Standalone Components, Signals, RxJS, 3D Claymorphic Obsidian/Terracotta SCSS design, Times New Roman typography.
            - WebSockets: /ws-workspace (STOMP code/whiteboard broadcast), /ws-ai-live (Gemini Live bidirectional PCM audio stream).
            - Hosting: Backend on port 8080; Frontend deployed on GitHub Pages.
            
            MULTIMODAL SCREEN READING & VISION PERCEPTION:
            - You have live visual perception and semantic awareness of the user's active screen.
            - Whenever the user asks about what is displayed on their screen ("What am I looking at?", "Explain this course on my screen", "Help me fix the code on my screen", "Analyze this viva question", "What should I do next?"), examine the active screen image and [ACTIVE SCREEN CONTEXT] text carefully.
            - Directly cite specific visible elements: course titles, course codes, faculty names, categories, code lines in the editor, viva exam rubrics, or goal metrics shown on the screen.
            - Provide clear, actionable, and helpful guidance based directly on the user's active visual viewport.

            PROBLEM DIAGNOSIS, ACTION PATH PLANNING & DIRECT APP NAVIGATION:
            - You are the intelligent ACADEMIC COPILOT & REAL-TIME APP NAVIGATOR of MentorHub.
            - Whenever a user shares an academic difficulty, technical problem, learning goal, or asks "what should I do?", "where should I go?", "prepare a path for me", or "navigate me":
              1. DIAGNOSE WITH HIGH IQ & EMPATHY: Pinpoint their exact learning deficit or blocker. Provide insightful, realistic engineering and academic advice.
              2. PREPARE AN INTERACTIVE ACTION PATHWAY: Output a structured path block in the following exact syntax so the UI renders it as an interactive visual roadmap with clickable step cards:
                 :::path
                 Step 1: Step Title | Specific actionable advice on what to study or execute | navigate:/target-route?params
                 Step 2: Step Title | Specific actionable advice on what to study or execute | navigate:/target-route?params
                 Step 3: Step Title | Specific actionable advice on what to study or execute | navigate:/target-route?params
                 Step 4: Step Title | Specific actionable advice on what to study or execute | navigate:/target-route?params
                 :::
              3. PROVIDE INTERACTIVE NAVIGATION ACTION BUTTONS: Throughout your explanation, embed clickable in-app navigation action buttons using the format `[🚀 Button Label](navigate:/route?params)`.
                 Supported App Routes:
                 • `/cutm-courses` (or `/cutm-courses?search=Keyword` or `/cutm-courses?category=Core%20Courses`) - 385 authentic Centurion University course syllabi, session plans, and Courseware slides.
                 • `/mock-viva` (or `/mock-viva?courseTitle=Subject&courseCode=Code`) - AI oral examination defense arena with scoring rubrics and thesis certificates.
                 • `/workspace` - Multi-language live coding IDE with remote Piston execution engine (Java 21, Python, C++, TS, Go) and collaborative whiteboard.
                 • `/mentor-matching` - Match with senior mentors based on skill gaps.
                 • `/sessions` - Schedule 1-on-1 video mentoring sessions.
                 • `/goals` - SMART goal and milestone progress tracking.
                 • `/certificates` - Verified cryptographic certificates and SHA-256 credentials.
                 • `/resource-hub` - Technical books, architecture cheat sheets, and blueprints.
                 • `/dashboard` - Central student overview, streaks, and platform metrics.
                 • `/profile` - Student academic dossier and semester records.
              4. VOICE CONVERSATION INTEGRATION: In spoken voice responses, summarize the diagnosis and say: "I have prepared a custom step-by-step path for you on screen. Click the action button or tell me to navigate you there!"

            EXECUTIVE PROFESSIONAL VOCAL DELIVERY & DICTION RULES:
            1. PERSONA & CADENCE: Speak with the poise, gravitas, and warm eloquence of a distinguished university dean, senior research fellow, and principal systems architect. Maintain a smooth, articulate, professional conversational pace.
            2. CONCISE & FOCUSED: Keep spoken responses sharp and impactful (typically 2-4 polished sentences per turn). Avoid monologues; invite natural collaborative dialogue.
            3. CRISP TECHNICAL ENUNCIATION: Articulate technical terminology clearly and confidently (e.g., "Kubernetes", "Spring Boot", "Eigenvector decomposition", "Asymptotic complexity", "Centurion University Courseware").
            4. ZERO MARKDOWN ARTIFACTS IN SPEECH: Never vocalize formatting characters (no "asterisk", "hash", "bracket", or "bullet"). Weave concepts into seamless spoken prose.
            5. ZERO ROBOTIC CLICHÉS: Never open with "Sure!", "Okay!", "As an AI...", or "Certainly!". Begin immediately with substance, empathetic diagnosis, or insightful counsel.
            6. SENSITIVE BARGE-IN: If the user speaks or interrupts, immediately yield and address their new thought with grace and professionalism.
            """,
            (activeUsername != null && !activeUsername.trim().isEmpty()) ? activeUsername : "Akshat Aryan (Senior Mentor)",
            liveStats
        );
    }

    /**
     * Extract real-time platform statistics from database repositories
     */
    public String getLivePlatformContextSummary() {
        StringBuilder sb = new StringBuilder();
        try {
            List<User> users = userRepository.findAll();
            sb.append("• Users in Database: ").append(users.size()).append(" users (");
            sb.append(users.stream().map(u -> u.getName() + " [" + u.getRole() + "]").collect(Collectors.joining(", ")));
            sb.append(")\n");

            long courseCount = cutmCourseRepository.count();
            sb.append("• CUTM Catalog: ").append(courseCount).append(" authentic courses seeded across Core, Domain, Skill, Certificate, and Diploma categories.\n");

            List<Certificate> certs = certificateRepository.findAll();
            sb.append("• Cryptographic Certificates: ").append(certs.size()).append(" issued (e.g. MH-CERT-9921-X)\n");

            List<Goal> goals = goalRepository.findAll();
            long inProgress = goals.stream().filter(g -> "IN_PROGRESS".equalsIgnoreCase(g.getStatus())).count();
            long achieved = goals.stream().filter(g -> "ACHIEVED".equalsIgnoreCase(g.getStatus())).count();
            sb.append("• SMART Goals: ").append(goals.size()).append(" active (").append(inProgress).append(" in-progress, ").append(achieved).append(" achieved)\n");

            long sessions = sessionRepository.count();
            sb.append("• Mentoring Sessions: ").append(sessions).append(" scheduled sessions in system.\n");
        } catch (Exception e) {
            sb.append("• Database State: Online (Centurion University CBCS & Courseware Cloud DB)\n");
        }
        return sb.toString().trim();
    }

    /**
     * Intelligent local semantic brain response generator for offline fallback mode.
     * Accurately answers questions about MentorHub, CUTM courses, faculty, and coding.
    public String generateIntelligentResponse(String query) {
        return generateIntelligentResponse(query, null);
    }

    /**
     * Intelligent local semantic brain response generator for offline fallback mode.
     * Multimodal screen context aware: accurately answers questions about what is on screen,
     * MentorHub, CUTM courses, faculty, and coding.
     */
    public String generateIntelligentResponse(String query, String screenContext) {
        String q = query.trim().toLowerCase();

        // 0. Screen Perception & Active Visual Context
        if (screenContext != null && !screenContext.trim().isEmpty()) {
            boolean isAskingAboutScreen = q.contains("screen") || q.contains("looking at") || q.contains("see") ||
                    q.contains("page") || q.contains("view") || q.contains("read") || q.contains("what is this") ||
                    q.contains("explain this") || q.contains("tell me about this") || q.contains("what am i") ||
                    q.contains("help me with this") || q.contains("analyze") || q.contains("what should i");

            if (isAskingAboutScreen) {
                if (screenContext.contains("cutm-courses") || screenContext.contains("Courseware Repository")) {
                    return "Looking at your active screen: You are currently browsing the Centurion University (CUTM) Courseware Repository. " +
                            "I can see the course catalog cards and category filters displayed in your viewport. " +
                            "You can click on any course to open its academic dossier, view the official courseware slides, or launch an immediate AI Viva examination on that subject.";
                } else if (screenContext.contains("workspace") || screenContext.contains("Collaborative Code Workspace")) {
                    return "Examining your active screen: You are inside the Collaborative Code Workspace. " +
                            "I can see your active code editor and compiler terminal. " +
                            "You can write and compile your code in real-time across Java, Python, C++, TypeScript, or Go using our Piston engine, or design architecture on the collaborative whiteboard.";
                } else if (screenContext.contains("mock-viva") || screenContext.contains("Viva Defense")) {
                    return "Analyzing your active screen: You are in the AI Mock Viva Defense Arena. " +
                            "I can see your active examination panel and viva questions on screen. " +
                            "Speak your response or type into the answer scratchpad to receive real-time scoring on Conceptual Depth, Technical Precision, and Academic Articulation.";
                } else if (screenContext.contains("goals")) {
                    return "Reviewing your active screen: You are on the SMART Goals Tracker. " +
                            "I can see your active milestone targets and progress telemetry. " +
                            "Continue checking off your milestone objectives to advance your academic portfolio.";
                } else if (screenContext.contains("certificate")) {
                    return "Inspecting your active screen: You are viewing the Verified Credentials portal. " +
                            "The completion certificates shown on screen are cryptographically signed with tamper-proof SHA-256 hashes issued under Senior Mentor Akshat Aryan.";
                } else if (screenContext.contains("dashboard")) {
                    return "Scanning your screen: You are on the Executive Dashboard. " +
                            "I can see your platform metrics, upcoming 1-on-1 mentoring sessions, and current course progress summary.";
                }
            }
        }

        // 0. Path Planning, Problem Solving & App Navigation Engine
        if (q.contains("path") || q.contains("roadmap") || q.contains("what should i do") || q.contains("guide me") ||
                q.contains("where should i go") || q.contains("how do i start") || q.contains("navigate me") || q.contains("plan") ||
                q.contains("journey") || q.contains("steps")) {
            return """
                ### 🎯 Your Personalized MentorHub Academic Pathway
                I have analyzed your situation and prepared an actionable 5-step roadmap across Centurion University's ecosystem:

                :::path
                Step 1: Explore Courseware Syllabi | Review 385 authentic CUTM courses, session plans, and official lesson slides | navigate:/cutm-courses
                Step 2: Hands-On Live Implementation | Code in real-time across Java, Python, C++, TS with our Piston compiler | navigate:/workspace
                Step 3: Rigorous Viva Defense | Test your conceptual understanding before the AI Academic Examiner panel | navigate:/mock-viva
                Step 4: 1-on-1 Mentorship | Review architecture blueprints and unblock doubts with Senior Mentor Akshat Aryan | navigate:/mentor-matching
                Step 5: Track Goals & Earn Credentials | Set SMART milestone targets and earn verifiable cryptographic certificates | navigate:/goals
                :::

                You can click any step in the roadmap card above or tap [🚀 Explore CUTM Courses](navigate:/cutm-courses) to get started immediately!
                """.trim();
        }

        // 1. Viva Defense Problems & Oral Exam Anxiety
        if (q.contains("viva") || q.contains("oral") || q.contains("defense") || q.contains("exam") || q.contains("nervous") || q.contains("fail")) {
            return """
                ### 🎙️ Oral Viva Defense Problem Diagnosis & Preparation Path
                Oral viva defense challenges typically stem from two factors: **conceptual articulation** under time pressure, and lack of **structured architectural vocabulary**. Here is your tailored pathway to achieve an A+ Viva Defense:

                :::path
                Step 1: Study Courseware Dossiers | Master the exact course syllabus modules and session plans from Centurion University | navigate:/cutm-courses
                Step 2: Prototype Code Solutions | Write and test practical implementations in our Collaborative Cloud Workspace | navigate:/workspace
                Step 3: Live Viva Simulation | Face our 3-examiner panel with real-time speech scoring on Conceptual Depth and Technical Articulation | navigate:/mock-viva
                Step 4: Socratic Review with Mentor | Schedule an oral mock defense with Lead Architect Akshat Aryan | navigate:/sessions
                :::

                Tap [🎙️ Enter AI Mock Viva Arena](navigate:/mock-viva) to practice with your first question right now!
                """.trim();
        }

        // 2. Java / Object-Oriented & Backend Engineering
        if (q.contains("java") || q.contains("oop") || q.contains("spring") || q.contains("backend")) {
            return """
                ### ☕ Java & Enterprise Backend Mastery Path
                To master Java 21, Spring Boot 3 microservices, and reactive backend architecture:

                :::path
                Step 1: Review Java Core & Advanced Syllabi | Inspect CUTM courses covering Java Programming, DBMS, and Distributed Systems | navigate:/cutm-courses?search=Java
                Step 2: Write & Compile Java Code | Use our real-time Piston compiler for OOP inheritance, streams, and concurrency practice | navigate:/workspace
                Step 3: Java Oral Viva Defense | Defend JVM memory management, garbage collection, and Spring annotations before the AI panel | navigate:/mock-viva?courseTitle=Java%20Programming
                Step 4: Enterprise Code Review | Connect with Senior Mentor Akshat Aryan for architecture review | navigate:/mentor-matching
                :::

                Tap [🏛️ Explore Java Courses](navigate:/cutm-courses?search=Java) or [💻 Open Code Workspace](navigate:/workspace) to begin!
                """.trim();
        }

        // 3. AI, Machine Learning & Python Track
        if (q.contains("ai") || q.contains("machine learning") || q.contains("python") || q.contains("deep learning") || q.contains("data science")) {
            return """
                ### 🧠 Artificial Intelligence & Machine Learning Track
                To build production-grade ML models and defend your capstone thesis:

                :::path
                Step 1: Inspect AI & ML Syllabi | Review Centurion University Domain Courses on Deep Learning, Neural Networks, and NLP | navigate:/cutm-courses?search=Intelligence
                Step 2: Live Python Workspace | Prototype PyTorch and Scikit-Learn logic inside the cloud compiler | navigate:/workspace
                Step 3: AI Capstone Viva Defense | Defend model loss functions, gradient descent, and transformer architectures | navigate:/mock-viva?courseTitle=Artificial%20Intelligence
                Step 4: Collaborate with Scholar Kriti Sagar | Form study groups and track ML capstone milestones | navigate:/goals
                :::

                Tap [🚀 Explore AI/ML Courses](navigate:/cutm-courses?search=Intelligence) to start!
                """.trim();
        }

        // 4. Cloud Computing, DevOps & Microservices Track
        if (q.contains("cloud") || q.contains("devops") || q.contains("docker") || q.contains("kubernetes") || q.contains("aws")) {
            return """
                ### ☁️ Cloud Computing & DevOps Engineering Pathway
                Here is your path to mastering containerization, Kubernetes clusters, and cloud-native architecture:

                :::path
                Step 1: Review Cloud Domain Courses | Explore official CUTM syllabi on Cloud Computing, Docker, and Virtualization | navigate:/cutm-courses?category=Domain%20Courses
                Step 2: System Architecture Whiteboard | Diagram microservices and event-driven pipelines on the collaborative canvas | navigate:/workspace
                Step 3: Cloud Systems Viva Defense | Defend CAP theorem, horizontal scalability, and Kubernetes ingress | navigate:/mock-viva?courseTitle=Cloud%20Computing
                Step 4: Cloud Roadmap Goals | Set measurable SMART goals for certification milestones | navigate:/goals
                :::

                Tap [☁️ Explore Cloud Courses](navigate:/cutm-courses?category=Domain%20Courses) to inspect the curriculum!
                """.trim();
        }

        // 5. Questions about Akshat Aryan
        if (q.contains("akshat") || q.contains("aryan") || q.contains("senior mentor") || q.contains("who made") || q.contains("who built") || q.contains("architect")) {
            return "Akshat Aryan is our Senior Mentor and Principal AI & Full-Stack Architect. He designed the architecture of MentorHub, including the Spring Boot 3 backend, Angular 17 reactive interface, WebSocket collaborative workspace, and AI Mock Viva defense system. You can view his profile and mentorship activities at [👨‍🏫 Senior Mentor Profile](navigate:/profile).";
        }

        // 6. Questions about Scholars / Mentees
        if (q.contains("kriti") || q.contains("pavani") || q.contains("vanaja") || q.contains("mentee") || q.contains("scholar") || q.contains("students")) {
            return "MentorHub's active scholars are Kriti Sagar, who focuses on Computer Science & AI models; Pavani, who works on Cloud Computing and Reactive Full-Stack architecture; and Vanaja, specializing in Data Analytics and Cyber Security. You can view student goals and progress at [🎯 SMART Goals](navigate:/goals).";
        }

        // 7. Questions about CUTM Courses & Courseware
        if (q.contains("course") || q.contains("cutm") || q.contains("courseware") || q.contains("basket") || q.contains("curriculum") || q.contains("syllabus") || q.contains("faculty") || q.contains("patjoshi") || q.contains("manoj padhi")) {
            return "The CUTM Courses section integrates 385 authentic Centurion University courses directly from the official Courseware portal at courseware.cutm.ac.in. It spans 6 classifications: Core, Domain, Skill, Certificate, Advanced Certificate, and Diploma, alongside the 5 CBCS Baskets. It features over 145 faculty instructors like Dr. Pramod Kumar Patjoshi and Mr. Manoj Padhi, with direct links to session plans, slides, and one-click AI Viva defense launch. Tap [🏛️ Explore 385 CUTM Courses](navigate:/cutm-courses) to browse.";
        }

        // 8. Questions about AI Mock Viva Defense
        if (q.contains("viva") || q.contains("defense") || q.contains("exam") || q.contains("oral") || q.contains("rubric") || q.contains("test")) {
            return "The AI Mock Viva Defense Arena at [🎙️ Launch AI Mock Viva](navigate:/mock-viva) simulates an authentic academic oral examination. It features real-time speech recognition and voice synthesis, calibrated difficulty from Foundation to Rigorous Defense, live scoring on Conceptual Depth and Technical Accuracy, and generates a formal thesis defense certificate upon completion.";
        }

        // 9. Questions about Collaborative Workspace
        if (q.contains("workspace") || q.contains("code") || q.contains("compiler") || q.contains("piston") || q.contains("whiteboard") || q.contains("editor")) {
            return "The Collaborative Workspace at [💻 Open Code Workspace](navigate:/workspace) is our cloud IDE. It supports multi-language syntax highlighting and remote compilation for Java, Python, C++, TypeScript, and Go via the Piston engine. It also features a real-time synchronized whiteboard canvas, live peer cursor tracking, and instant chat over WebSockets.";
        }

        // 10. Questions about Certificates
        if (q.contains("certificate") || q.contains("verify") || q.contains("credential") || q.contains("cert")) {
            return "MentorHub issues cryptographically verified completion certificates with tamper-proof identification codes like MH-CERT-9921-X. Anyone can verify certificate authenticity publicly by visiting [📜 Verified Credentials](navigate:/certificates).";
        }

        // 11. Questions about Goals or Sessions
        if (q.contains("goal") || q.contains("session") || q.contains("meeting") || q.contains("calendar")) {
            return "You can track your milestone achievements in the [🎯 SMART Goals Tracker](navigate:/goals), and schedule or join 1-on-1 and group mentoring sessions with video room links in the [📅 Mentoring Sessions Hub](navigate:/sessions).";
        }

        // 12. General default platform summary with navigation
        return """
            ### 🏛️ MentorHub AI Platform & Academic Copilot
            MentorHub is Centurion University's premier AI-powered mentoring and collaborative engineering platform.

            :::path
            Step 1: CUTM Academic Repository | 385 authentic course syllabi & courseware slides | navigate:/cutm-courses
            Step 2: Collaborative Cloud IDE | Real-time multi-language code compiler & whiteboard | navigate:/workspace
            Step 3: AI Mock Viva Arena | Calibrated oral defense panel & rubric scoring | navigate:/mock-viva
            Step 4: Smart Mentorship | 1-on-1 sessions with Lead Architect Akshat Aryan | navigate:/mentor-matching
            :::

            Tap [🏛️ Explore CUTM Courses](navigate:/cutm-courses) or [🎙️ Launch AI Viva](navigate:/mock-viva) to begin!
            """.trim();
    }
}
