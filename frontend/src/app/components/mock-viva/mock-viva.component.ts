import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { 
  MockVivaService, 
  VivaTrack, 
  VivaQuestion, 
  TelemetryMetrics, 
  QuestionAnswerRecord, 
  VivaSessionResult,
  VivaFlashcard
} from '../../services/mock-viva.service';
import { SoundService } from '../../services/sound.service';
import { AuthService } from '../../services/auth.service';

export interface ExaminerPersona {
  id: string;
  name: string;
  title: string;
  institution: string;
  avatar: string;
  voicePitch: number;
  voiceRate: number;
  badge: string;
}

@Component({
  selector: 'app-mock-viva',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './mock-viva.component.html',
  styleUrls: ['./mock-viva.component.scss']
})
export class MockVivaComponent implements OnInit, OnDestroy {
  // Screen States: 'SETUP' | 'ARENA' | 'FEEDBACK_MODAL' | 'REPORT'
  currentStep: 'SETUP' | 'ARENA' | 'FEEDBACK_MODAL' | 'REPORT' = 'SETUP';

  tracks: VivaTrack[] = [];
  selectedTrack: VivaTrack | null = null;

  examiners: ExaminerPersona[] = [
    {
      id: 'akshat',
      name: 'Akshat Aryan',
      title: 'Principal AI & Systems Lead',
      institution: 'MentorHub Examination Board',
      avatar: 'assets/akshat-profile.jpg',
      voicePitch: 1.0,
      voiceRate: 1.0,
      badge: '👑 Lead Examiner'
    },
    {
      id: 'sophia',
      name: 'Dr. Sophia Vance',
      title: 'Professor of Distributed Computing',
      institution: 'Imperial Tech Faculty',
      avatar: 'assets/vanaja-profile.jpg',
      voicePitch: 1.1,
      voiceRate: 0.95,
      badge: '🛡️ External Overseer'
    },
    {
      id: 'marcus',
      name: 'Prof. Marcus Chen',
      title: 'Chair of Software Architecture',
      institution: 'Cybernetics Research Lab',
      avatar: 'assets/pavani-profile.jpg',
      voicePitch: 0.95,
      voiceRate: 1.05,
      badge: '⚡ Systems Griller'
    }
  ];
  selectedExaminer: ExaminerPersona = this.examiners[0];

  // Session State
  currentQuestionIndex = 0;
  currentQuestion: VivaQuestion | null = null;
  userAnswerText = '';
  
  // Audio & STT State
  isListening = false;
  speechSupported = false;
  isExaminerSpeaking = false;
  isVoiceMuted = false;
  private recognition: any = null;

  // Real-Time Telemetry Gauges
  sessionTimerSeconds = 0;
  questionTimerSeconds = 0;
  private timerInterval: any = null;
  liveWordCount = 0;
  liveWpm = 0;
  liveFillerCount = 0;
  liveDetectedFillers: string[] = [];

  // Feedback & Reports
  lastEvaluation: TelemetryMetrics | null = null;
  sessionRecords: QuestionAnswerRecord[] = [];
  finalResult: VivaSessionResult | null = null;
  flippedFlashcards: Set<number> = new Set<number>();

