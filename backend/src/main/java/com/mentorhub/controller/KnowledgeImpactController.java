package com.mentorhub.controller;

import com.mentorhub.model.KnowledgeImpact;
import com.mentorhub.model.KnowledgeImpact.KnowledgeChainNode;
import com.mentorhub.model.User;
import com.mentorhub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/knowledge-impact", "/api/v1/knowledge-impact"})
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class KnowledgeImpactController {

    private final UserRepository userRepository;

    public KnowledgeImpactController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/all")
    public ResponseEntity<List<KnowledgeImpact>> getAllKnowledgeImpacts() {
        List<KnowledgeImpact> impacts = new ArrayList<>();
        impacts.add(buildPavaniImpact());
        impacts.add(buildAkshatImpact());
        impacts.add(buildKritiImpact());
        impacts.add(buildVanajaImpact());
        return ResponseEntity.ok(impacts);
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<KnowledgeImpact> getMentorImpact(@PathVariable Long mentorId) {
        Optional<User> userOpt = userRepository.findById(mentorId);
        if (userOpt.isPresent()) {
            String name = userOpt.get().getName().toUpperCase();
            if (name.contains("PAVANI")) {
                return ResponseEntity.ok(buildPavaniImpact());
            } else if (name.contains("AKSHAT")) {
                return ResponseEntity.ok(buildAkshatImpact());
            } else if (name.contains("KRITI")) {
                return ResponseEntity.ok(buildKritiImpact());
            } else if (name.contains("VANAJA")) {
                return ResponseEntity.ok(buildVanajaImpact());
            }
        }
        // Default to Pavani's knowledge impact
        return ResponseEntity.ok(buildPavaniImpact());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<KnowledgeImpact> getUserImpact(@PathVariable Long userId) {
        return getMentorImpact(userId);
    }

    private KnowledgeImpact buildPavaniImpact() {
        List<KnowledgeChainNode> nodes = new ArrayList<>();
        nodes.add(new KnowledgeChainNode(
                "Pavani",
                "MASTER_MENTOR",
                "assets/pavani-profile.jpg",
                "Directly taught Reactive Frontend & Canvas Graphics",
                "Angular 17 & Canvas Architecture",
                1
        ));
        nodes.add(new KnowledgeChainNode(
                "Rahul",
                "PEER_MENTOR",
                "assets/avatar-1.png",
                "Built Interactive Canvas App, then mentored Sneha",
                "State Management & RxJS",
                2
        ));
        nodes.add(new KnowledgeChainNode(
                "Sneha",
                "STUDENT_MENTOR",
                "assets/avatar-2.png",
                "Mastered RxJS Streams, then guided Arun on Project",
                "Full Stack Web Development",
                3
        ));
        nodes.add(new KnowledgeChainNode(
                "Arun",
                "STUDENT",
                "assets/avatar-3.png",
                "Completed First Milestone & Passed Tech Assessment",
                "Frontend Basics & UI Design",
                4
        ));

        List<String> stories = Arrays.asList(
                "Pavani directly teaches Rahul. Later, Rahul uses that knowledge to help Sneha, and Sneha helps Arun.",
                "12 of 15 students achieved career milestones within 60 days.",
                "Knowledge ripple spread across 3 peer mentoring levels."
        );

        return new KnowledgeImpact(
                3L,
                "Pavani",
                "assets/pavani-profile.jpg",
                4.8,
                15,
                32,
                12,
                91,
                4,
                "Your knowledge has reached 4 learners.",
                nodes,
                stories
        );
    }

    private KnowledgeImpact buildAkshatImpact() {
        List<KnowledgeChainNode> nodes = new ArrayList<>();
        nodes.add(new KnowledgeChainNode(
                "Akshat Aryan",
                "MASTER_MENTOR",
                "assets/akshat-profile.jpg",
                "Conducted System Design & Spring Boot 3 Deep Dives",
                "Distributed Systems & WebSockets",
                1
        ));
        nodes.add(new KnowledgeChainNode(
                "Kriti Sagar",
                "PEER_MENTOR",
                "assets/kriti-profile.jpg",
                "Implemented Microservices Ingress, coached Divya",
                "Spring Boot 3 Security & JWT",
                2
        ));
        nodes.add(new KnowledgeChainNode(
                "Divya",
                "STUDENT_MENTOR",
                "assets/avatar-4.png",
                "Architected REST API, assisted Vikram on Docker",
                "RESTful APIs & Containers",
                3
        ));
        nodes.add(new KnowledgeChainNode(
                "Vikram",
                "STUDENT_MENTOR",
                "assets/avatar-5.png",
                "Deployed Cluster, onboarded Ananya",
                "DevOps & Microservices",
                4
        ));
        nodes.add(new KnowledgeChainNode(
                "Ananya",
                "STUDENT",
                "assets/avatar-6.png",
                "Passed Junior Backend Engineer Assessment",
                "Java 21 Fundamentals",
                5
        ));

        List<String> stories = Arrays.asList(
                "Akshat taught Kriti. Kriti helped Divya, Divya helped Vikram, and Vikram onboarded Ananya.",
                "21 students successfully completed backend microservices certifications.",
                "Enterprise system design knowledge reached 5 direct and downstream learners."
        );

        return new KnowledgeImpact(
                1L,
                "Akshat Aryan",
                "assets/akshat-profile.jpg",
                4.95,
                24,
                48,
                21,
                98,
                5,
                "Your knowledge has reached 5 learners.",
                nodes,
                stories
        );
    }

    private KnowledgeImpact buildKritiImpact() {
        List<KnowledgeChainNode> nodes = new ArrayList<>();
        nodes.add(new KnowledgeChainNode(
                "Kriti Sagar",
                "MASTER_MENTOR",
                "assets/kriti-profile.jpg",
                "Mentored on Vector Embeddings and RAG Architecture",
                "AI/ML Infrastructure",
                1
        ));
        nodes.add(new KnowledgeChainNode(
                "Sneha",
                "PEER_MENTOR",
                "assets/avatar-2.png",
                "Built Semantic Search, guided Rohan on Vector DB",
                "Vector Databases & Cosine Math",
                2
        ));
        nodes.add(new KnowledgeChainNode(
                "Rohan",
                "STUDENT_MENTOR",
                "assets/avatar-7.png",
                "Fine-tuned Prompt Pipelines, coached Meera",
                "Prompt Engineering",
                3
        ));
        nodes.add(new KnowledgeChainNode(
                "Meera",
                "STUDENT",
                "assets/avatar-8.png",
                "Delivered AI Support Assistant Prototype",
                "LLM Basics & Inference",
                4
        ));

        List<String> stories = Arrays.asList(
                "Kriti mentored Sneha on RAG systems, Sneha guided Rohan, and Rohan helped Meera build her first AI agent.",
                "15 of 18 students built production-ready AI demo applications."
        );

        return new KnowledgeImpact(
                2L,
                "Kriti Sagar",
                "assets/kriti-profile.jpg",
                4.9,
                18,
                36,
                15,
                94,
                4,
                "Your knowledge has reached 4 learners.",
                nodes,
                stories
        );
    }

    private KnowledgeImpact buildVanajaImpact() {
        List<KnowledgeChainNode> nodes = new ArrayList<>();
        nodes.add(new KnowledgeChainNode(
                "Vanaja",
                "MASTER_MENTOR",
                "assets/vanaja-profile.jpg",
                "Guided on Container Orchestration and Cloud CI/CD",
                "Kubernetes & Cloud Infrastructure",
                1
        ));
        nodes.add(new KnowledgeChainNode(
                "Arjun",
                "PEER_MENTOR",
                "assets/avatar-9.png",
                "Built GitOps pipeline, coached Priya on Helm",
                "GitOps & Docker Swarm",
                2
        ));
        nodes.add(new KnowledgeChainNode(
                "Priya",
                "STUDENT_MENTOR",
                "assets/avatar-10.png",
                "Configured Ingress Controller, helped Karthik",
                "Cloud Networking",
                3
        ));
        nodes.add(new KnowledgeChainNode(
                "Karthik",
                "STUDENT",
                "assets/avatar-11.png",
                "Automated Multi-Stage Docker Builds",
                "Docker Essentials",
                4
        ));

        List<String> stories = Arrays.asList(
                "Vanaja guided Arjun on Kubernetes, Arjun coached Priya, and Priya helped Karthik deploy automated Docker pipelines.",
                "11 students earned Cloud & DevOps certifications."
        );

        return new KnowledgeImpact(
                4L,
                "Vanaja",
                "assets/vanaja-profile.jpg",
                4.85,
                14,
                28,
                11,
                89,
                4,
                "Your knowledge has reached 4 learners.",
                nodes,
                stories
        );
    }
}
