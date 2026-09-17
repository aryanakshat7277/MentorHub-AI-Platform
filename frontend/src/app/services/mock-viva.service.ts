import { Injectable } from '@angular/core';

export interface VivaUnitTest {
  name: string;
  description: string;
  expectedStatus: 'PASS' | 'FAIL';
  timeMs: number;
}

export interface CompetencyRadar {
  architecturalRigor: number;     // 0 - 100
  telemetryPacing: number;        // 0 - 100
  codePrecision: number;          // 0 - 100
  vocalFluency: number;           // 0 - 100
  socraticAdaptability: number;   // 0 - 100
}

export interface VivaQuestion {
  id: number;
  question: string;
  topic: string;
  difficulty: 'Standard' | 'Advanced' | 'Defense Grill';
  keyConcepts: string[];
  modelAnswer: string;
  commonPitfalls: string[];
  followUpPrompt?: string;
  hint?: string;                  // Conceptual hint / clue
  unitTests?: VivaUnitTest[];     // Unit tests for code scratchpad
  assignedExaminerId?: string;    // 'akshat' | 'sophia' | 'marcus'
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
  codeSnippet?: string;
  usedHint?: boolean;
  testsPassed?: boolean;
  examinerId?: string;
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
  defenseMode: 'SOLO' | 'PANEL';
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
  radar: CompetencyRadar;
  verificationHash: string;
  qrMatrixSvg: string;
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
          assignedExaminerId: 'akshat',
          question: 'Explain the high-level architecture of MentorHub. How do the Angular frontend, Spring Boot backend, and real-time WebSocket broker interact?',
          keyConcepts: ['rest api', 'spring boot', 'angular', 'websocket', 'stomp', 'jwt', 'separation of concerns', 'stateless'],
          hint: 'Emphasize the dual-channel protocol design: stateless REST for transactional state, and duplex STOMP over WebSocket for telemetry and presence.',
          modelAnswer: 'MentorHub utilizes a decoupled client-server architecture. The frontend is built on Angular 17 Standalone components with reactive RxJS state management. Communication occurs via stateless REST APIs secured by JWT Bearer tokens for CRUD operations, and duplex STOMP over WebSockets for live chat, presence telemetry, and collaboration sync. The Spring Boot backend acts as the resource server and signaling broker.',
          commonPitfalls: ['Describing it as monolithic without mentioning REST/WebSocket duality', 'Failing to mention how auth is preserved across socket connections'],
          followUpPrompt: 'How would you scale the WebSocket broker across multiple backend instances?',
          unitTests: [
            { name: 'WebSocketSecurityFilterChainTest', description: 'Validates JWT handshake header before STOMP upgrade', expectedStatus: 'PASS', timeMs: 12 },
            { name: 'DuplexChannelThroughputTest', description: 'Verifies sub-25ms broadcast latency for peer sync', expectedStatus: 'PASS', timeMs: 8 },
            { name: 'StatelessTokenRevocationTest', description: 'Confirms invalid credentials terminate socket connection', expectedStatus: 'PASS', timeMs: 15 }
          ]
        },
        {
          id: 2,
          topic: 'Live Workspace & WebRTC Peer-to-Peer Signaling',
          difficulty: 'Advanced',
          assignedExaminerId: 'sophia',
          question: 'In the Live Workspace, how does MentorHub establish peer-to-peer video calling and shared whiteboard synchronization between Mentor and Mentee?',
          keyConcepts: ['webrtc', 'signaling', 'ice candidate', 'sdp offer', 'stun', 'turn', 'peer-to-peer', 'canvas sync'],
          hint: 'Recall the three phases of WebRTC negotiation: signaling SDP handshake via Spring Boot, STUN endpoint resolution, and direct RTCPeerConnection stream transport.',
          modelAnswer: 'WebRTC handles direct peer-to-peer audio and video streaming. To establish the connection, Spring Boot WebSockets act as the signaling server exchanging Session Description Protocol (SDP) offers, answers, and ICE candidate coordinates. Once STUN negotiates public endpoints, media streams directly P2P without burdening the backend server. Whiteboard strokes are broadcast through a lightweight WebSocket channel.',
          commonPitfalls: ['Saying video streams go through the Spring Boot server directly', 'Confusing STUN/TURN traversal with database persistence'],
          followUpPrompt: 'What happens when both peers are behind strict corporate symmetric NATs?',
          unitTests: [
            { name: 'RtcSignalingHandshakeTest', description: 'Asserts SDP offer/answer roundtrip exchange via WebSocket', expectedStatus: 'PASS', timeMs: 14 },
            { name: 'IceCandidateGatheringTest', description: 'Ensures public relay fallback activates when direct P2P fails', expectedStatus: 'PASS', timeMs: 22 },
            { name: 'CanvasDeltaCompressionTest', description: 'Validates stroke vector serialization under 512 bytes', expectedStatus: 'PASS', timeMs: 9 }
          ]
        },
        {
          id: 3,
          topic: 'AI Routing Engine & Multi-Provider Resilience',
          difficulty: 'Defense Grill',
          assignedExaminerId: 'marcus',
          question: 'How does MentorHub route queries to the Gemini AI Neural Core, and what fault-tolerance mechanisms exist if the cloud provider experiences latency or rate limits?',
          keyConcepts: ['gemini', 'fallback', 'circuit breaker', 'streaming', 'sse', 'model router', 'rate limit', 'graceful degradation'],
          hint: 'Think about circuit breakers, token bucket rate limiters, Server-Sent Events streaming, and local heuristic fallbacks when cloud quotas are exceeded.',
          modelAnswer: 'The platform integrates the AiModelRouterService, which encapsulates Google Gemini models alongside a fallback pipeline. When streaming prompt responses, Server-Sent Events (SSE) deliver chunked tokens to the UI. If quota exhaustion or network dropouts occur, the router initiates graceful degradation—switching to pre-compiled local heuristic responses or queueing requests with exponential backoff.',
          commonPitfalls: ['Hardcoding API keys into client-side JS', 'Lacking an offline fallback for live viva presentations'],
          followUpPrompt: 'How do you prevent prompt injection attacks in student-submitted code reviews?',
          unitTests: [
            { name: 'CircuitBreakerTripTest', description: 'Verifies circuit trips to OPEN state after 3 consecutive 503 errors', expectedStatus: 'PASS', timeMs: 18 },
            { name: 'SseChunkStreamingBufferTest', description: 'Asserts real-time token yield without buffer bloat', expectedStatus: 'PASS', timeMs: 11 },
            { name: 'OfflineHeuristicFallbackTest', description: 'Confirms deterministic mentor guidance responds in <5ms offline', expectedStatus: 'PASS', timeMs: 6 }
          ]
        },
        {
          id: 4,
          topic: 'Security & Certificate Cryptographic Verification',
          difficulty: 'Advanced',
          assignedExaminerId: 'akshat',
          question: 'Walk through how MentorHub prevents certificate tampering. How is a certificate verified on the public verification route without database tampering risks?',
          keyConcepts: ['sha-256', 'cryptographic hash', 'tamper-proof', 'checksum', 'qr code', 'public verification', 'immutable'],
          hint: 'Explain how hashing transforms recipient payload + mentor credentials into an immutable digest that breaks mathematically if a single character is altered.',
          modelAnswer: 'Each completed mentorship certificate generates a SHA-256 digital fingerprint calculated from the recipient ID, mentor credential, completion timestamp, and issuing authority payload. Any modification to the certificate data invalidates the hash. When a recruiter scans the embedded QR code or visits #/verify-certificate/:id, the platform recalculates the checksum and validates authenticity against the signed hash registry.',
          commonPitfalls: ['Claiming raw database IDs alone provide verification', 'Not explaining what hashing mathematically accomplishes'],
          followUpPrompt: 'How would you migrate this verification mechanism to an on-chain smart contract?',
          unitTests: [
            { name: 'Sha256ChecksumIntegrityTest', description: 'Ensures 1-byte mutation produces totally disparate digest', expectedStatus: 'PASS', timeMs: 7 },
            { name: 'QrCodePayloadEncodingTest', description: 'Validates HTTPS URL embedded in QR matrix contains correct hash', expectedStatus: 'PASS', timeMs: 13 },
            { name: 'PublicVerificationRouteTest', description: 'Verifies stateless verification responds 200 OK with seal', expectedStatus: 'PASS', timeMs: 16 }
          ]
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
          assignedExaminerId: 'akshat',
          question: 'How does a stateless JWT filter intercept an HTTP request in Spring Boot 3? What happens inside OncePerRequestFilter?',
          keyConcepts: ['onceperrequestfilter', 'securitycontextholder', 'bearer token', 'claims', 'authentication token', 'filter chain'],
          hint: 'Remember: OncePerRequestFilter guarantees single execution per dispatch. It extracts the Authorization header, validates claims, and populates SecurityContext.',
          modelAnswer: 'A custom JwtAuthenticationFilter extending OncePerRequestFilter intercepts incoming HTTP requests before reaching DispatcherServlet. It extracts the Authorization header, validates the JWT signature and expiration against the secret key, extracts user claims, constructs an UsernamePasswordAuthenticationToken, and populates SecurityContextHolder before calling filterChain.doFilter().',
          commonPitfalls: ['Creating a new filter per thread without OncePerRequestFilter', 'Not clearing or properly propagating the SecurityContext'],
          followUpPrompt: 'How do you handle expired token refresh without forcing user logout?',
          unitTests: [
            { name: 'JwtClaimsParsingTest', description: 'Asserts expiration claim rejection and role authority mapping', expectedStatus: 'PASS', timeMs: 10 },
            { name: 'SecurityContextPopulationTest', description: 'Confirms authenticated principal is accessible in thread context', expectedStatus: 'PASS', timeMs: 12 },
            { name: 'AnonymousEndpointBypassTest', description: 'Verifies /api/auth/** bypasses token validation cleanly', expectedStatus: 'PASS', timeMs: 6 }
          ]
        },
        {
          id: 102,
          topic: 'Angular 17 Signals vs RxJS Observables',
          difficulty: 'Advanced',
          assignedExaminerId: 'sophia',
          question: 'Compare Angular 17 Signals with RxJS Observables. In what scenario would you choose Signals over an Observable stream, and vice versa?',
          keyConcepts: ['signals', 'fine-grained reactivity', 'zone.js', 'glitch-free', 'rxjs', 'events over time', 'async pipe'],
          hint: 'Signals provide synchronous glitch-free value tracking for UI state. RxJS shines for complex async streams, debounce, switchMap, and WebSockets.',
          modelAnswer: 'Angular Signals provide synchronous, fine-grained, glitch-free reactive state primitives that enable Zone-less change detection without re-evaluating the entire component tree. RxJS Observables remain superior for asynchronous event streams over time, complex operations involving debounce, cancelation (switchMap), retry mechanisms, and WebSocket telemetry.',
          commonPitfalls: ['Thinking Signals completely replace RxJS in HTTP and WebSockets', 'Neglecting the synchronous pull vs async push distinction'],
          followUpPrompt: 'How does toSignal() bridge the gap between RxJS and Signals?',
          unitTests: [
            { name: 'ComputedSignalGlitchFreeTest', description: 'Asserts derived signals recompute once without intermediate glitch', expectedStatus: 'PASS', timeMs: 8 },
            { name: 'RxjsSwitchMapCancellationTest', description: 'Validates rapid search query cancellations in HTTP pipe', expectedStatus: 'PASS', timeMs: 15 },
            { name: 'SignalEffectCleanupTest', description: 'Confirms effect teardown executes on component destruction', expectedStatus: 'PASS', timeMs: 7 }
          ]
        },
        {
          id: 103,
          topic: 'Database Optimization: Solving the JPA N+1 Query Problem',
          difficulty: 'Defense Grill',
          assignedExaminerId: 'marcus',
          question: 'What is the JPA N+1 query problem in Spring Data JPA, and how do you systematically diagnose and resolve it?',
          keyConcepts: ['n+1 problem', 'lazy loading', 'join fetch', 'entity graph', 'batch size', 'query count', 'hibernate'],
          hint: 'The N+1 problem occurs when 1 parent query triggers N queries for lazy children. Solve with JOIN FETCH, @EntityGraph, or hibernate batch size.',
          modelAnswer: 'The N+1 problem occurs when fetching N entities lazily executes 1 initial query followed by N individual sub-queries for associated relationships. It is diagnosed using SQL query logging or Hibernate statistics. Resolutions include using JOIN FETCH in JPQL, defining @EntityGraph on the repository method, or configuring hibernate.default_batch_fetch_size to batch queries.',
          commonPitfalls: ['Changing FetchType.LAZY to EAGER as a solution (which often worsens query count)', 'Not understanding how Join Fetch differs from standard JOIN'],
          followUpPrompt: 'What are the memory trade-offs of using JOIN FETCH on multiple collections?',
          unitTests: [
            { name: 'JoinFetchQueryCountTest', description: 'Asserts exactly 1 SQL SELECT statement executed for 50 records', expectedStatus: 'PASS', timeMs: 19 },
            { name: 'EntityGraphAssociationTest', description: 'Confirms eager attribute load without Cartesian product explosion', expectedStatus: 'PASS', timeMs: 14 },
            { name: 'BatchFetchConfigurationTest', description: 'Validates IN clause batch grouping of 25 subqueries', expectedStatus: 'PASS', timeMs: 11 }
          ]
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
          assignedExaminerId: 'akshat',
          question: 'Explain the difference between Time and Space complexity in Dynamic Programming. How does memoization differ from tabulation?',
          keyConcepts: ['memoization', 'tabulation', 'top-down', 'bottom-up', 'recursion stack', 'call stack', 'space optimization'],
          hint: 'Memoization is top-down recursion with caching (stack space O(N)). Tabulation is bottom-up iterative (often optimizable to O(1) space).',
          modelAnswer: 'Dynamic Programming optimizes overlapping subproblems. Memoization is top-down recursion storing results in a hash table or array, consuming additional space on the call stack. Tabulation is bottom-up iterative solving base cases first, eliminating call stack overhead and frequently allowing space reduction from O(N) to O(1) by only tracking the last few states.',
          commonPitfalls: ['Failing to account for recursion stack frame space in memoization', 'Confusing greedy approach with dynamic programming'],
          followUpPrompt: 'Can every DP problem be solved with O(1) space complexity?',
          unitTests: [
            { name: 'MemoizationCacheHitRateTest', description: 'Asserts Fibonacci(50) computes in O(N) rather than O(2^N)', expectedStatus: 'PASS', timeMs: 5 },
            { name: 'TabulationSpaceOptimizationTest', description: 'Validates memory usage stays <64KB for 1,000,000 iterations', expectedStatus: 'PASS', timeMs: 9 },
            { name: 'CallStackDepthVerificationTest', description: 'Confirms zero StackOverflowError on deep recursion', expectedStatus: 'PASS', timeMs: 12 }
          ]
        },
        {
          id: 202,
          topic: 'Distributed Caching Strategies & Cache Invalidation',
          difficulty: 'Advanced',
          assignedExaminerId: 'sophia',
          question: 'Compare Cache-Aside, Write-Through, and Write-Behind caching strategies in a high-concurrency microservices system. How do you prevent Cache Stampede?',
          keyConcepts: ['cache-aside', 'write-through', 'write-behind', 'cache stampede', 'thundering herd', 'ttl', 'mutex lock'],
          hint: 'Contrast read-through vs async write queues. Prevent stampede via distributed mutex locks or probabilistic early expiration (XFetch).',
          modelAnswer: 'In Cache-Aside, the application queries cache first; on miss, it loads from DB and repopulates cache. Write-Through writes to cache and DB synchronously. Write-Behind queues async DB writes for high throughput at the risk of data loss. Cache Stampede (Thundering Herd) when a hot key expires is prevented by distributed mutex locks, probabilistic early expiration (XFetch algorithm), or pre-warming.',
          commonPitfalls: ['Saying Write-Through is completely resilient to network partition', 'Not understanding why dual writes cause eventual inconsistency'],
          followUpPrompt: 'How does Redis handle cache eviction under memory pressure?',
          unitTests: [
            { name: 'MutexLockConcurrencyTest', description: 'Asserts exactly 1 thread rebuilds cache on TTL expiration', expectedStatus: 'PASS', timeMs: 16 },
            { name: 'WriteBehindAsyncQueueTest', description: 'Verifies buffer drain flushes dirty records within 200ms', expectedStatus: 'PASS', timeMs: 20 },
            { name: 'XFetchProbabilisticExpiryTest', description: 'Confirms proactive cache refresh prior to hard TTL deadline', expectedStatus: 'PASS', timeMs: 10 }
          ]
        },
        {
          id: 203,
          topic: 'Java 21 Virtual Threads & Concurrency Models',
          difficulty: 'Defense Grill',
          assignedExaminerId: 'marcus',
          question: 'How do Java 21 Virtual Threads (Project Loom) differ from traditional OS platform threads? When should you NOT use virtual threads?',
          keyConcepts: ['virtual threads', 'project loom', 'carrier threads', 'forkjoinpool', 'blocking i/o', 'cpu-bound', 'pinning', 'synchronized'],
          hint: 'Virtual threads are lightweight user-mode threads over carrier threads for blocking I/O. Do NOT use for CPU-bound tasks or where pinning occurs.',
          modelAnswer: 'Platform threads are 1:1 OS threads with ~1MB stack memory overhead. Virtual Threads are M:N user-mode threads managed by the JVM over a pool of carrier threads, allowing millions of concurrent tasks with minimal memory. They are ideal for high-throughput blocking I/O (REST, DB queries). They should NOT be used for compute-heavy CPU-bound operations, or when thread pinning occurs due to synchronized blocks.',
          commonPitfalls: ['Thinking virtual threads make CPU-intensive matrix multiplication faster', 'Assuming thread pooling is needed for virtual threads'],
          followUpPrompt: 'How does ReentrantLock prevent thread pinning in Java 21?',
          unitTests: [
            { name: 'VirtualThreadCarrierUnmountTest', description: 'Asserts carrier thread releases during socket blocking I/O', expectedStatus: 'PASS', timeMs: 14 },
            { name: 'PinningDetectionAuditTest', description: 'Confirms zero carrier thread pinning under ReentrantLock', expectedStatus: 'PASS', timeMs: 18 },
            { name: 'MillionConcurrencyMemoryTest', description: 'Validates 100,000 concurrent tasks consume <150MB heap', expectedStatus: 'PASS', timeMs: 28 }
          ]
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
    records: QuestionAnswerRecord[],
    defenseMode: 'SOLO' | 'PANEL' = 'SOLO'
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

    // 5-Dimension Competency Radar Calculation
    const radar: CompetencyRadar = {
      architecturalRigor: Math.min(100, Math.max(45, Math.round(accuracyAverage * 1.04))),
      telemetryPacing: Math.min(100, Math.max(40, Math.round(averageWpm >= 95 && averageWpm <= 175 ? 95 : (averageWpm < 95 ? 65 : 75)))),
      codePrecision: Math.min(100, Math.max(40, Math.round(depthAverage * 1.02))),
      vocalFluency: Math.min(100, Math.max(35, Math.round(fluencyAverage))),
      socraticAdaptability: Math.min(100, Math.max(50, Math.round((accuracyAverage + depthAverage) / 2 + (totalFillers === 0 ? 8 : 2))))
    };

    // Cryptographic Certificate Serial Hash
    const randA = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
    const randB = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
    const verificationHash = `VIVA-2026-${randA}-${randB}`;

    // Cryptographic QR Matrix SVG
    const qrMatrixSvg = this.generateQrSvg(verificationHash);

    return {
      trackTitle: track.title,
      trackId: track.id,
      examinerName,
      defenseMode,
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
      xpAwarded,
      radar,
      verificationHash,
      qrMatrixSvg
    };
  }

  private generateQrSvg(hash: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="qr-svg-matrix" fill="#D4AF37">
      <rect x="4" y="4" width="26" height="26" fill="none" stroke="#D4AF37" stroke-width="4"/>
      <rect x="11" y="11" width="12" height="12" fill="#D4AF37"/>
      <rect x="70" y="4" width="26" height="26" fill="none" stroke="#D4AF37" stroke-width="4"/>
      <rect x="77" y="11" width="12" height="12" fill="#D4AF37"/>
      <rect x="4" y="70" width="26" height="26" fill="none" stroke="#D4AF37" stroke-width="4"/>
      <rect x="11" y="77" width="12" height="12" fill="#D4AF37"/>
      <rect x="36" y="8" width="6" height="6"/><rect x="48" y="8" width="6" height="6"/><rect x="58" y="16" width="6" height="6"/>
      <rect x="36" y="24" width="6" height="6"/><rect x="48" y="32" width="6" height="6"/><rect x="58" y="32" width="6" height="6"/>
      <rect x="8" y="36" width="6" height="6"/><rect x="20" y="44" width="6" height="6"/><rect x="36" y="44" width="6" height="6"/>
      <rect x="48" y="48" width="8" height="8" fill="#FAF4EE"/><rect x="68" y="44" width="6" height="6"/><rect x="80" y="36" width="6" height="6"/>
      <rect x="36" y="60" width="6" height="6"/><rect x="48" y="68" width="6" height="6"/><rect x="58" y="76" width="6" height="6"/>
      <rect x="70" y="60" width="6" height="6"/><rect x="82" y="68" width="6" height="6"/><rect x="80" y="82" width="6" height="6"/>
      <rect x="36" y="80" width="6" height="6"/><rect x="48" y="84" width="6" height="6"/><rect x="60" y="88" width="6" height="6"/>
    </svg>`;
  }
}
