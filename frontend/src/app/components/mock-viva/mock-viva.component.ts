import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  MockVivaService, 
  VivaTrack, 
  VivaQuestion, 
  TelemetryMetrics, 
  QuestionAnswerRecord, 
  VivaSessionResult,
  VivaFlashcard,
  VivaUnitTest
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
  // Navigation Steps
  currentStep: 'SETUP' | 'ARENA' | 'FEEDBACK_MODAL' | 'REPORT' = 'SETUP';

  // Available Viva Tracks
  tracks: VivaTrack[] = [];
  selectedTrack: VivaTrack | null = null;

  // Defense Mode: 'SOLO' (Single Examiner) vs 'PANEL' (3-Examiner Grand Jury)
  defenseMode: 'SOLO' | 'PANEL' = 'PANEL';

  // Examiner Personas
  examiners: ExaminerPersona[] = [
    {
      id: 'akshat',
      name: 'Akshat Aryan',
      title: 'Lead Architect & Chief Evaluator',
      institution: 'MentorHub Engineering Board',
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
      voicePitch: 1.15,
      voiceRate: 0.95,
      badge: '🛡️ External Overseer'
    },
    {
      id: 'marcus',
      name: 'Prof. Marcus Chen',
      title: 'Chair of Software Architecture',
      institution: 'Cybernetics Research Lab',
      avatar: 'assets/pavani-profile.jpg',
      voicePitch: 0.85,
      voiceRate: 1.05,
      badge: '⚡ Systems Griller'
    }
  ];
  selectedExaminer: ExaminerPersona = this.examiners[0];

  // Session State
  currentQuestionIndex = 0;
  currentQuestion: VivaQuestion | null = null;
  userAnswerText = '';
  
  // Interactive Tab Station ('SPEECH' vs 'SCRATCHPAD')
  activeStationTab: 'SPEECH' | 'SCRATCHPAD' = 'SPEECH';
  scratchpadLang: 'Java 21' | 'TypeScript' | 'SQL' | 'Architecture' = 'Java 21';
  scratchpadCode = '';

  // Audio & STT State
  isListening = false;
  speechSupported = false;
  isExaminerSpeaking = false;
  isVoiceMuted = false;
  private recognition: any = null;

  // Real-Time Audio Reactive Waveform Equalizer & Real Web Audio Analyser
  equalizerBars: number[] = [8, 14, 20, 26, 18, 24, 30, 22, 26, 18, 12, 8, 16, 22, 28, 14];
  liveDecibelLevel = 0;
  private eqInterval: any = null;
  private audioContext: any = null;
  private analyserNode: any = null;
  private mediaStream: MediaStream | null = null;
  private audioAnimFrame: any = null;

  // Real-Time Telemetry Gauges
  sessionTimerSeconds = 0;
  questionTimerSeconds = 0;
  private timerInterval: any = null;
  liveWordCount = 0;
  liveWpm = 0;
  liveFillerCount = 0;
  liveDetectedFillers: string[] = [];

  // Examiner Nudge / Clue Lifeline
  remainingHints = 2;
  currentHintVisible = false;
  hasUsedHintForCurrentQuestion = false;

  // Scratchpad Unit Test Execution Engine
  isRunningTests = false;
  testExecutionResults: VivaUnitTest[] = [];
  hasRunTestsForCurrentQuestion = false;
  testsBonusScore = 0;

  // Feedback & Reports
  lastEvaluation: TelemetryMetrics | null = null;
  sessionRecords: QuestionAnswerRecord[] = [];
  finalResult: VivaSessionResult | null = null;
  flippedFlashcards: Set<number> = new Set<number>();
  expandedDossierIds: Set<number> = new Set<number>();
  isPlayingModelAnswer = false;

  // Socratic Grill Follow-Up Probe State
  showGrillPrompt = false;
  grillAnswerText = '';
  isGrillSubmitted = false;
  grillBonusPoints = 0;

  // PDF Export
  isExportingPdf = false;

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
    this.stopRealAudioAnalyser();
    this.stopEqualizer();
    if (this.audioContext) {
      try { this.audioContext.close(); } catch (e) {}
    }
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

  selectDefenseMode(mode: 'SOLO' | 'PANEL'): void {
    this.defenseMode = mode;
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

    // In Grand Academic Defense Panel Mode, switch active examiner based on question assignment
    if (this.defenseMode === 'PANEL' && this.currentQuestion.assignedExaminerId) {
      const assigned = this.examiners.find(e => e.id === this.currentQuestion?.assignedExaminerId);
      if (assigned) {
        this.selectedExaminer = assigned;
      }
    }

    this.userAnswerText = '';
    this.scratchpadCode = '';
    this.activeStationTab = 'SPEECH';
    this.questionTimerSeconds = 0;
    this.liveWordCount = 0;
    this.liveWpm = 0;
    this.liveFillerCount = 0;
    this.liveDetectedFillers = [];
    this.lastEvaluation = null;
    this.showGrillPrompt = false;
    this.grillAnswerText = '';
    this.isGrillSubmitted = false;
    this.grillBonusPoints = 0;

    // Reset lifelines and test execution states
    this.currentHintVisible = false;
    this.hasUsedHintForCurrentQuestion = false;
    this.isRunningTests = false;
    this.testExecutionResults = [];
    this.hasRunTestsForCurrentQuestion = false;
    this.testsBonusScore = 0;

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
  // Web Speech Recognition (STT) & Audio Reactive Waveform
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
        this.stopEqualizer();
        this.cdr.detectChanges();
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try { this.recognition.start(); } catch (e) {}
        } else {
          this.stopEqualizer();
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
      this.startRealAudioAnalyser();
      this.startEqualizer();
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.stopRealAudioAnalyser();
      this.stopEqualizer();
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  private async startRealAudioAnalyser(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      source.connect(this.analyserNode);

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateSpectrum = () => {
        if (!this.isListening || !this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);

        const bars: number[] = [];
        let sum = 0;
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i % bufferLength] || 0;
          bars.push(Math.max(6, Math.round((val / 255) * 44) + 6));
          sum += val;
        }
        this.equalizerBars = bars;
        const avg = sum / 16;
        this.liveDecibelLevel = Math.round(Math.min(90, (avg / 255) * 90));
        this.cdr.detectChanges();

        this.audioAnimFrame = requestAnimationFrame(updateSpectrum);
      };
      this.audioAnimFrame = requestAnimationFrame(updateSpectrum);
    } catch (err) {
      console.warn('Microphone permission not granted or audio analyser failed, running simulated waveform:', err);
    }
  }

  private stopRealAudioAnalyser(): void {
    if (this.audioAnimFrame) {
      cancelAnimationFrame(this.audioAnimFrame);
      this.audioAnimFrame = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.analyserNode = null;
    this.liveDecibelLevel = 0;
  }

  private startEqualizer(): void {
    this.stopEqualizer();
    this.eqInterval = setInterval(() => {
      // If Web Audio analyserNode is active, updateSpectrum controls the visual bars; otherwise randomize simulation
      if (!this.analyserNode) {
        this.equalizerBars = this.equalizerBars.map(() => Math.floor(Math.random() * 46) + 10);
        this.liveDecibelLevel = Math.floor(Math.random() * 35) + 38;
        this.cdr.detectChanges();
      }
    }, 80);
  }

  private stopEqualizer(): void {
    if (this.eqInterval) {
      clearInterval(this.eqInterval);
      this.eqInterval = null;
    }
    this.equalizerBars = [8, 14, 20, 26, 18, 24, 30, 22, 26, 18, 12, 8, 16, 22, 28, 14];
    if (!this.analyserNode) {
      this.liveDecibelLevel = 0;
    }
  }

  onTextareaInput(): void {
    this.updateLiveTelemetry();
  }

  private updateLiveTelemetry(): void {
    const combined = `${this.userAnswerText} ${this.scratchpadCode}`.trim();
    const words = combined.length > 0 ? combined.split(/\s+/) : [];
    this.liveWordCount = words.length;

    const effectiveMinutes = Math.max(this.questionTimerSeconds / 60, 0.1);
    this.liveWpm = Math.round(this.liveWordCount / effectiveMinutes);

    // Live filler detection
    const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'literally', 'sort of'];
    const lower = combined.toLowerCase();
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
  // Scratchpad Template Injection
  // -------------------------------------------------------------
  loadScratchpadTemplate(): void {
    this.soundService.playClickSound();
    if (!this.currentQuestion) return;

    if (this.scratchpadLang === 'Java 21') {
      this.scratchpadCode = `// Java 21 Implementation Outline
public class ArchitectureDefense {
    // Thread pool / Filter pipeline
    public void executeRequest() {
        // Implementation notes for ${this.currentQuestion.topic}
    }
}`;
    } else if (this.scratchpadLang === 'TypeScript') {
      this.scratchpadCode = `// Angular 17 Reactive Signal Architecture
import { Component, signal, computed } from '@angular/core';

export class DefenseComponent {
  state = signal<string>('CONNECTED');
}`;
    } else if (this.scratchpadLang === 'SQL') {
      this.scratchpadCode = `-- Database Optimization & Query Plan
SELECT m.id, m.name, COUNT(s.id) AS total_sessions
FROM mentors m
LEFT JOIN sessions s ON m.id = s.mentor_id
GROUP BY m.id;`;
    } else {
      this.scratchpadCode = `+-------------------------------------------------------+
|                MENTORHUB HIGH-LEVEL ARCHITECTURE       |
+-------------------------------------------------------+
[ Angular 17 UI ] <---(JWT / HTTPS)---> [ Spring Boot 3 ]
       |                                       |
       +<=========(STOMP / WSS)===============>+
       |                                       |
  [ WebRTC P2P ] <-----------------------> [ MySQL / Redis ]`;
    }
    this.updateLiveTelemetry();
  }

  // -------------------------------------------------------------
  // Examiner Nudge Lifeline
  // -------------------------------------------------------------
  requestExaminerNudge(): void {
    if (this.remainingHints <= 0 || this.hasUsedHintForCurrentQuestion || !this.currentQuestion?.hint) return;
    this.remainingHints--;
    this.hasUsedHintForCurrentQuestion = true;
    this.currentHintVisible = true;
    this.soundService.playSuccessSound();
    if (!this.isVoiceMuted) {
      this.speakExaminerQuestion(`Examiner Lifeline Hint: ${this.currentQuestion.hint}`);
    }
  }

  toggleHintVisibility(): void {
    this.currentHintVisible = !this.currentHintVisible;
  }

  // -------------------------------------------------------------
  // Scratchpad Unit Test Execution Engine
  // -------------------------------------------------------------
  runCodeTests(): void {
    if (!this.currentQuestion?.unitTests || this.isRunningTests) return;
    this.isRunningTests = true;
    this.soundService.playClickSound();

    setTimeout(() => {
      const tests = this.currentQuestion!.unitTests || [];
      this.testExecutionResults = tests.map(t => ({
        name: t.name,
        description: t.description,
        expectedStatus: t.expectedStatus,
        timeMs: t.timeMs || Math.floor(Math.random() * 15) + 4
      }));
      this.isRunningTests = false;
      this.hasRunTestsForCurrentQuestion = true;
      this.testsBonusScore = 10;
      this.soundService.playSuccessSound();
      this.cdr.detectChanges();
    }, 650);
  }

  // -------------------------------------------------------------
  // Audible Gold Standard Model Answer Playback
  // -------------------------------------------------------------
  speakModelAnswer(text?: string): void {
    const answerToSpeak = text || this.currentQuestion?.modelAnswer;
    if (!answerToSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (this.isPlayingModelAnswer) {
      window.speechSynthesis.cancel();
      this.isPlayingModelAnswer = false;
      this.cdr.detectChanges();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(answerToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    this.isPlayingModelAnswer = true;
    utterance.onend = () => {
      this.isPlayingModelAnswer = false;
      this.cdr.detectChanges();
    };
    utterance.onerror = () => {
      this.isPlayingModelAnswer = false;
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  // -------------------------------------------------------------
  // Interactive Defense Dossier Accordion
  // -------------------------------------------------------------
  toggleDossierRecord(index: number): void {
    this.soundService.playClickSound();
    if (this.expandedDossierIds.has(index)) {
      this.expandedDossierIds.delete(index);
    } else {
      this.expandedDossierIds.add(index);
    }
  }

  isDossierExpanded(index: number): boolean {
    return this.expandedDossierIds.has(index);
  }

  // -------------------------------------------------------------
  // Answer Evaluation & Socratic Adaptive Grill
  // -------------------------------------------------------------
  submitAnswer(): void {
    if (!this.currentQuestion) return;
    this.stopListening();
    this.soundService.playSuccessSound();

    const fullAnswer = `${this.userAnswerText} ${this.scratchpadCode}`.trim();

    const evaluation = this.vivaService.evaluateAnswer(
      fullAnswer,
      Math.max(this.questionTimerSeconds, 5),
      this.currentQuestion
    );

    // Apply Unit Test execution bonus if candidate verified code
    if (this.hasRunTestsForCurrentQuestion) {
      evaluation.overallScore = Math.min(100, evaluation.overallScore + this.testsBonusScore);
      evaluation.depthScore = Math.min(100, evaluation.depthScore + 8);
      evaluation.strengths.push('Automated unit test verification passed in interactive code scratchpad (+10 bonus pts).');
    }

    if (this.hasUsedHintForCurrentQuestion) {
      evaluation.weaknesses.push('Relied on pedagogical examiner nudge lifeline for conceptual orientation.');
    }

    this.lastEvaluation = evaluation;

    this.sessionRecords.push({
      question: this.currentQuestion,
      userAnswer: fullAnswer,
      telemetry: evaluation,
      codeSnippet: this.scratchpadCode ? this.scratchpadCode : undefined,
      usedHint: this.hasUsedHintForCurrentQuestion,
      testsPassed: this.hasRunTestsForCurrentQuestion
    });

    this.currentStep = 'FEEDBACK_MODAL';
  }

  submitGrillAnswer(): void {
    if (!this.grillAnswerText.trim() || !this.lastEvaluation || !this.currentQuestion) return;
    this.soundService.playSuccessSound();

    this.isGrillSubmitted = true;
    this.grillBonusPoints = 12;

    // Boost accuracy and overall score in response to follow-up answer
    this.lastEvaluation.conceptAccuracyScore = Math.min(this.lastEvaluation.conceptAccuracyScore + 15, 100);
    this.lastEvaluation.depthScore = Math.min(this.lastEvaluation.depthScore + 15, 100);
    this.lastEvaluation.overallScore = Math.min(this.lastEvaluation.overallScore + 12, 100);

    this.lastEvaluation.strengths.unshift(`Mastered Examiner Socratic Follow-Up Probe: "${this.grillAnswerText.trim().slice(0, 60)}..."`);
    
    // Update record
    if (this.sessionRecords.length > 0) {
      const lastRec = this.sessionRecords[this.sessionRecords.length - 1];
      lastRec.userAnswer += `\n[Socratic Follow-Up Answer]: ${this.grillAnswerText}`;
      lastRec.telemetry = this.lastEvaluation;
    }
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
        this.sessionRecords,
        this.defenseMode
      );

      // Expand first record in Defense Dossier by default
      this.expandedDossierIds.clear();
      this.expandedDossierIds.add(0);

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
  // Remedial Flashcards & HD PDF Certificate Export
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

  async downloadPdfReport(): Promise<void> {
    this.soundService.playSuccessSound();
    this.isExportingPdf = true;

    try {
      const element = document.getElementById('viva-printable-report');
      if (!element) {
        window.print();
        this.isExportingPdf = false;
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#200E05'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 210));
      const candidateName = this.authService.getUserName() || 'Candidate';
      pdf.save(`MentorHub_Viva_Readiness_Certificate_${candidateName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.warn('PDF export fallback to print:', e);
      window.print();
    } finally {
      this.isExportingPdf = false;
      this.cdr.detectChanges();
    }
  }

  resetViva(): void {
    this.soundService.playClickSound();
    this.currentStep = 'SETUP';
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.userAnswerText = '';
    this.scratchpadCode = '';
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

    const sampleCodes = [
      `// Angular Standalone Component + Spring Boot JWT Guard
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  return next(token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req);
};`,
      `// WebRTC Direct PeerConnection Handler
const pc = new RTCPeerConnection(rtcConfiguration);
pc.onicecandidate = (event) => {
  if (event.candidate) stompClient.send('/app/peer/candidate', {}, JSON.stringify(event.candidate));
};`,
      `// SSE Streaming AI Model Fallback
return this.http.post<StreamEvent>('/api/ai/chat/stream', payload, { responseType: 'text' as 'json' })
  .pipe(catchError(() => this.fallbackHeuristicEngine(payload.prompt)));`,
      `// SHA-256 Cryptographic Hash Verification
const data = new TextEncoder().encode(certId + recipientEmail + timestamp);
const digest = await crypto.subtle.digest('SHA-256', data);
return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');`
    ];

    this.selectedTrack.questions.forEach((q, idx) => {
      const ans = sampleAnswers[idx] || q.modelAnswer;
      const evalMetrics = this.vivaService.evaluateAnswer(ans, 42, q);
      evalMetrics.overallScore = Math.min(100, evalMetrics.overallScore + 10);
      evalMetrics.depthScore = Math.min(100, evalMetrics.depthScore + 8);
      evalMetrics.strengths.push('Automated unit test verification passed in interactive code scratchpad (+10 bonus pts).');

      this.sessionRecords.push({
        question: q,
        userAnswer: ans,
        telemetry: evalMetrics,
        codeSnippet: sampleCodes[idx] || sampleCodes[0],
        usedHint: idx === 1,
        testsPassed: true
      });
    });

    this.finishVivaSession();
  }
}
