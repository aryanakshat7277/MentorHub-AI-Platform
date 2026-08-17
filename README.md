# 🚀 MentorHub Advanced AI Peer-Mentoring Platform

> **Full-Stack Enterprise Mentorship Platform**  
> Built with **Spring Boot 3 (Java 21)**, **Angular 17 Standalone Architecture**, **H2 Persistent Database**, **JWT Security**, and **Cybernetic Glassmorphic UI/UX**.

---

## 🛠️ Tech Stack & Architecture Overview

### 1. **Backend Infrastructure** (`/backend`)
- **Language & Runtime**: Java 21 (JDK 21)
- **Framework**: Spring Boot 3.2+
- **Security**: Spring Security 6 + BCrypt Password Encoder + JWT (JSON Web Token) Stateless Authentication
- **Data Access**: Spring Data JPA + Hibernate ORM
- **Database**: H2 File-Based Persistent Database (`backend/data/mentorhub_db`)
- **Key API Controllers**:
  - `AuthController`: Seeding demo accounts, BCrypt self-healing authentication (`/api/auth/login`, `/api/auth/register`)
  - `UserController`: Profile retrieval & system avatar updates (`/api/users/profile`, `/api/users/profile/update`)
  - `GoalController`: SMART goal Kanban board CRUD operations (`/api/goals`)
  - `ResourceController`: Knowledge hub articles, videos, and study guides (`/api/resources`)
  - `AnalyticsController`: Mentorship performance metrics & weekly session velocity (`/api/analytics`)

### 2. **Frontend Architecture** (`/frontend`)
- **Framework**: Angular 17 (Standalone Components architecture)
- **State & Router**: Angular Router with standalone component lazy loading
- **Styling**: SCSS + Custom Glassmorphism Token System (`styles.scss`)
- **Graphics & PDF**: HTML5 Canvas API for live certificate generation & verification
- **Key Views**:
  - 🌌 **Startup Overlay**: 3-second sci-fi orbital radar & sonar laser scan entrance animation
  - 📊 **Dashboard (`/dashboard`)**: Holographic user hero card, digital clock, velocity sparklines, radial ring gauges
  - 🎯 **Goal Tracker (`/goals`)**: SMART 3D letter block cards, Kanban columns (To Do, In Progress, Achieved)
  - 👤 **Cybernetic Profile (`/profile`)**: System file picker picture selector, bio modal, reputation rating, skills matrix
  - 📈 **Performance Analytics (`/analytics`)**: Session completion rate, XP gain velocity bar chart, domain distribution donut chart
  - 📚 **Knowledge Hub (`/resource-hub`)**: Category filter pills (ALL, ARTICLE, VIDEO, COURSE, BOOK), bookmarking, search bar
  - 🗺️ **Learning Path (`/learning-path`)**: Active curricula progress gauges & non-overlapping vertical roadmap node tree
  - 🏆 **Certificates (`/certificates`)**: HTML5 Canvas PDF certificate generator & public verification route (`/verify-certificate/:certId`)
  - 💬 **AI Assistant Chatbot**: Floating sparkle button with real-time prompt drawer

---

## 🔑 Demo Accounts & Credentials

| Role | Email | Password | Full Name | Professional Title |
| :--- | :--- | :--- | :--- | :--- |
| **Mentor** | `akshat@mentorhub.com` | `password123` | **Akshat Aryan** | Principal AI & Full Stack Mentor |
| **Mentee** | `kriti@mentorhub.com` | `password123` | **Kriti Sagar** | Junior AI Engineer |

---

## 📂 Project Structure for VS Code

```
ST PROJECT/
├── README.md                      <-- Main Project Documentation & Setup Guide
├── PROJECT_METADATA.md            <-- Full Architecture & Feature Metadata Log
├── .env                           <-- Environment Configuration
│
├── backend/                       <-- Spring Boot 3 Java 21 Backend
│   ├── pom.xml                    <-- Maven Dependencies (Spring Boot, Security, JWT, JPA, H2)
│   ├── data/                      <-- Persistent H2 Database Storage Files
│   └── src/
│       ├── main/java/com/mentorhub/
│       │   ├── config/            <-- Security & JWT Filter Configuration
│       │   ├── controller/        <-- REST API Controllers (Auth, User, Goal, Resource, Analytics)
│       │   ├── model/             <-- JPA Entities (User, Goal, Resource, Session, Certificate)
│       │   ├── repository/        <-- Spring Data Repositories
│       │   └── service/           <-- Business Logic Services
│       └── main/resources/
│           └── application.properties <-- Database & Server Configuration
│
└── frontend/                      <-- Angular 17 Standalone Frontend
    ├── package.json               <-- Angular & RxJS Dependencies
    ├── angular.json               <-- Workspace Configuration
    ├── tsconfig.json              <-- TypeScript Configuration
    └── src/
        ├── styles.scss            <-- Global Sci-Fi Glassmorphism Design System
        ├── assets/
        │   └── mentorhub-logo.png <-- Official Pre-Cropped Circular Badge Logo
        └── app/
            ├── app.component.ts   <-- Root Component & Startup Animation Overlay
            ├── components/        <-- Standalone Feature Components
            │   ├── dashboard/
            │   ├── goals/
            │   ├── profile/
            │   ├── analytics/
            │   ├── resource-hub/
            │   ├── learning-path/
            │   ├── certificates/
            │   ├── sidebar/
            │   ├── header/
            │   └── ai-chatbot/
            └── services/          <-- ApiService & AuthService
```

---

## 🚀 How to Run in VS Code

### 1. Launch Spring Boot Backend:
```bash
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`*

### 2. Launch Angular Frontend:
```bash
cd frontend
npm install
npx ng serve --port 4200 --open
```
*Frontend runs on `http://localhost:4200`*

---

## 📋 Comprehensive Feature & Metadata Summary

1. **Self-Healing Authentication**:
   - `AuthController.java` incorporates automatic BCrypt password re-hashing logic so seeded demo users (`akshat@mentorhub.com`, `kriti@mentorhub.com`) can seamlessly log in with `password123`.

2. **System File Picker Profile Avatar Integration**:
   - Users can choose any local profile picture file directly from their computer system via the file picker input on the Profile page.

3. **Official Circular MentorHub Logo**:
   - The logo image (`assets/mentorhub-logo.png`) is formatted cleanly with `object-fit: contain` across the Startup screen, Sidebar header, Login card, and AI Chatbot drawer header.

4. **Non-Overlapping Roadmap Tree**:
   - The vertical roadmap node tree on `/learning-path` utilizes solid dark-tinted badge backgrounds (`#0B1221`) and explicit stacking (`z-index: 3`) so connecting lines never cut through node numbers.

5. **Glassmorphic Filter Pills & Resource Cards**:
   - The Resource Hub includes interactive filter pills (ALL, ARTICLE, VIDEO, COURSE, BOOK), bookmarking toggle, search query filtering, and color-coded type badges.

6. **Canvas PDF Certificate Generator**:
   - Certificates are dynamically generated using HTML5 Canvas with custom borders, seal stamps, signatures, and unique verification tokens validateable at `/verify-certificate/:certId`.
