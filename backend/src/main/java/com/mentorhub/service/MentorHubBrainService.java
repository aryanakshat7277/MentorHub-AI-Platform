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
        String user = (activeUsername != null && !activeUsername.trim().isEmpty()) ? activeUsername : "Akshat Aryan (Senior Mentor)";

        String template = """
            You are MentorHub AI, the official, highly intelligent AI Voice Assistant and Academic Copilot for the MentorHub AI Platform (Centurion University of Technology and Management - C.U.T.M.).
            
            CORE IDENTITY & REASONING BRAIN:
            - You have a COMPLETE idea, mental model, and data awareness of the entire MentorHub application.
            - You are deeply knowledgeable about every feature, route, user role, C.U.T.M. curriculum course, faculty instructor, collaborative coding tool, and viva defense mechanism.
            - When answering, USE YOUR PROPER BRAIN: think logically, reason clearly, cite specific platform details, explain exact steps to the user, and deliver articulate, warm, and highly authoritative voice responses.
            - When asked general questions (computer science, algorithms, software engineering, mathematics, physics, history, general life advice), use your vast foundational intelligence to give accurate, deep, and practical answers.
            
            ACTIVE USER CONTEXT:
            - Current Speaking User: {{ACTIVE_USER}}
            
            LIVE PLATFORM TELEMETRY & DATABASE STATE:
            {{LIVE_STATS}}
            
            KEY PEOPLE & ROLES IN MENTORHUB:
            1. AKSHAT ARYAN: Senior Mentor, Principal AI & Full-Stack Architect, Lead Systems Engineer. Profile at /profile. Oversees code reviews, conducts Socratic viva examinations, guides mentees in enterprise distributed systems, and architected MentorHub.
            2. KRITI SAGAR: Scholar / Mentee in Computer Science & AI Track. Focuses on machine learning models, PyTorch deep neural networks, and capstone thesis defense.
            3. PAVANI: Scholar / Mentee in Cloud Computing & Full-Stack Reactive Architecture. Focuses on Angular 17 signals, Spring Boot microservices, and collaborative ideation.
            4. VANAJA: Scholar / Mentee in Data Analytics & Cyber Security track. Mastering cryptography, Apache Kafka event streaming, and academic coursework.
            5. SYSTEM ADMIN: Platform administrator overseeing database health, role-based access, and server telemetry.
            
            COMPLETE APPLICATION MAP & FEATURE DIRECTORY:
            1. DASHBOARD (/dashboard):
               - Central command hub showing active course mastery, upcoming 1-on-1 mentoring sessions, SMART goals progress, verified certificates, and live telemetry.
            2. C.U.T.M. COURSES & ACADEMIC REPOSITORY (/cutm-courses):
               - 385+ authentic Centurion University courses directly integrated with the official C.U.T.M. Courseware portal (https://courseware.cutm.ac.in/courses).
               - 6 Official Courseware Classifications: Core, Domain, Skill, Certificate, Advanced Certificate, Diploma.
               - 5 Official CBCS Baskets: Basket I (AECC), Basket II (PCC), Basket III (PEC), Basket IV (OE), Basket V (SEC).
               - 185+ Centurion University Faculty Professors with verified profiles, course mappings, and department affiliations.
               - Features: One-click copy course code with authentic C.U.T.M. seal, '🌐 Courseware ↗' direct deep-link to official session plans/slides/videos, and comprehensive module syllabus.

            {{CUTM_COMPENDIUM}}
            3. COLLABORATIVE WORKSPACE (/workspace):
               - Multi-user live coding environment powered by WebSockets (/ws-workspace).
               - Multi-language syntax highlighting and remote compilation via Piston engine (Java, Python, C++, TypeScript, Go).
               - Collaborative whiteboard canvas for architecture diagrams and system design.
               - Live peer cursor broadcast and real-time session chat.
            4. SMART MENTOR MATCHING (/mentor-matching):
               - AI-powered matchmaking algorithm pairing mentees with mentors based on skill gap analysis, domain specializations, and schedule availability.
            5. MENTORING SESSIONS HUB (/sessions):
               - Calendar management for 1-on-1 and group mentoring, integrated video meeting rooms, and structured session notes.
            6. SMART GOAL TRACKER (/goals):
               - Specific, Measurable, Achievable, Relevant, and Time-Bound goal setting with progress bar telemetry and milestone checklists.
            7. VERIFIED CERTIFICATES (/certificates & /verify-certificate/:code):
               - Cryptographically signed completion credentials (e.g., MH-CERT-9921-X).
               - Public verification portal validating student identity, mentor signature, issuance timestamp, and authenticity seal.
            8. AI RESOURCE HUB (/resources):
               - Curated technical books, research publications, architecture blueprints, and developer cheat sheets.
            9. PROFILE & SETTINGS (/profile):
                - Academic details, semester, bio, profile photo, and password security.
            10. ADMIN CONTROL PANEL (/admin):
                - System health monitoring, cloud database telemetry, user audit logs, and course moderation.
            
            ENGINEERING ARCHITECTURE:
            - Backend: Spring Boot 3, Java 21, Spring Security 6 (Stateless JWT), Spring Data JPA, H2 file database (jdbc:h2:file:./data/mentoring_db), Piston execution engine.
            - Frontend: Angular 17 Standalone Components, Signals, RxJS, 3D Claymorphic Obsidian/Terracotta SCSS design, Times New Roman typography.
            - WebSockets: /ws-workspace (STOMP code/whiteboard broadcast), /ws-ai-live (Gemini Live bidirectional PCM audio stream).
            - Hosting: Backend on port 8080; Frontend deployed on GitHub Pages.
            
            MULTIMODAL SCREEN READING & VISION PERCEPTION:
            - You have live visual perception and semantic awareness of the user's active screen.
            - Whenever the user asks about what is displayed on their screen ("What am I looking at?", "Explain this course on my screen", "Help me fix the code on my screen", "What should I do next?"), examine the active screen image and [ACTIVE SCREEN CONTEXT] text carefully.
            - Directly cite specific visible elements: course titles, course codes, faculty names, categories, code lines in the editor, or goal metrics shown on the screen.
            - Provide clear, actionable, and helpful guidance based directly on the user's active visual viewport.

            ACADEMIC GUIDANCE & IN-CHAT MENTORING (NO IN-APP NAVIGATION):
            - You are purely a conversational academic mentor and tutor.
            - STRICT CONSTRAINT: You do NOT have browser or page navigation capability. NEVER attempt to navigate, redirect, route, or switch pages for the user.
            - NEVER output any navigation tags, such as [[NAVIGATE:...]] or navigate: links.
            - If a user asks you to "go to", "take me to", or "navigate to" a page, explain where it is located on the platform or provide the relevant academic information directly in the chat, reminding them that they can click the sidebar/menu to visit the page themselves.
            - Focus purely on delivering clear, high-yield academic answers, step-by-step technical problem solving, and conceptual clarity.

            EXECUTIVE PROFESSIONAL VOCAL DELIVERY & DICTION RULES:
            0. AUTOMATIC SPOKEN LANGUAGE DETECTION & STRICT MIRRORING (CRITICAL MANDATE):
               - AUTOMATICALLY DETECT the exact language, dialect, or multilingual blend the user is speaking in real time from their voice.
               - ALWAYS SPEAK IN THAT DETECTED LANGUAGE ONLY. NEVER default or revert to English if the user speaks in another language!
               - If the user speaks in Hindi (हिन्दी), you MUST respond fluently and naturally in Hindi.
               - If the user speaks in Odia (ଓଡ଼ିଆ), you MUST respond in fluent, natural Odia.
               - If the user speaks in Bengali (বাংলা), you MUST respond in fluent Bengali.
               - If the user speaks in Telugu, Tamil, Marathi, Kannada, Malayalam, Gujarati, Punjabi, or any international language (Spanish, French, German, Japanese, etc.), you MUST reply in that language only.
               - If the user speaks in conversational Hinglish or mixes languages, mirror their conversational blend naturally.
               - If the user switches languages mid-conversation (e.g. from English to Hindi or vice versa), dynamically detect the transition and immediately speak in the new language.
               - When technical engineering terms (e.g. "Spring Boot", "Algorithm", "Kubernetes", "Binary Tree", "Database", "C.U.T.M. Syllabus") are discussed in non-English conversations, articulate and pronounce the technical terms clearly and naturally within the sentences of the user's detected language.
            1. PERSONA & CADENCE: Speak with the poise, gravitas, and warm eloquence of a distinguished university dean, senior research fellow, and principal systems architect. Maintain a smooth, articulate, professional conversational pace.
            2. CONCISE & FOCUSED: Keep spoken responses sharp and impactful (typically 2-4 polished sentences per turn). Avoid monologues; invite natural collaborative dialogue.
            3. CRISP TECHNICAL ENUNCIATION: Articulate technical terminology clearly and confidently (e.g., "Kubernetes", "Spring Boot", "Eigenvector decomposition", "Asymptotic complexity", "Centurion University Courseware").
            4. ZERO MARKDOWN ARTIFACTS IN SPEECH: Never vocalize formatting characters (no "asterisk", "hash", "bracket", or "bullet"). Weave concepts into seamless spoken prose.
            5. ZERO ROBOTIC CLICHÉS: Never open with "Sure!", "Okay!", "As an AI...", or "Certainly!". Begin immediately with substance, empathetic diagnosis, or insightful counsel.
            6. CONTINUOUS SPEECH & DELIBERATE BARGE-IN: Finish your spoken thought naturally without cutting yourself off. Only yield if the user deliberately interrupts you with clear, distinct speech. Completely ignore ambient room noise, fan hum, keyboard clicks, breathing, or brief transient sounds.
            7. STRICT PRONUNCIATION MANDATE FOR C.U.T.M (CRITICAL):
               - NEVER pronounce or speak "CUTM" as a single phonetic word (NEVER say "cut-m", "koot-m", or "cutm").
               - In all spoken voice output, ALWAYS vocalize each letter distinctly as: "C. U. T. M." (or "C-U-T-M").
               - When referring to Centurion University of Technology and Management, say "Centurion University" or say the letters "C. U. T. M." with distinct pauses.
            8. AUTHORITATIVE C.U.T.M. COURSEWARE & FACULTY EXPERTISE AWARENESS (CRITICAL MANDATE):
               - You possess 100% complete and authoritative knowledge of the Centurion University Courseware portal, all 385 courses, and all 185+ faculty professors and their domains of expertise.
               - When asked about ANY faculty member (e.g. Mr. Manoj Padhi, Dr. Sujata Chakravarty, Dr. Pramod Kumar Patjoshi, Prof. Sangram Routray, Dr. Bhairaba Kumar Majhi, Dr. Padmaja Patnaik, Saban Kumar Maharana, Susmita Chakrabarty, Sudeep Kumar Singh, Ms. K.S.R.G. Sowgandhika, etc.), give an authentic, detailed, and accurate real answer: state their full title, their department/school, their specialization areas, and the exact courses they teach with course codes and courseware IDs.
               - When asked about ANY course code or title (e.g. CUTM1001, CUTM1010, CUTM1011, CUTM1012, CUTM1601, CUTM2101, CUDM343, etc.), state the course title, faculty instructor, CBCS Basket, credits, LTP format, courseware ID, official courseware link (https://courseware.cutm.ac.in/course/{id}), and key syllabus topics.
               - When asked about departments or schools (School of Engineering, School of Management, M.S. Swaminathan School of Agriculture, School of Paramedics, School of Applied Sciences, Centurion Center for Action Learning), list the leading faculty and signature courses offered.
               - Never say you don't know about C.U.T.M. faculty or courses. You possess the complete authentic directory.
            """;

        return template
                .replace("{{ACTIVE_USER}}", user)
                .replace("{{LIVE_STATS}}", liveStats != null ? liveStats : "")
                .replace("{{CUTM_COMPENDIUM}}", CutmCoursewareBrainCompendium.COMPREHENSIVE_COMPENDIUM);
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
            sb.append("• C.U.T.M. Catalog: ").append(courseCount).append(" authentic courses seeded across Core, Domain, Skill, Certificate, and Diploma categories.\n");

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

    public String getConciseBrainSystemPrompt(String username) {
        return """
            You are MentorHub AI Assistant, the intelligent mentor for Centurion University of Technology and Management (C.U.T.M.).
            University Nomenclature: Always pronounce C.U.T.M. as 'C. U. T. M.' or 'Centurion University'. Never pronounce it as a single word.
            Constituent Schools: School of Engineering & Technology (SoET), School of Management & Commerce (SoMC), M.S. Swaminathan School of Agriculture (MSSSoA), School of Paramedics & Allied Health Sciences (SoPAHS), School of Applied Sciences (SoAS), Centurion Center for Action Learning (CCAL).
            Key Faculty: Mr. Manoj Padhi (Enterprise Java 21, Advanced Java, Angular), Prof. Sangram Routray (Data Structures, Advanced Information Security, AI & Deep Learning), Dr. Sujata Chakravarty (Database Systems, Data Science), Dr. Bhairaba Kumar Majhi (Applied Mathematics & Statistics), Dr. Padmaja Patnaik (Quantum Physics), Dr. Pramod Kumar Patjoshi (Technology Entrepreneurship, Accounting), Saban Kumar Maharana (Action Learning & Skill Certification), Susmita Chakrabarty (Hematology & Biochemistry).
            Rules:
            1. Keep responses concise, direct, and limited to 2-3 short lines or bullet points when requested.
            2. When the user asks about what is on their screen, examine the provided screen context or screenshot carefully and explain exactly what is displayed.
            3. Answer in the same language the user uses.
            """.trim();
    }

    private boolean containsWord(String text, String word) {
        if (text == null || word == null) return false;
        return text.matches(".*\\b" + java.util.regex.Pattern.quote(word) + "\\b.*");
    }

    private String cleanScreenSummary(String screenContext) {
        if (screenContext == null) return "You are viewing your active MentorHub workspace.";
        String clean = screenContext.replaceAll("[\\r\\n]+", " ").trim();
        if (clean.length() > 200) {
            clean = clean.substring(0, 200) + "...";
        }
        return "You are currently viewing: " + clean + " You can interact with the elements on screen or ask me to assist with your active task.";
    }

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
        boolean isAskingAboutScreen = q.contains("screen") || q.contains("looking at") || q.contains("see") ||
                q.contains("page") || q.contains("view") || q.contains("read screen") || q.contains("what is this") ||
                q.contains("explain this") || q.contains("tell me about this") || q.contains("what am i") ||
                q.contains("help me with this") || q.contains("analyze") || q.contains("what should i");

        if (isAskingAboutScreen) {
            if (screenContext != null && !screenContext.trim().isEmpty()) {
                String sc = screenContext.toLowerCase();
                if (sc.contains("cutm-courses") || sc.contains("courseware")) {
                    return "Looking at your active screen: You are browsing the Centurion University (C.U.T.M.) Courseware Repository with course catalog cards and category filters. You can click any course card to inspect its syllabus modules and official courseware slides.";
                } else if (sc.contains("workspace") || sc.contains("collaborative")) {
                    return "Looking at your active screen: You are in the Collaborative Cloud IDE. The code editor and live compiler terminal are ready for Java, Python, C++, TypeScript, or Go practice.";
                } else if (sc.contains("goals")) {
                    return "Looking at your active screen: You are viewing the SMART Goals Tracker displaying your academic milestones and progress telemetry.";
                } else if (sc.contains("certificate")) {
                    return "Looking at your active screen: You are on the Verified Credentials portal viewing tamper-proof completion certificates signed with cryptographic SHA-256 hashes.";
                } else if (sc.contains("learning-path") || sc.contains("roadmap")) {
                    return "Looking at your active screen: You are on the Academic Learning Path module, visualizing personalized milestones and semester roadmaps.";
                } else if (sc.contains("sessions") || sc.contains("calendar")) {
                    return "Looking at your active screen: You are in the Mentoring Sessions Hub, showing upcoming 1-on-1 calls, calendar agendas, and peer review sessions.";
                } else if (sc.contains("dashboard")) {
                    return "Looking at your active screen: You are on the Executive Dashboard viewing platform metrics, upcoming 1-on-1 mentoring sessions, and current course progress summary.";
                } else {
                    return cleanScreenSummary(screenContext);
                }
            } else {
                return "Looking at your active screen in MentorHub AI: You have the AI Assistant interface open with quick action shortcuts (My Roadmap, Java & Backend, Read Screen, Code IDE, My Goals, CUTM Courses) and the prompt bar for continuous text and live voice interaction.";
            }
        }

        // A. Dynamic C.U.T.M. Courseware & Faculty Intelligence Lookup
        try {
            List<CutmCourse> allCourses = cutmCourseRepository.findAll();
            String facultyAnswer = CutmCoursewareBrainCompendium.answerFacultyInquiry(query, allCourses);
            if (facultyAnswer != null) {
                return facultyAnswer;
            }

            String courseAnswer = CutmCoursewareBrainCompendium.answerCourseInquiry(query, allCourses);
            if (courseAnswer != null) {
                return courseAnswer;
            }

            // Department / School Inquiries
            if (q.contains("agriculture") || q.contains("farming") || q.contains("swaminathan")) {
                return """
                    ### 🌾 M.S. Swaminathan School of Agriculture (MSSSoA) — C.U.T.M.
                    Centurion University's School of Agriculture is recognized for cutting-edge organic farming, smart agri-tech, and agri-economics:
                    • **Organic Farming & Vermicomposting:** Dr. Saurav Barman (CUDM505, CUSK663, CUCT889)
                    • **Agricultural Informatics & AI:** Dr. Polaki Suman (CUTM1126, CUBI2550 Biochemical Eng, CUBS2542 Bioinformatics)
                    • **Aquaculture & Animal Breeding:** Debashish Tripathy (CUTM722 Advanced Aquaculture, CUTM624 Animal Breeding)
                    • **Agri-Economics & Marketing:** Dr. Durga Prasad Padhi (CUTM180, CUTM481) and Kalee Prasanna Pattanayak (CUTM41)
                    • **Agricultural Microbiology:** Ms. Sudeepta Pattanayak (CUTM298, CUSK691 Mushroom Cultivation)
                    • **Nutraceuticals:** Preetha Bhadra (CUDM480, CUSK916)

                    Visit [🏛️ Explore Agriculture Courses](navigate:/cutm-courses) to view syllabus modules and session plans!
                    """.trim();
            }

            if (q.contains("paramedic") || q.contains("allied health") || q.contains("mri") || q.contains("hematology")) {
                return """
                    ### 🏥 School of Paramedics & Allied Health Sciences (SoPAHS) — C.U.T.M.
                    Centurion University's Paramedical programs focus on advanced hospital diagnostics and emergency care:
                    • **Hematology & Analytical Biochemistry:** Susmita Chakrabarty (CUTM312 Advanced Hematology, CUTM399 Analytical Biochemistry)
                    • **General Anatomy & Anaesthesia:** Ms. K.S.R.G. Sowgandhika (CUTM2603 General Anatomy, CUTM1120 Anaesthesia Techniques, CUTM1122 Ventilated Patients)
                    • **Radiology & Medical Imaging:** Rajesh Sukkala (CUTM700 Applied Equipment of Radio Diagnosis, CUTM213 Basic MRI)
                    • **Emergency & OT Technology:** Prof. Sunil Kumar Jha (CUSK696 Emergency Medical Technician, CUSK920 MLT, CUSK923 Operation Theatre)

                    Browse full paramedical courseware at [🏛️ Paramedical Courses](navigate:/cutm-courses)!
                    """.trim();
            }

            if (containsWord(q, "management") || containsWord(q, "commerce") || containsWord(q, "mba") || containsWord(q, "bba") || containsWord(q, "retail") || containsWord(q, "marketing")) {
                return """
                    ### 📈 School of Management & Commerce (SoMC) — C.U.T.M.
                    Centurion University offers industry-driven management, finance, and startup incubation:
                    • **Technology Entrepreneurship & Incubation:** Dr. Pramod Kumar Patjoshi (CUTM2101, CUCT212 Accounting for Managers)
                    • **Accounting & NLP:** Manoj Kumar Padhi (CUCT1003, CUSK913)
                    • **Marketing & Retail Domain:** Dr. Sabyasachi Dey (CUDM382 Retail & E-Tail, CUDM918 Rural Marketing, CUDM893 Sales & Distribution)
                    • **Business Feasibility & Current Assets:** Dr. Susanta Kumar Mishra (CUDM242, CUSK642 Business Plan)
                    • **Banking Law & Practice:** Prabodh Kumar Nanda (CUDM845, CUDM840 Entrepreneurship Development)

                    Explore full management courses at [🏛️ Management Courseware](navigate:/cutm-courses)!
                    """.trim();
            }
        } catch (Exception ignored) {}

        // 0. Path Planning, Problem Solving & App Navigation Engine
        if (q.contains("roadmap") || q.contains("what should i do") || q.contains("guide me") ||
                q.contains("where should i go") || q.contains("how do i start") || q.contains("navigate me") ||
                containsWord(q, "path") || containsWord(q, "plan") || containsWord(q, "steps") || containsWord(q, "journey")) {
            return """
                ### 🎯 Your Personalized MentorHub Academic Pathway
                I have analyzed your situation and prepared an actionable 5-step roadmap across Centurion University's ecosystem:

                :::path
                Step 1: Explore Courseware Syllabi | Review 385 authentic C.U.T.M. courses, session plans, and official lesson slides | navigate:/cutm-courses
                Step 2: Hands-On Live Implementation | Code in real-time across Java, Python, C++, TS with our Piston compiler | navigate:/workspace
                Step 3: 1-on-1 Mentorship | Review architecture blueprints and unblock doubts with Senior Mentor Akshat Aryan | navigate:/mentor-matching
                Step 4: Interactive Mentoring Sessions | Schedule structured calendar sessions and share project notes | navigate:/sessions
                Step 5: Track Goals & Earn Credentials | Set SMART milestone targets and earn verifiable cryptographic certificates | navigate:/goals
                :::

                You can click any step in the roadmap card above or tap [🚀 Explore C.U.T.M. Courses](navigate:/cutm-courses) to get started immediately!
                """.trim();
        }

        // 1. Academic & Syllabus Preparation
        if (q.contains("syllabus") || containsWord(q, "exam") || containsWord(q, "exams") || containsWord(q, "study") ||
                containsWord(q, "module") || containsWord(q, "modules") || containsWord(q, "lesson")) {
            return """
                ### 📚 Centurion University Academic Mastery Path
                To master your semester curriculum with authentic C.U.T.M. resources:

                :::path
                Step 1: Study Courseware Syllabus | Master the exact course syllabus modules and session plans from Centurion University | navigate:/cutm-courses
                Step 2: Prototype Code Solutions | Write and test practical implementations in our Collaborative Cloud Workspace | navigate:/workspace
                Step 3: Socratic Review with Mentor | Schedule an oral project defense with Lead Architect Akshat Aryan | navigate:/sessions
                :::

                Tap [🏛️ Explore C.U.T.M. Courseware](navigate:/cutm-courses) to inspect syllabus modules right now!
                """.trim();
        }

        // 2. Java / Object-Oriented & Backend Engineering
        if (containsWord(q, "java") || containsWord(q, "oop") || containsWord(q, "spring") || containsWord(q, "backend")) {
            return """
                ### ☕ Java & Enterprise Backend Mastery Path
                To master Java 21, Spring Boot 3 microservices, and reactive backend architecture:

                :::path
                Step 1: Review Java Core & Advanced Syllabi | Inspect C.U.T.M. courses CUTM1011 (Enterprise Java 21 by Mr. Manoj Padhi) and CUST1051 (Advanced Java) | navigate:/cutm-courses?search=Java
                Step 2: Write & Compile Java Code | Use our real-time Piston compiler for OOP inheritance, streams, and concurrency practice | navigate:/workspace
                Step 3: Enterprise Code Review | Connect with Senior Mentor Akshat Aryan for architecture review | navigate:/mentor-matching
                :::

                Tap [🏛️ Explore Java Courses](navigate:/cutm-courses?search=Java) or [💻 Open Code Workspace](navigate:/workspace) to begin!
                """.trim();
        }

        // 3. AI, Machine Learning & Python Track (FIXED: Uses containsWord to prevent matching 'explain', etc.)
        if (containsWord(q, "ai") || q.contains("artificial intelligence") ||
                q.contains("machine learning") || q.contains("deep learning") ||
                q.contains("data science") || containsWord(q, "ml") ||
                containsWord(q, "python")) {
            return """
                ### 🧠 Artificial Intelligence & Machine Learning Track
                To build production-grade ML models and advance in data science:

                :::path
                Step 1: Inspect AI & ML Syllabi | Review CUTM1602 (AI & Deep Learning by Prof. Sangram Routray) and CUDM626 (Data Science by Dr. Sujata Chakravarty) | navigate:/cutm-courses?search=Intelligence
                Step 2: Live Python Workspace | Prototype PyTorch and Scikit-Learn logic inside the cloud compiler | navigate:/workspace
                Step 3: Collaborate with Scholar Kriti Sagar | Form study groups and track ML capstone milestones | navigate:/goals
                :::

                Tap [🚀 Explore AI/ML Courses](navigate:/cutm-courses?search=Intelligence) to start!
                """.trim();
        }

        // 4. Cloud Computing, DevOps & Microservices Track
        if (containsWord(q, "cloud") || containsWord(q, "devops") || containsWord(q, "docker") ||
                containsWord(q, "kubernetes") || containsWord(q, "aws")) {
            return """
                ### ☁️ Cloud Computing & DevOps Engineering Pathway
                Here is your path to mastering containerization, Kubernetes clusters, and cloud-native architecture:

                :::path
                Step 1: Review Cloud Domain Courses | Explore CUTM1601 (Cloud Computing by Dr. Sangram Samal) and CUDM1127 (AWS Cloud Practitioner by M. Aswini Kumar) | navigate:/cutm-courses?category=Domain%20Courses
                Step 2: System Architecture Whiteboard | Diagram microservices and event-driven pipelines on the collaborative canvas | navigate:/workspace
                Step 3: Cloud Roadmap Goals | Set measurable SMART goals for certification milestones | navigate:/goals
                :::

                Tap [☁️ Explore Cloud Courses](navigate:/cutm-courses?category=Domain%20Courses) to inspect the curriculum!
                """.trim();
        }

        // 5. Questions about Akshat Aryan
        if (q.contains("akshat") || q.contains("aryan") || q.contains("senior mentor") || q.contains("who made") || q.contains("who built") || q.contains("architect")) {
            return "Akshat Aryan is our Senior Mentor and Principal AI & Full-Stack Architect. He designed the architecture of MentorHub, including the Spring Boot 3 backend, Angular 17 reactive interface, WebSocket collaborative workspace, and AI Courseware copilot. You can view his profile and mentorship activities at [👨‍🏫 Senior Mentor Profile](navigate:/profile).";
        }

        // 6. Questions about Scholars / Mentees
        if (q.contains("kriti") || q.contains("pavani") || q.contains("vanaja") || containsWord(q, "mentee") || containsWord(q, "scholar") || containsWord(q, "students")) {
            return "MentorHub's active scholars are Kriti Sagar, who focuses on Computer Science & AI models; Pavani, who works on Cloud Computing and Reactive Full-Stack architecture; and Vanaja, specializing in Data Analytics and Cyber Security. You can view student goals and progress at [🎯 SMART Goals](navigate:/goals).";
        }

        // 7. Questions about C.U.T.M. Courses & Courseware
        if (containsWord(q, "course") || containsWord(q, "courses") || q.contains("cutm") || q.contains("courseware") || containsWord(q, "basket") || q.contains("curriculum") || q.contains("syllabus") || containsWord(q, "faculty")) {
            return "The C.U.T.M. Courses section integrates 385 authentic Centurion University courses directly from the official Courseware portal at courseware.cutm.ac.in. It spans 6 classifications: Core, Domain, Skill, Certificate, Advanced Certificate, and Diploma, alongside the 5 CBCS Baskets. It features over 185 faculty instructors like Dr. Pramod Kumar Patjoshi, Mr. Manoj Padhi, Dr. Sujata Chakravarty, and Prof. Sangram Routray, with direct links to session plans, slides, and syllabus modules. Tap [🏛️ Explore 385 C.U.T.M. Courses](navigate:/cutm-courses) to browse.";
        }

        // 8. Questions about Collaborative Workspace
        if (containsWord(q, "workspace") || containsWord(q, "code") || containsWord(q, "compiler") || containsWord(q, "piston") || containsWord(q, "whiteboard") || containsWord(q, "editor")) {
            return "The Collaborative Workspace at [💻 Open Code Workspace](navigate:/workspace) is our cloud IDE. It supports multi-language syntax highlighting and remote compilation for Java, Python, C++, TypeScript, and Go via the Piston engine. It also features a real-time synchronized whiteboard canvas, live peer cursor tracking, and instant chat over WebSockets.";
        }

        // 9. Questions about Certificates
        if (containsWord(q, "certificate") || containsWord(q, "certificates") || containsWord(q, "verify") || containsWord(q, "credential") || containsWord(q, "cert")) {
            return "MentorHub issues cryptographically verified completion certificates with tamper-proof identification codes like MH-CERT-9921-X. Anyone can verify certificate authenticity publicly by visiting [📜 Verified Credentials](navigate:/certificates).";
        }

        // 10. Questions about Goals or Sessions
        if (containsWord(q, "goal") || containsWord(q, "goals") || containsWord(q, "session") || containsWord(q, "sessions") || containsWord(q, "meeting") || containsWord(q, "calendar")) {
            return "You can track your milestone achievements in the [🎯 SMART Goals Tracker](navigate:/goals), and schedule or join 1-on-1 and group mentoring sessions with video room links in the [📅 Mentoring Sessions Hub](navigate:/sessions).";
        }

        // 11. General default platform summary with navigation
        return """
            ### 🏛️ MentorHub AI Platform & Academic Copilot
            MentorHub is Centurion University's premier AI-powered mentoring and collaborative engineering platform.

            :::path
            Step 1: C.U.T.M. Academic Repository | 385 authentic course syllabi & courseware slides | navigate:/cutm-courses
            Step 2: Collaborative Cloud IDE | Real-time multi-language code compiler & whiteboard | navigate:/workspace
            Step 3: Smart Mentorship | 1-on-1 sessions with Lead Architect Akshat Aryan | navigate:/mentor-matching
            Step 4: Goal Telemetry | Track SMART milestones & verified completion credentials | navigate:/goals
            :::

            Tap [🏛️ Explore C.U.T.M. Courses](navigate:/cutm-courses) to begin!
            """.trim();
    }
}