  constructor(
    private vivaService: MockVivaService,
    private soundService: SoundService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tracks = this.vivaService.getTracks();
    this.selectedTrack = this.tracks[0];
    this.initSpeechRecognition();

    this.route.queryParams.subscribe(params => {
      if (params['step'] === 'arena') {
        this.startVivaSession();
      } else if (params['step'] === 'report') {
        this.simulateCompletedDefense();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopListening();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // -------------------------------------------------------------
  // Setup & Track Selection
  // -------------------------------------------------------------
  selectTrack(track: VivaTrack): void {
    this.selectedTrack = track;
    this.soundService.playClickSound();
  }

  selectExaminer(examiner: ExaminerPersona): void {
    this.selectedExaminer = examiner;
    this.soundService.playClickSound();
  }

  startVivaSession(): void {
    if (!this.selectedTrack) return;
    this.soundService.playSuccessSound();
    this.currentStep = 'ARENA';
    this.currentQuestionIndex = 0;
    this.sessionRecords = [];
    this.sessionTimerSeconds = 0;
    this.loadQuestion(0);
    this.startTimer();
  }

  // -------------------------------------------------------------
  // Live Arena & Question Handling
  // -------------------------------------------------------------
  loadQuestion(index: number): void {
    if (!this.selectedTrack || index >= this.selectedTrack.questions.length) {
      this.finishVivaSession();
      return;
    }
    this.currentQuestionIndex = index;
    this.currentQuestion = this.selectedTrack.questions[index];
    this.userAnswerText = '';
    this.questionTimerSeconds = 0;
    this.liveWordCount = 0;
    this.liveWpm = 0;
    this.liveFillerCount = 0;
    this.liveDetectedFillers = [];
    this.lastEvaluation = null;

    if (!this.isVoiceMuted) {
      this.speakExaminerQuestion(this.currentQuestion.question);
    }
  }

  speakExaminerQuestion(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.selectedExaminer.voiceRate || 1.0;
    utterance.pitch = this.selectedExaminer.voicePitch || 1.0;
    
    // Choose professional voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.isExaminerSpeaking = true;
    utterance.onend = () => {
      this.isExaminerSpeaking = false;
      this.cdr.detectChanges();
    };
    utterance.onerror = () => {
      this.isExaminerSpeaking = false;
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  toggleVoiceMute(): void {
    this.isVoiceMuted = !this.isVoiceMuted;
    if (this.isVoiceMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isExaminerSpeaking = false;
    } else if (!this.isVoiceMuted && this.currentQuestion) {
      this.speakExaminerQuestion(this.currentQuestion.question);
    }
  }

  // -------------------------------------------------------------
  // Web Speech Recognition (STT)
  // -------------------------------------------------------------
  private initSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          this.userAnswerText = (this.userAnswerText + ' ' + finalTranscript).trim();
        }
        this.updateLiveTelemetry();
        this.cdr.detectChanges();
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        this.cdr.detectChanges();
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try { this.recognition.start(); } catch (e) {}
        }
      };
    }
  }

  toggleListening(): void {
    if (!this.speechSupported) return;
    this.soundService.playClickSound();

    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    if (!this.recognition) return;
    try {
      this.isListening = true;
      this.recognition.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  onTextareaInput(): void {
    this.updateLiveTelemetry();
  }

  private updateLiveTelemetry(): void {
    const clean = (this.userAnswerText || '').trim();
    const words = clean.length > 0 ? clean.split(/\s+/) : [];
    this.liveWordCount = words.length;

    const effectiveMinutes = Math.max(this.questionTimerSeconds / 60, 0.1);
    this.liveWpm = Math.round(this.liveWordCount / effectiveMinutes);

    // Live filler detection
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'literally'];
    const lower = clean.toLowerCase();
    let count = 0;
    const detected: string[] = [];

    for (const f of fillers) {
      const matches = lower.match(new RegExp(`\\b${f}\\b`, 'gi'));
      if (matches && matches.length > 0) {
        count += matches.length;
        detected.push(f);
      }
    }
    this.liveFillerCount = count;
    this.liveDetectedFillers = detected;
  }

  // -------------------------------------------------------------
  // Live Timer
  // -------------------------------------------------------------
  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.sessionTimerSeconds++;
      this.questionTimerSeconds++;
      if (this.questionTimerSeconds % 2 === 0) {
        this.updateLiveTelemetry();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // -------------------------------------------------------------
  // Answer Evaluation & Progress
  // -------------------------------------------------------------
  submitAnswer(): void {
    if (!this.currentQuestion) return;
    this.stopListening();
    this.soundService.playSuccessSound();

    const evaluation = this.vivaService.evaluateAnswer(
      this.userAnswerText,
      Math.max(this.questionTimerSeconds, 5),
      this.currentQuestion
    );
    this.lastEvaluation = evaluation;

    this.sessionRecords.push({
      question: this.currentQuestion,
      userAnswer: this.userAnswerText,
      telemetry: evaluation
    });

    this.currentStep = 'FEEDBACK_MODAL';
  }

  proceedToNextQuestion(): void {
    this.soundService.playClickSound();
    const nextIndex = this.currentQuestionIndex + 1;
    if (this.selectedTrack && nextIndex < this.selectedTrack.questions.length) {
      this.currentStep = 'ARENA';
      this.loadQuestion(nextIndex);
    } else {
      this.finishVivaSession();
    }
  }

  finishVivaSession(): void {
    this.stopTimer();
    this.stopListening();
    this.soundService.playSuccessSound();

    if (this.selectedTrack) {
      this.finalResult = this.vivaService.compileSessionResult(
        this.selectedTrack,
        this.selectedExaminer.name,
        this.sessionRecords
      );

      // Award XP to user profile and persist
      this.awardXpPoints(this.finalResult.xpAwarded);
    }
    this.currentStep = 'REPORT';
  }

  private awardXpPoints(xp: number): void {
    if (typeof localStorage !== 'undefined') {
      const userObjStr = localStorage.getItem('userObject');
      if (userObjStr) {
        try {
          const user = JSON.parse(userObjStr);
          user.xpPoints = (user.xpPoints || 4890) + xp;
          localStorage.setItem('userObject', JSON.stringify(user));
        } catch (e) {}
      }
    }
  }

  // -------------------------------------------------------------
  // Remedial Flashcards & Print
  // -------------------------------------------------------------
  toggleFlashcardFlip(cardId: number): void {
    this.soundService.playClickSound();
    if (this.flippedFlashcards.has(cardId)) {
      this.flippedFlashcards.delete(cardId);
    } else {
      this.flippedFlashcards.add(cardId);
    }
  }

  isFlashcardFlipped(cardId: number): boolean {
    return this.flippedFlashcards.has(cardId);
  }

  printDiagnosticReport(): void {
    this.soundService.playClickSound();
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  resetViva(): void {
    this.soundService.playClickSound();
    this.currentStep = 'SETUP';
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.userAnswerText = '';
    this.sessionRecords = [];
    this.finalResult = null;
    this.flippedFlashcards.clear();
  }

  simulateCompletedDefense(): void {
    if (!this.selectedTrack) return;
    this.sessionRecords = [];
    
    const sampleAnswers = [
      'MentorHub utilizes a decoupled client-server architecture with an Angular 17 Standalone frontend and a Spring Boot 3 REST API secured by JWT bearer tokens. Duplex STOMP over WebSockets handles live collaborative events, signaling, and presence synchronization.',
      'WebRTC establishes peer-to-peer audio and video streaming directly between mentor and mentee. Spring Boot acts as the signaling channel exchanging SDP offers, answers, and ICE candidate coordinates negotiated via STUN/TURN servers.',
      'AI queries are routed by the AiModelRouterService which communicates with Google Gemini models. It uses Server-Sent Events for live streaming and implements graceful degradation with local heuristic fallbacks if quota is exceeded.',
      'Certificate authenticity is enforced using SHA-256 cryptographic hashing calculated from the recipient, mentor credentials, and completion timestamp. The public route /verify-certificate/:id recalculates the hash to guarantee tamper-proof validation.'
    ];

    this.selectedTrack.questions.forEach((q, idx) => {
      const ans = sampleAnswers[idx] || q.modelAnswer;
      const evalMetrics = this.vivaService.evaluateAnswer(ans, 42, q);
      this.sessionRecords.push({
        question: q,
        userAnswer: ans,
        telemetry: evalMetrics
      });
    });

    this.finishVivaSession();
  }
}
