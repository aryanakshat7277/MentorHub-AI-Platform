package com.mentorhub;

import com.mentorhub.model.User;
import com.mentorhub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class MentorHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(MentorHubApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Guarantee Mentor Account: AKSHAT ARYAN (mentor@mentorhub.com / password123)
            userRepository.findByEmail("mentor@mentorhub.com").ifPresentOrElse(
                u -> {
                    u.setPassword(passwordEncoder.encode("password123"));
                    u.setName("AKSHAT ARYAN");
                    u.setRole("MENTOR");
                    userRepository.save(u);
                },
                () -> {
                    User mentor = User.builder()
                            .name("AKSHAT ARYAN")
                            .email("mentor@mentorhub.com")
                            .password(passwordEncoder.encode("password123"))
                            .role("MENTOR")
                            .title("Principal AI & Full Stack Mentor")
                            .company("MentorHub Labs")
                            .bio("Leading AI peer collaboration, full-stack microservices, & software architecture.")
                            .skills("Spring Boot 3, Angular 17, Java 21, WebSockets, Python, C++")
                            .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80")
                            .xpPoints(3450)
                            .currentStreak(24)
                            .rating(5.0)
                            .hoursMentored(120)
                            .totalSessions(85)
                            .badgesCount(18)
                            .build();
                    userRepository.save(mentor);
                }
            );

            // Guarantee Mentee Account 1: KRITI SAGAR (kriti@mentorhub.com / password123)
            userRepository.findByEmail("kriti@mentorhub.com").ifPresentOrElse(
                u -> {
                    u.setPassword(passwordEncoder.encode("password123"));
                    u.setName("KRITI SAGAR");
                    u.setRole("MENTEE");
                    userRepository.save(u);
                },
                () -> {
                    User mentee1 = User.builder()
                            .name("KRITI SAGAR")
                            .email("kriti@mentorhub.com")
                            .password(passwordEncoder.encode("password123"))
                            .role("MENTEE")
                            .title("Full Stack Engineering Scholar")
                            .company("MentorHub Academy")
                            .bio("Specializing in Spring Boot 3, Angular 17, & AI Systems.")
                            .skills("Java, JavaScript, Python, Angular 17")
                            .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80")
                            .xpPoints(2450)
                            .currentStreak(14)
                            .rating(4.9)
                            .hoursMentored(48)
                            .totalSessions(32)
                            .badgesCount(12)
                            .build();
                    userRepository.save(mentee1);
                }
            );

            // Guarantee Mentee Account 2: VANAJA (vanaja@mentorhub.com / password123)
            userRepository.findByEmail("vanaja@mentorhub.com").ifPresentOrElse(
                u -> {
                    u.setPassword(passwordEncoder.encode("password123"));
                    u.setName("VANAJA");
                    u.setRole("MENTEE");
                    userRepository.save(u);
                },
                () -> {
                    User mentee2 = User.builder()
                            .name("VANAJA")
                            .email("vanaja@mentorhub.com")
                            .password(passwordEncoder.encode("password123"))
                            .role("MENTEE")
                            .title("AI Systems & Data Scholar")
                            .company("MentorHub Academy")
                            .bio("Focusing on Machine Learning Data Pipelines & Web Architectures.")
                            .skills("Python, C++, SQL, PyTorch")
                            .avatarUrl("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80")
                            .xpPoints(2100)
                            .currentStreak(11)
                            .rating(4.85)
                            .hoursMentored(36)
                            .totalSessions(24)
                            .badgesCount(10)
                            .build();
                    userRepository.save(mentee2);
                }
            );

            // Guarantee Mentee Account 3: PAVANI (pavani@mentorhub.com / password123)
            userRepository.findByEmail("pavani@mentorhub.com").ifPresentOrElse(
                u -> {
                    u.setPassword(passwordEncoder.encode("password123"));
                    u.setName("PAVANI");
                    u.setRole("MENTEE");
                    userRepository.save(u);
                },
                () -> {
                    User mentee3 = User.builder()
                            .name("PAVANI")
                            .email("pavani@mentorhub.com")
                            .password(passwordEncoder.encode("password123"))
                            .role("MENTEE")
                            .title("Cloud & Distributed Systems Scholar")
                            .company("MentorHub Academy")
                            .bio("Exploring Real-time WebSockets & Microservices Architecture.")
                            .skills("TypeScript, Java 21, Docker, Kubernetes")
                            .avatarUrl("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80")
                            .xpPoints(1950)
                            .currentStreak(9)
                            .rating(4.8)
                            .hoursMentored(30)
                            .totalSessions(20)
                            .badgesCount(9)
                            .build();
                    userRepository.save(mentee3);
                }
            );
        };
    }
}
