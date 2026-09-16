import { Injectable } from '@angular/core';

export interface VivaQuestion {
  id: number;
  question: string;
  topic: string;
  difficulty: 'Standard' | 'Advanced' | 'Defense Grill';
  keyConcepts: string[];
  modelAnswer: string;
  commonPitfalls: string[];
  followUpPrompt?: string;
}

export interface VivaTrack {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  estimatedMinutes: number;
  totalQuestions: number;
  tags: string[];
  questions: VivaQuestion[];
}

export interface TelemetryMetrics {
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  pacingRating: 'Too Slow' | 'Optimal Pace' | 'Rushed';
  fillerWordCount: number;
  fillerWordsDetected: { word: string; count: number }[];
  matchedKeywords: string[];
  missedKeywords: string[];
  conceptAccuracyScore: number; // 0 - 100
  fluencyScore: number;         // 0 - 100
  depthScore: number;           // 0 - 100
  overallScore: number;         // 0 - 100
  strengths: string[];
  weaknesses: string[];
  goldStandardRecommendation: string;
}

export interface QuestionAnswerRecord {
  question: VivaQuestion;
  userAnswer: string;
  telemetry: TelemetryMetrics;
}

export interface VivaFlashcard {
  id: number;
  topic: string;
  question: string;
  conceptSummary: string;
  keyTerminology: string[];
  examinerTip: string;
  userAccuracy: number;
}

