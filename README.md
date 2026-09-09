# 🚀 MentorHub Advanced AI Peer-Mentoring Platform

> **Enterprise-Grade AI-Powered Peer-Mentoring & Knowledge Acceleration Ecosystem**  
> Built with **Spring Boot 3 (Java 21)**, **Angular 17 Standalone Architecture**, **H2 Persistent Database**, **Spring Security 6 with JWT**, and **Times New Roman God-Level Academic & Corporate UX**.

---

## 🌐 Live Public Launch & 1-Click Cloud Launch

Experience MentorHub immediately in your browser or launch the full-stack environment with 1 click:

[![GitHub Pages Deployment](https://img.shields.io/badge/Live_Website-GitHub_Pages-2ea44f?style=for-the-badge&logo=github&logoColor=white)](https://aryanakshat7277.github.io/MentorHub-AI-Platform/)
[![Open in GitHub Codespaces](https://img.shields.io/badge/1--Click_Launch-GitHub_Codespaces-blue?style=for-the-badge&logo=github&logoColor=white)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=aryanakshat7277/MentorHub-AI-Platform)
[![Open in Gitpod](https://img.shields.io/badge/1--Click_Launch-Gitpod-orange?style=for-the-badge&logo=gitpod&logoColor=white)](https://gitpod.io/#https://github.com/aryanakshat7277/MentorHub-AI-Platform)

### 🔗 Public Live Website URL
👉 **[https://aryanakshat7277.github.io/MentorHub-AI-Platform/](https://aryanakshat7277.github.io/MentorHub-AI-Platform/)**

> 💡 **Enabling GitHub Pages (1-time step in GitHub Repository)**:
> 1. In your GitHub repository, navigate to **Settings** ➔ **Pages** (in the left sidebar).
> 2. Under **Build and deployment** ➔ **Source**, select **"Deploy from a branch"**.
> 3. Under **Branch**, select `gh-pages` and `/ (root)`, then click **Save**.
> *(The compiled production build is already pre-built, committed, and pushed to the `gh-pages` branch!)*

---

## 🌟 What Sets MentorHub Apart? (6 Unique Must-Have Features)

MentorHub transcends traditional booking platforms by introducing intelligent, real-time mentorship dynamics:

1. 🚨 **10-Minute SOS Bug Rescue** (`/sessions` & `/workspace?sos=1`)
   - Instant developer triage for blockers.
   - Live synchronized 10-minute countdown ribbon in the IDE/video workspace.
   - Fast-turnaround mentorship awarding **+100 Karma XP** to mentors upon resolution.

2. 🎙️ **Live Interview Confidence Coach** (`/workspace`)
   - Real-time speech and confidence analytics with an animated frequency-wave visualizer.
   - Dynamic pace tracking (Words Per Minute), filler-word detection (`"um"`, `"like"`, `"uh"`), and adaptive AI coaching tips.

3. 👥 **Silent Co-Pilot / Shadow Mode** (`/workspace?mode=spectator`)
   - Enables junior mentees to quietly observe expert 1-on-1 coding sessions without disrupting flow.
   - Non-intrusive floating kudos reactions (🔥, 💡, 👏, 🚀) and a private off-canvas spectator Q&A drawer.

4. 🔄 **Reverse Mentoring Exchange** (`/mentor-matching`)
   - Bidirectional skill bridging: senior engineers mentor juniors in architecture, while juniors reciprocate by mentoring seniors in cutting-edge tech (GenAI, modern tooling).
   - Unlocks the prestigious **"Two-Way Learner"** badge and **+150 XP**.

5. 🔋 **Mentor Battery Recharge Shield** (`/mentor-matching`)
   - Protects top mentors from cognitive burnout.
   - Automatically activates a resting badge when active session thresholds are reached, seamlessly redirecting mentees to vetted alternative peer mentors.

6. 📄 **1-Click Proof of Growth Portfolio Page** (`/portfolio/:username`)
   - Public, shareable, tamper-evident career showcase featuring Knowledge Impact Scores, session history, verified skills, and QR verification modals.
   - Clean, print-ready CSS optimized for instant PDF resume export.

---

## 🌐 Knowledge Impact & Sharing Chain

Instead of a standard 5-star rating, MentorHub tracks actual downstream value created:
- **Knowledge Impact Score**: Calculated dynamically based on sessions completed, students helped, retention rate, and real learner improvements.
- **Knowledge Sharing Chain**: Multi-hop pedigree tracking how knowledge cascades through the community (e.g., *Pavani → Rahul → Sneha → Arun*).

---

## 📐 System Architecture & Vector Diagrams

Detailed, high-resolution vector diagrams conforming to IEEE standards are located in the [`diagrams/`](./diagrams) directory:

- 📊 **[Level-1 Data Flow Diagram (DFD)](./diagrams/MentorHub_Data_Flow_Diagram.pdf)**: Visualizes end-to-end data lifecycle across WebRTC sessions, SOS queues, and authentication.
- 🗄️ **[Entity-Relationship Diagram (ERD)](./diagrams/MentorHub_ER_Diagram.pdf)**: Complete schema mapping for Users, Sessions, Goals, SOS Requests, Knowledge Impact, and Certificates.
- 🎭 **[Use Case Diagram (UML)](./diagrams/MentorHub_Use_Case_Diagram.pdf)**: Full actor-subsystem interactions between Mentee, Mentor, Admin, and AI Assistant.

---

## 🛠️ Tech Stack & Implementation Details

### Backend Infrastructure (`/backend`)
- **Runtime**: Java 21 (JDK 21 LTS)
- **Framework**: Spring Boot 3.2+
- **Security**: Spring Security 6, BCrypt Password Encoder, Stateless JWT Authentication
- **Data & Persistence**: Spring Data JPA, Hibernate, H2 Persistent File Database (`backend/data/`)

### Frontend Architecture (`/frontend`)
- **Framework**: Angular 17 (Standalone Components & Signals)
- **Typography & Theme**: Authentic Times New Roman serif styling with glassmorphic cards and ambient lighting

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Full Name | Highlight Feature |
| :--- | :--- | :--- | :--- | :--- |
| **Principal Mentor** | `akshat@mentorhub.com` | `password123` | **Akshat Aryan** | Full Admin & Matcher Access |
| **Junior Mentee** | `kriti@mentorhub.com` | `password123` | **Kriti Sagar** | Learning Path & Goals |
| **Impact Mentor** | `pavani@mentorhub.com` | `password123` | **Pavani Sharma** | Knowledge Impact Score (91/100) |

---

## 🚀 Local Development Setup

### 1. Run Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
*Backend API will run at `http://localhost:8080`*

### 2. Run Angular Frontend
```bash
cd frontend
npm install
npm start
```
*Frontend application will run at `http://localhost:4200`*

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
