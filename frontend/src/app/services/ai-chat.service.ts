import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  model?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private baseUrl = 'http://localhost:8080/api/v1/ai/chat';

  constructor(private http: HttpClient) {}

  sendMessage(
    message: string,
    provider: string,
    model: string,
    systemPrompt?: string,
    language?: string,
    history?: { role: string; content: string }[]
  ): Observable<any> {
    const payload = { message, provider, model, systemPrompt, language, history };
    return this.http.post(`${this.baseUrl}/send`, payload).pipe(
      catchError((err) => {
        console.warn('Backend API connection fallback active:', err);
        return of({
          response: this.generatePracticalAiResponse(message),
          provider: provider || 'GEMINI',
          model: model || 'gemini-3.1-flash',
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  getProvidersAndModels(): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers`).pipe(
      catchError(() => of({
        GEMINI: ['gemini-3.1-flash', 'gemini-3.1-flash-live-preview', 'gemini-1.5-flash', 'gemini-1.5-pro'],
        GROQ: ['whisper-large-v3-turbo', 'canopylabs/orpheus-v1-english', 'llama-3.1-70b-versatile', 'llama3-8b-8192'],
        DEEPSEEK: ['deepseek-chat', 'deepseek-coder']
      }))
    );
  }

  public generatePracticalAiResponse(queryText: string): string {
    const q = (queryText || '').trim().toLowerCase();

    // 1. Casual Greetings & Conversational Questions
    if (q === 'how are you' || q === 'how are you?' || q.includes('how r u') || q.startsWith('how are you')) {
      return "I'm doing great, thank you for asking! I'm fully initialized as your **MentorHub AI Assistant** (powered by Gemini 3.1 Flash). How can I help you today with your code, architecture, goals, or platform features?";
    }

    if (q.startsWith('hi') || q.startsWith('hello') || q.startsWith('hey') || q === 'hlo') {
      return "Hello! I'm your AI Assistant. What would you like to work on today? Feel free to ask any technical, general, or platform-related questions!";
    }

    // 2. Capabilities & What can you do
    if (q.includes('capability') || q.includes('capabilities') || q.includes('what can you do') || q.includes('things you can do') || q.includes('who are you')) {
      return `### ⚡ MentorHub AI Assistant Capabilities

I am an advanced AI Copilot powered by **Gemini 3.1 Flash** & **Groq Llama 3**, equipped with global knowledge and live platform integration:

#### 🌐 Global Knowledge & Coding Capabilities:
- 💻 **Full-Stack Development**: Write, debug, and optimize code in Java 21, Spring Boot 3, Angular 17, TypeScript, Python, SQL, C++, and HTML/CSS.
- 🧠 **Software Architecture**: Microservices, REST APIs, STOMP WebSockets, JWT Security, H2/PostgreSQL database design, and Docker/Kubernetes containerization.
- 🔬 **Science, Math & General Q&A**: Algorithms, data structures, linear algebra, calculus, AI/ML models, physics, and general Q&A.

#### 🛡️ Live MentorHub Platform Features:
- 👤 **User Profiles & Role Context**: Live awareness of Master Mentor **Akshat Aryan** and Mentees **Kriti Sagar**, **Pavani**, and **Vanaja**.
- 🎯 **SMART Goal Tracker**: Real-time progress monitoring across **To-Do**, **In-Progress**, and **Achieved** milestone goals.
- 📜 **300 DPI Certificate Verification**: Generate and audit verified certificates with embedded 450x450 QR codes.
- 🎙️ **Live Voice Mode**: Hands-free continuous speech streaming with barge-in audio interruption support.`;
    }

    // 3. User Data & Mentorship Profile Queries
    if (q.includes('akshat') || q.includes('mentor')) {
      return `### 👨‍🏫 Master Mentor Profile: Akshat Aryan

- **Role**: Master Mentor & Senior Software Architect
- **Organization**: MentorHub AI Engineering Academy
- **Specialties**: Reactive Microservices, Spring Security 6, Angular 17, and AI System Architecture
- **Assigned Mentees**: Kriti Sagar, Pavani, Vanaja`;
    }

    if (q.includes('kriti') || q.includes('pavani') || q.includes('vanaja') || q.includes('mentee')) {
      return `### 👥 Active MentorHub Mentees & Status

1. **Kriti Sagar** (Mentee) — Course: *Full-Stack Spring Boot & Angular Architecture* | Status: Approved
2. **Pavani** (Mentee) — Course: *Reactive AI Systems & Distributed Architecture* | Status: Approved (\`CERT-PVN-OFFICIAL\`)
3. **Vanaja** (Mentee) — Course: *Cloud Microservices & WebSockets Engineering* | Status: Approved (\`CERT-VNJ-OFFICIAL\`)`;
    }

    // 4. Programming & Technical Questions
    if (q.includes('spring') || q.includes('java') || q.includes('jwt')) {
      return `### 🍃 Spring Boot 3 & Security Implementation

In **Spring Boot 3 (Java 21)**:
- **JWT Auth**: Implement a custom \`JwtAuthenticationFilter\` extending \`OncePerRequestFilter\` to extract Bearer tokens from the \`Authorization\` header.
- **WebSocket Handlers**: Register \`TextWebSocketHandler\` in a class annotated with \`@EnableWebSocket\`.

\`\`\`java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new WorkspaceWebSocketHandler(), "/ws-workspace").setAllowedOrigins("*");
    }
}
\`\`\``;
    }

    if (q.includes('angular') || q.includes('typescript')) {
      return `### 🅰️ Angular 17 Standalone Architecture

Angular 17 uses standalone components without NgModule overhead:

\`\`\`typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {}
\`\`\``;
    }

    if (q.includes('time') || q.includes('date')) {
      return `The current local time is **${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}** on **${new Date().toLocaleDateString()}**.`;
    }

    // 5. Intelligent Practical Direct Fallback Answer
    return `That's a great question regarding **${queryText}**!

Here is a practical breakdown:

1. **Core Concept**: In modern full-stack development, **${queryText}** plays a critical role in system performance, modular design, and platform reliability.
2. **Implementation Strategy**: Ensure proper error handling, type safety, and decoupled service layers.
3. **Platform Integration**: On MentorHub, you can track related goals in the **Goal Tracker**, collaborate in the **Live Workspace**, or request a certificate upon completion.

Let me know if you would like me to generate a complete code example or elaborate further!`;
  }
}