export interface VivaSessionResult {
  trackTitle: string;
  trackId: string;
  examinerName: string;
  completedAt: Date;
  overallScore: number;
  grade: string;
  honorific: string;
  totalTimeSeconds: number;
  averageWpm: number;
  totalFillerWords: number;
  accuracyAverage: number;
  depthAverage: number;
  fluencyAverage: number;
  records: QuestionAnswerRecord[];
  flashcards: VivaFlashcard[];
  xpAwarded: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockVivaService {
  private tracks: VivaTrack[] = [
    {
      id: 'mentorhub-defense',
      title: 'MentorHub Project Defense (Viva Special)',
      subtitle: 'Core Architecture, WebRTC, AI Routing & Security',
      icon: '👑',
      description: 'Comprehensive defense simulation designed specifically for the MentorHub AI Platform final project evaluation.',
      estimatedMinutes: 8,
      totalQuestions: 4,
      tags: ['Angular 17', 'Spring Boot 3', 'WebSockets', 'WebRTC', 'Gemini AI'],
      questions: [
        {
          id: 1,
          topic: 'Platform Architecture & Separation of Concerns',
          difficulty: 'Standard',
          question: 'Explain the high-level architecture of MentorHub. How do the Angular frontend, Spring Boot backend, and real-time WebSocket broker interact?',
          keyConcepts: ['rest api', 'spring boot', 'angular', 'websocket', 'stomp', 'jwt', 'separation of concerns', 'stateless'],
          modelAnswer: 'MentorHub utilizes a decoupled client-server architecture. The frontend is built on Angular 17 Standalone components with reactive RxJS state management. Communication occurs via stateless REST APIs secured by JWT Bearer tokens for CRUD operations, and duplex STOMP over WebSockets for live chat, presence telemetry, and collaboration sync. The Spring Boot backend acts as the resource server and signaling broker.',
          commonPitfalls: ['Describing it as monolithic without mentioning REST/WebSocket duality', 'Failing to mention how auth is preserved across socket connections'],
          followUpPrompt: 'How would you scale the WebSocket broker across multiple backend instances?'
        },
        {
          id: 2,
          topic: 'Live Workspace & WebRTC Peer-to-Peer Signaling',
          difficulty: 'Advanced',
          question: 'In the Live Workspace, how does MentorHub establish peer-to-peer video calling and shared whiteboard synchronization between Mentor and Mentee?',
          keyConcepts: ['webrtc', 'signaling', 'ice candidate', 'sdp offer', 'stun', 'turn', 'peer-to-peer', 'canvas sync'],
          modelAnswer: 'WebRTC handles direct peer-to-peer audio and video streaming. To establish the connection, Spring Boot WebSockets act as the signaling server exchanging Session Description Protocol (SDP) offers, answers, and ICE candidate coordinates. Once STUN negotiates public endpoints, media streams directly P2P without burdening the backend server. Whiteboard strokes are broadcast through a lightweight WebSocket channel.',
          commonPitfalls: ['Saying video streams go through the Spring Boot server directly', 'Confusing STUN/TURN traversal with database persistence'],
          followUpPrompt: 'What happens when both peers are behind strict corporate NATs?'
        },
        {
          id: 3,
          topic: 'AI Routing Engine & Multi-Provider Resilience',
          difficulty: 'Defense Grill',
          question: 'How does MentorHub route queries to the Gemini AI Neural Core, and what fault-tolerance mechanisms exist if the cloud provider experiences latency or rate limits?',
          keyConcepts: ['gemini', 'fallback', 'circuit breaker', 'streaming', 'sse', 'model router', 'rate limit', 'graceful degradation'],
          modelAnswer: 'The platform integrates the AiModelRouterService, which encapsulates Google Gemini models alongside a fallback pipeline. When streaming prompt responses, Server-Sent Events (SSE) deliver chunked tokens to the UI. If quota exhaustion or network dropouts occur, the router initiates graceful degradation—switching to pre-compiled local heuristic responses or queueing requests with exponential backoff.',
          commonPitfalls: ['Hardcoding API keys into client-side JS', 'Lacking an offline fallback for live viva presentations'],
          followUpPrompt: 'How do you prevent prompt injection attacks in student-submitted code reviews?'
        },
        {
          id: 4,
          topic: 'Security & Certificate Cryptographic Verification',
          difficulty: 'Advanced',
          question: 'Walk through how MentorHub prevents certificate tampering. How is a certificate verified on the public verification route without database tampering risks?',
          keyConcepts: ['sha-256', 'cryptographic hash', 'tamper-proof', 'checksum', 'qr code', 'public verification', 'immutable'],
          modelAnswer: 'Each completed mentorship certificate generates a SHA-256 digital fingerprint calculated from the recipient ID, mentor credential, completion timestamp, and issuing authority payload. Any modification to the certificate data invalidates the hash. When a recruiter scans the embedded QR code or visits #/verify-certificate/:id, the platform recalculates the checksum and validates authenticity against the signed hash registry.',
          commonPitfalls: ['Claiming raw database IDs alone provide verification', 'Not explaining what hashing mathematically accomplishes'],
          followUpPrompt: 'How would you migrate this verification mechanism to an on-chain smart contract?'
        }
      ]
    },
    {
      id: 'fullstack-spring-angular',
      title: 'Full-Stack Spring Boot 3 & Angular 17',
      subtitle: 'Modern Enterprise Web Architecture',
      icon: '⚡',
      description: 'Mastery check on Java 21 features, Spring Security filters, Angular Standalone pipes, and signals.',
      estimatedMinutes: 6,
      totalQuestions: 3,
      tags: ['Spring Security', 'JPA Hibernate', 'Angular Signals', 'RxJS'],
      questions: [
        {
          id: 101,
          topic: 'Spring Security Filter Chain & JWT Validation',
          difficulty: 'Standard',
          question: 'How does a stateless JWT filter intercept an HTTP request in Spring Boot 3? What happens inside OncePerRequestFilter?',
          keyConcepts: ['onceperrequestfilter', 'securitycontextholder', 'bearer token', 'claims', 'authentication token', 'filter chain'],
          modelAnswer: 'A custom JwtAuthenticationFilter extending OncePerRequestFilter intercepts incoming HTTP requests before reaching DispatcherServlet. It extracts the Authorization header, validates the JWT signature and expiration against the secret key, extracts user claims, constructs an UsernamePasswordAuthenticationToken, and populates SecurityContextHolder before calling filterChain.doFilter().',
          commonPitfalls: ['Creating a new filter per thread without OncePerRequestFilter', 'Not clearing or properly propagating the SecurityContext'],
          followUpPrompt: 'How do you handle expired token refresh without forcing user logout?'
        },
        {
          id: 102,
          topic: 'Angular 17 Signals vs RxJS Observables',
          difficulty: 'Advanced',
          question: 'Compare Angular 17 Signals with RxJS Observables. In what scenario would you choose Signals over an Observable stream, and vice versa?',
          keyConcepts: ['signals', 'fine-grained reactivity', 'zone.js', 'glitch-free', 'rxjs', 'events over time', 'async pipe'],
          modelAnswer: 'Angular Signals provide synchronous, fine-grained, glitch-free reactive state primitives that enable Zone-less change detection without re-evaluating the entire component tree. RxJS Observables remain superior for asynchronous event streams over time, complex operations involving debounce, cancelation (switchMap), retry mechanisms, and WebSocket telemetry.',
          commonPitfalls: ['Thinking Signals completely replace RxJS in HTTP and WebSockets', 'Neglecting the synchronous pull vs async push distinction'],
          followUpPrompt: 'How does toSignal() bridge the gap between RxJS and Signals?'
        },
        {
          id: 103,
          topic: 'Database Optimization: Solving the JPA N+1 Query Problem',
          difficulty: 'Defense Grill',
          question: 'What is the JPA N+1 query problem in Spring Data JPA, and how do you systematically diagnose and resolve it?',
          keyConcepts: ['n+1 problem', 'lazy loading', 'join fetch', 'entity graph', 'batch size', 'query count', 'hibernate'],
          modelAnswer: 'The N+1 problem occurs when fetching N entities lazily executes 1 initial query followed by N individual sub-queries for associated relationships. It is diagnosed using SQL query logging or Hibernate statistics. Resolutions include using JOIN FETCH in JPQL, defining @EntityGraph on the repository method, or configuring hibernate.default_batch_fetch_size to batch queries.',
          commonPitfalls: ['Changing FetchType.LAZY to EAGER as a solution (which often worsens query count)', 'Not understanding how Join Fetch differs from standard JOIN'],
          followUpPrompt: 'What are the memory trade-offs of using JOIN FETCH on multiple collections?'
        }
      ]
    },
    {
      id: 'dsa-system-design',
      title: 'Algorithms & Distributed Systems',
      subtitle: 'Complexity, Concurrency & High-Throughput Design',
      icon: '🧠',
      description: 'Rigorous grilling on time complexity, CAP theorem, caching strategies, and concurrency primitives.',
      estimatedMinutes: 6,
      totalQuestions: 3,
      tags: ['Big-O', 'CAP Theorem', 'Redis Caching', 'Virtual Threads'],
      questions: [
        {
          id: 201,
          topic: 'Time & Space Complexity Trade-offs',
          difficulty: 'Standard',
          question: 'Explain the difference between Time and Space complexity in Dynamic Programming. How does memoization differ from tabulation?',
          keyConcepts: ['memoization', 'tabulation', 'top-down', 'bottom-up', 'recursion stack', 'call stack', 'space optimization'],
          modelAnswer: 'Dynamic Programming optimizes overlapping subproblems. Memoization is top-down recursion storing results in a hash table or array, consuming additional space on the call stack. Tabulation is bottom-up iterative solving base cases first, eliminating call stack overhead and frequently allowing space reduction from O(N) to O(1) by only tracking the last few states.',
          commonPitfalls: ['Failing to account for recursion stack frame space in memoization', 'Confusing greedy approach with dynamic programming'],
          followUpPrompt: 'Can every DP problem be solved with O(1) space complexity?'
        },
        {
          id: 202,
          topic: 'Distributed Caching Strategies & Cache Invalidation',
          difficulty: 'Advanced',
          question: 'Compare Cache-Aside, Write-Through, and Write-Behind caching strategies in a high-concurrency microservices system. How do you prevent Cache Stampede?',
          keyConcepts: ['cache-aside', 'write-through', 'write-behind', 'cache stampede', 'thundering herd', 'ttl', 'mutex lock'],
          modelAnswer: 'In Cache-Aside, the application queries cache first; on miss, it loads from DB and repopulates cache. Write-Through writes to cache and DB synchronously. Write-Behind queues async DB writes for high throughput at the risk of data loss. Cache Stampede (Thundering Herd) when a hot key expires is prevented by distributed mutex locks, probabilistic early expiration (XFetch algorithm), or pre-warming.',
          commonPitfalls: ['Saying Write-Through is completely resilient to network partition', 'Not understanding why dual writes cause eventual inconsistency'],
          followUpPrompt: 'How does Redis handle cache eviction under memory pressure?'
        },
        {
          id: 203,
          topic: 'Java 21 Virtual Threads & Concurrency Models',
          difficulty: 'Defense Grill',
          question: 'How do Java 21 Virtual Threads (Project Loom) differ from traditional OS platform threads? When should you NOT use virtual threads?',
          keyConcepts: ['virtual threads', 'project loom', 'carrier threads', 'forkjoinpool', 'blocking i/o', 'cpu-bound', 'pinning', 'synchronized'],
          modelAnswer: 'Platform threads are 1:1 OS threads with ~1MB stack memory overhead. Virtual Threads are M:N user-mode threads managed by the JVM over a pool of carrier threads, allowing millions of concurrent tasks with minimal memory. They are ideal for high-throughput blocking I/O (REST, DB queries). They should NOT be used for compute-heavy CPU-bound operations, or when thread pinning occurs due to synchronized blocks.',
          commonPitfalls: ['Thinking virtual threads make CPU-intensive matrix multiplication faster', 'Assuming thread pooling is needed for virtual threads'],
          followUpPrompt: 'How does ReentrantLock prevent thread pinning in Java 21?'
        }
      ]
    }
  ];

  private fillerWordList = [
    'um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of', 'literally', 'so yeah'
  ];

  getTracks(): VivaTrack[] {
    return this.tracks;
  }

  getTrackById(id: string): VivaTrack | undefined {
    return this.tracks.find(t => t.id === id);
  }

  /**
   * Evaluates mentee response across 4 core telemetry dimensions:
   * 1. Technical Accuracy (Key concepts semantic matching)
   * 2. Fluency & Filler Words
   * 3. Speaking Pace (WPM)
   * 4. Structural Depth & Detail
   */
  evaluateAnswer(answerText: string, durationSeconds: number, question: VivaQuestion): TelemetryMetrics {
    const cleanText = (answerText || '').trim();
    const words = cleanText.length > 0 ? cleanText.split(/\s+/) : [];
    const wordCount = words.length;

    // 1. Words Per Minute (WPM)
    const effectiveMinutes = Math.max(durationSeconds / 60, 0.1);
    const wpm = Math.round(wordCount / effectiveMinutes);

    let pacingRating: 'Too Slow' | 'Optimal Pace' | 'Rushed' = 'Optimal Pace';
    if (wpm < 95) pacingRating = 'Too Slow';
    else if (wpm > 175) pacingRating = 'Rushed';

    // 2. Filler Word Detection
    const lowerText = cleanText.toLowerCase();
    const fillerWordsDetected: { word: string; count: number }[] = [];
    let totalFillers = 0;

    for (const filler of this.fillerWordList) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches && matches.length > 0) {
        fillerWordsDetected.push({ word: filler, count: matches.length });
        totalFillers += matches.length;
      }
    }

    // 3. Concept / Keyword Coverage
    const matchedKeywords: string[] = [];
    const missedKeywords: string[] = [];

    for (const concept of question.keyConcepts) {
      const conceptLower = concept.toLowerCase();
      if (lowerText.includes(conceptLower)) {
        matchedKeywords.push(concept);
      } else {
        missedKeywords.push(concept);
      }
    }

    // 4. Scoring Calculations
    // Concept Accuracy: % of key concepts mentioned + baseline for coherent response length
    const conceptRatio = question.keyConcepts.length > 0 ? (matchedKeywords.length / question.keyConcepts.length) : 1;
    let conceptAccuracyScore = Math.min(Math.round(conceptRatio * 85 + (wordCount >= 30 ? 15 : wordCount * 0.5)), 100);
    if (wordCount < 10) conceptAccuracyScore = Math.max(conceptAccuracyScore - 40, 10);

    // Fluency Score: starts at 95, penalizes excessive fillers & extreme WPM
    let fluencyPenalty = totalFillers * 4;
    if (pacingRating !== 'Optimal Pace') fluencyPenalty += 10;
    const fluencyScore = Math.max(Math.min(95 - fluencyPenalty + (wordCount >= 25 ? 5 : 0), 100), 20);

    // Depth Score: based on answer length, technical vocabulary presence, and syntax nuance
    let depthScore = 40;
    if (wordCount >= 25) depthScore += 20;
    if (wordCount >= 55) depthScore += 25;
    if (matchedKeywords.length >= 3) depthScore += 15;
    depthScore = Math.min(depthScore, 100);

    // Overall Weighted Score: 45% Accuracy + 30% Depth + 25% Fluency
    const overallScore = Math.round(conceptAccuracyScore * 0.45 + depthScore * 0.30 + fluencyScore * 0.25);

    // 5. Strengths & Critiques
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (matchedKeywords.length > 0) {
      strengths.push(`Identified core architectural concepts: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }
    if (pacingRating === 'Optimal Pace' && wordCount >= 20) {
      strengths.push(`Excellent pacing (${wpm} WPM) with coherent technical articulation.`);
    }
    if (totalFillers <= 1 && wordCount >= 25) {
      strengths.push('Clean verbal delivery with minimal speech disfluencies.');
    }

    if (missedKeywords.length > 0) {
      weaknesses.push(`Omitted expected viva concepts: ${missedKeywords.slice(0, 3).join(', ')}`);
    }
    if (totalFillers >= 3) {
      weaknesses.push(`Detected ${totalFillers} filler words ("${fillerWordsDetected.map(f => f.word).slice(0, 2).join('", "')}"). Strive for confident pauses instead.`);
    }
    if (pacingRating === 'Too Slow') {
      weaknesses.push(`Pacing was hesitant (${wpm} WPM). Aim for 120-150 WPM during formal viva defenses.`);
    } else if (pacingRating === 'Rushed') {
      weaknesses.push(`Speech cadence was very rapid (${wpm} WPM). Slow down to give technical terms gravitas.`);
    }
    if (wordCount < 20) {
      weaknesses.push('Answer was too brief. Elaborate on edge cases, data flows, and trade-offs.');
    }

    return {
      wordCount,
      durationSeconds,
      wpm,
      pacingRating,
      fillerWordCount: totalFillers,
      fillerWordsDetected,
      matchedKeywords,
      missedKeywords,
      conceptAccuracyScore,
      fluencyScore,
      depthScore,
      overallScore,
      strengths,
      weaknesses,
      goldStandardRecommendation: question.modelAnswer
    };
  }

  /**
   * Compiles complete viva results and generates personalized flashcards for review
   */
  compileSessionResult(
    track: VivaTrack,
    examinerName: string,
    records: QuestionAnswerRecord[]
  ): VivaSessionResult {
    const totalQuestions = records.length;
    let totalScoreSum = 0;
    let accuracySum = 0;
    let depthSum = 0;
    let fluencySum = 0;
    let totalWpmSum = 0;
    let totalFillers = 0;
    let totalTime = 0;

    const flashcards: VivaFlashcard[] = [];

    records.forEach((rec, idx) => {
      totalScoreSum += rec.telemetry.overallScore;
      accuracySum += rec.telemetry.conceptAccuracyScore;
      depthSum += rec.telemetry.depthScore;
      fluencySum += rec.telemetry.fluencyScore;
      totalWpmSum += rec.telemetry.wpm;
      totalFillers += rec.telemetry.fillerWordCount;
      totalTime += rec.telemetry.durationSeconds;

      // Generate a study flashcard for this question
      flashcards.push({
        id: idx + 1,
        topic: rec.question.topic,
        question: rec.question.question,
        conceptSummary: rec.question.modelAnswer,
        keyTerminology: rec.question.keyConcepts,
        examinerTip: rec.question.commonPitfalls[0] || 'Be ready for follow-up trade-off questions.',
        userAccuracy: rec.telemetry.conceptAccuracyScore
      });
    });

    const overallScore = Math.round(totalScoreSum / Math.max(totalQuestions, 1));
    const accuracyAverage = Math.round(accuracySum / Math.max(totalQuestions, 1));
    const depthAverage = Math.round(depthSum / Math.max(totalQuestions, 1));
    const fluencyAverage = Math.round(fluencySum / Math.max(totalQuestions, 1));
    const averageWpm = Math.round(totalWpmSum / Math.max(totalQuestions, 1));

    let grade = 'A';
    let honorific = 'Academic Distinction';
    if (overallScore >= 90) {
      grade = 'A+';
      honorific = 'Summa Cum Laude (Mastery)';
    } else if (overallScore >= 80) {
      grade = 'A';
      honorific = 'Magna Cum Laude (Proficient)';
    } else if (overallScore >= 70) {
      grade = 'B+';
      honorific = 'Cum Laude (Competent)';
    } else if (overallScore >= 60) {
      grade = 'B';
      honorific = 'Passing with Recommendations';
    } else {
      grade = 'C';
      honorific = 'Remedial Review Required';
    }

    const xpAwarded = Math.round(overallScore * 2.5);

    return {
      trackTitle: track.title,
      trackId: track.id,
      examinerName,
      completedAt: new Date(),
      overallScore,
      grade,
      honorific,
      totalTimeSeconds: totalTime,
      averageWpm,
      totalFillerWords: totalFillers,
      accuracyAverage,
      depthAverage,
      fluencyAverage,
      records,
      flashcards,
      xpAwarded
    };
  }
}
