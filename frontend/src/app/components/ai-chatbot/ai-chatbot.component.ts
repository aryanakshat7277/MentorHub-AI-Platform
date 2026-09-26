import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiChatService, ChatMessage } from '../../services/ai-chat.service';
import { GeminiLiveService, LiveSessionStatus } from '../../services/gemini-live.service';
import { AudioCaptureService } from '../../services/audio-capture.service';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { AiModelRouterService } from '../../services/ai-model-router.service';
import { AppScreenReaderService, ScreenCaptureResult } from '../../services/app-screen-reader.service';
import { VoiceCoordinatorService } from '../../services/voice-coordinator.service';
import { AiTutorService, TutorSessionRequest } from '../../services/ai-tutor.service';
import { SystemAgentService, ActionPlan, AgentAction, ExecutionResult, PrioritizedModel } from '../../services/system-agent.service';

export interface LiveChatMessage extends ChatMessage {
  avatar?: string;
  isCopied?: boolean;
  reaction?: 'like' | 'dislike' | null;
  mode?: 'TEXT' | 'VOICE';
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.scss']
})
export class AiChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() isOpen = false;
  @Output() closeChatbot = new EventEmitter<void>();
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  isMaximized = false;
  selectedProvider = 'GEMINI';
  selectedModel = 'gemini-3.1-flash-lite';

  userInput = '';
  isGenerating = false;
  toastMessage: string | null = null;
  private shouldScrollToBottom = true;

  // Multimodal Screen Reader State (Gemini 3.1 Flash-Lite)
  attachedScreenSnapshot: ScreenCaptureResult | null = null;
  isCapturingScreen = false;
  isScreenPerceptionActive = true;
  isExternalScreenActive = false;
  private externalScreenSub: Subscription | null = null;

  // Voice Question STT State (Speech to Text for Screen Q&A)
  isListeningForVoice = false;
  voiceTranscript = '';
  private speechRecognition: any = null;

  // Live Voice State
  liveStatus: LiveSessionStatus = 'IDLE';
  isLiveVoiceActive = false;

  // Unified Single Professional Voice Persona (Executive - Kore)
  readonly professionalVoiceName = 'Executive (Kore)';
  readonly currentLiveVoice = 'Kore';

  Math = Math;
  // Audio-reactive visualizer volume (0..1)
  userVolumeRms = 0;
  aiVolumeRms = 0;
  isSpeakingAudio = false;

  private liveStatusSub: Subscription | null = null;
  private transcriptSub: Subscription | null = null;
  private userRmsSub: Subscription | null = null;
  private aiRmsSub: Subscription | null = null;
  private speakingSub: Subscription | null = null;
  private textChatSub: Subscription | null = null;
  private voiceQuerySub: Subscription | null = null;
  private tutorSub: Subscription | null = null;
  private activeScreenAiMessage: LiveChatMessage | null = null;
  private liveVoiceScreenFallbackTimer: any = null;
  // Autonomous Operating System & Browser Agent State
  pendingActionPlan: ActionPlan | null = null;
  isExecutingPlan: boolean = false;
  executedPlanResult: ExecutionResult | null = null;
  showModelsModal: boolean = false;
  prioritizedModels: PrioritizedModel[] = [];

  quickPrompts: { label: string; prompt: string; icon: string }[] = [
    { icon: '🌐', label: 'Open Google', prompt: 'Open browser and navigate to https://www.google.com' },
    { icon: '💻', label: 'Calculator', prompt: 'Launch Windows Calculator application' },
    { icon: '📝', label: 'Notepad', prompt: 'Open Notepad editor on my system' },
    { icon: '📁', label: 'File Explorer', prompt: 'Open Windows File Explorer' },
    { icon: '⚡', label: 'System Date', prompt: 'Run command: Get-Date' },
    { icon: '🖥️', label: 'External Screen', prompt: 'Look at my active screen outside this app and explain what is open and what errors or code you see.' },
    { icon: '👁️', label: 'Explain Screen', prompt: 'Look at my current screen and explain what is displayed and what actions I should take.' },
    { icon: '📸', label: 'Analyze Screen', prompt: 'Read my active screen carefully and provide key insights or recommendations.' },
    { icon: '💻', label: 'Code Workspace', prompt: 'Inspect the code and compiler terminal on my screen and diagnose any issues.' },
    { icon: '🎓', label: 'CUTM Courses', prompt: 'Summarize the core engineering curriculum and courses visible on my screen.' }
  ];

  messages: LiveChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'ai',
      avatar: 'AI',
      text: '👋 **Hi! How can I help you today?**\nI am powered by **Gemini 3.1 Flash-Lite** with **Multimodal Screen Vision** and **Voice Intelligence**.\n\nAsk me anything in **voice** (tap 🎙️) or **text** about your current screen, code, or courses! You can also click **🖥️ LINK SCREEN** to let me read outside apps like VS Code or your desktop.',
      provider: 'GEMINI',
      model: 'gemini-3.1-flash-lite',
      mode: 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  async sendQuickPrompt(prompt: string) {
    if (prompt.includes('Screen') || prompt.includes('screen') || prompt.includes('outside')) {
      if (prompt.includes('outside') && !this.isExternalScreenActive) {
        await this.screenReader.startExternalScreenCapture();
      }
      if (!this.attachedScreenSnapshot) {
        await this.captureScreenSnapshot();
      }
    }
    this.userInput = prompt;
    this.sendMessage();
  }

  startAcademicTutorSession(req: TutorSessionRequest) {
    const prompt = `🎓 [CENTURION ACADEMIC TUTORING SESSION]
Course: ${req.courseCode} - ${req.courseTitle}
Module ${req.moduleNumber}: ${req.moduleTitle}
Instructor: ${req.faculty || 'Centurion Professor'}

Curriculum Topics to Master:
${req.topics}
${req.practicalLabWork ? '\nPractical Lab Objective: ' + req.practicalLabWork : ''}
${req.vivaQuestions ? '\nKey Examination Query: ' + req.vivaQuestions : ''}

Please act as my Centurion University Academic Mentor and tutor me on this module:
1. Provide an intuitive, real-world engineering analogy for why these concepts matter before diving into formulas.
2. Break down the core mechanisms step-by-step in clear, high-yield terms.
3. Conclude with a quick 1-question interactive comprehension check to verify if I grasped the intuition!`;

    this.userInput = prompt;
    this.sendMessage();
  }

  constructor(
    private aiChatService: AiChatService,
    public modelRouter: AiModelRouterService,
    public liveService: GeminiLiveService,
    public audioCapture: AudioCaptureService,
    public audioPlayback: AudioPlaybackService,
    public voiceCoordinator: VoiceCoordinatorService,
    public screenReader: AppScreenReaderService,
    public aiTutorService: AiTutorService,
    public systemAgent: SystemAgentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load 6-tier prioritized models table
    this.systemAgent.getPrioritizedModels().subscribe({
      next: (models) => { this.prioritizedModels = models; },
      error: (err) => console.warn('Could not load prioritized models:', err)
    });

    // Subscribe to CUTM Course AI Tutoring requests
    this.tutorSub = this.aiTutorService.tutorRequest$.subscribe((req: TutorSessionRequest) => {
      this.startAcademicTutorSession(req);
    });

    // Register preemption callback so if Gemini Live or Mock Viva speaks, chatbot TTS shuts down immediately
    this.voiceCoordinator.registerPreemptHandler('chatbot-tts', () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.isSpeakingAudio = false;
      this.cdr.detectChanges();
    });

    // Subscribe to Gemini Live status & transcripts
    this.liveStatusSub = this.liveService.status$.subscribe(status => {
      this.liveStatus = status;
      this.isLiveVoiceActive = status !== 'IDLE' && status !== 'ENDED';
      this.scrollToBottom();
    });

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      // Pre-warm voices
      window.speechSynthesis.getVoices();
    }

    this.transcriptSub = this.liveService.transcriptEvent$.subscribe(event => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (event.role === 'user') {
        // If a system control plan is pending authorization, check for spoken confirmation or denial
        if (this.pendingActionPlan) {
          const authWords = /\b(authorize|yes|proceed|confirm|allow|do it|okay|sure|execute|go ahead)\b/i;
          const denyWords = /\b(cancel|deny|no|stop|abort|reject|don't)\b/i;
          if (authWords.test(event.text)) {
            this.authorizeAndExecutePlan(true);
            return;
          } else if (denyWords.test(event.text)) {
            this.denyPlan(true);
            return;
          }
        }

        // Check if spoken command requires Operating System or Browser control
        if (this.systemAgent.isControlIntent(event.text)) {
          this.handleLiveVoiceControlTask(event.text);
          return;
        }

        if (this.liveService.isScreenReadingIntent(event.text)) {
          this.handleLiveVoiceScreenQuery(event.text);
          return;
        }

        this.messages.push({
          id: 'msg-' + Date.now(),
          sender: 'user',
          avatar: 'U',
          text: event.text,
          mode: 'VOICE',
          timestamp: timeStr
        });
      } else if (event.role === 'assistant') {
        if (this.activeScreenAiMessage) {
          // Gemini 3.1 Flash-Lite analysis card is already in place; clear reference
          this.activeScreenAiMessage = null;
        } else {
          this.messages.push({
            id: 'msg-' + Date.now(),
            sender: 'ai',
            avatar: 'AI',
            text: event.text,
            provider: 'GEMINI',
            model: 'gemini-3.1-flash-live-preview',
            mode: 'VOICE',
            timestamp: timeStr
          });
        }
      }
      this.scrollToBottom();
    });

    // Subscribe to Web Audio RMS levels for dynamic audio-reactive waveform visualizer
    this.userRmsSub = this.audioCapture.volumeRms$.subscribe(rms => {
      this.userVolumeRms = rms;
      if (this.isLiveVoiceActive) {
        this.cdr.markForCheck();
      }
    });

    this.aiRmsSub = this.audioPlayback.outputVolumeRms$.subscribe(rms => {
      this.aiVolumeRms = rms;
      if (this.isLiveVoiceActive) {
        this.cdr.markForCheck();
      }
    });

    this.speakingSub = this.audioPlayback.isSpeaking$.subscribe(speaking => {
      this.isSpeakingAudio = speaking;
      this.cdr.markForCheck();
    });

    this.externalScreenSub = this.screenReader.isExternalScreenActive$.subscribe(active => {
      this.isExternalScreenActive = active;
      this.cdr.markForCheck();
    });
  }

  getUserAvatarUrl(): string {
    const name = (typeof localStorage !== 'undefined' ? localStorage.getItem('userName') : '') || 'AKSHAT ARYAN';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return (typeof localStorage !== 'undefined' ? localStorage.getItem('userAvatar') : null) || 'assets/akshat-profile.jpg';
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottomImmediate();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.endLiveVoice();
    this.voiceCoordinator.unregisterPreemptHandler('chatbot-tts');
    if (this.liveStatusSub) this.liveStatusSub.unsubscribe();
    if (this.transcriptSub) this.transcriptSub.unsubscribe();
    if (this.userRmsSub) this.userRmsSub.unsubscribe();
    if (this.aiRmsSub) this.aiRmsSub.unsubscribe();
    if (this.speakingSub) this.speakingSub.unsubscribe();
    if (this.externalScreenSub) this.externalScreenSub.unsubscribe();
    if (this.textChatSub) this.textChatSub.unsubscribe();
    if (this.voiceQuerySub) this.voiceQuerySub.unsubscribe();
    if (this.tutorSub) this.tutorSub.unsubscribe();
    if (this.liveVoiceScreenFallbackTimer) {
      clearTimeout(this.liveVoiceScreenFallbackTimer);
      this.liveVoiceScreenFallbackTimer = null;
    }
  }

  scrollToBottom() {
    this.shouldScrollToBottom = true;
  }

  private scrollToBottomImmediate() {
    try {
      if (this.chatContainer && this.chatContainer.nativeElement) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }

  toggleMaximize() {
    this.isMaximized = !this.isMaximized;
  }

  toggleAiEngine() {
    if (this.selectedProvider === 'GEMINI') {
      this.selectedProvider = 'GROQ';
      this.selectedModel = this.modelRouter.config.groqModel;
      this.showToast('⚡ High-Speed Engine: Groq Cloud (Ultra-Fast ~1s)');
    } else {
      this.selectedProvider = 'GEMINI';
      this.selectedModel = this.modelRouter.config.textModel;
      this.showToast('✨ Auto Engine: Gemini Multimodal Vision + Groq Failover');
    }
  }

  toggleScreenPerception() {
    this.isScreenPerceptionActive = this.screenReader.toggleScreenPerception();
    this.showToast(this.isScreenPerceptionActive ? '👁️ Screen Perception: Active' : '🚫 Screen Perception: Paused');
  }

  async toggleExternalScreen() {
    if (this.isExternalScreenActive) {
      this.screenReader.stopExternalScreenCapture();
      this.showToast('🖥️ External screen disconnected');
    } else {
      this.showToast('🖥️ Select your window or screen to share with Gemini...');
      const granted = await this.screenReader.startExternalScreenCapture();
      if (granted) {
        this.showToast('🟢 External Screen Linked! Gemini 3.1 Flash-Lite can now read outside apps.');
        await this.captureScreenSnapshot();
      } else {
        this.showToast('⚠️ Screen sharing was cancelled or unavailable.');
      }
    }
    this.cdr.detectChanges();
  }

  async captureScreenSnapshot() {
    this.isCapturingScreen = true;
    this.showToast('📸 Capturing screen snapshot...');
    try {
      const capture = await this.screenReader.captureScreen();
      if (capture && capture.dataUrl && capture.imageBase64 && capture.imageBase64.length > 100) {
        this.attachedScreenSnapshot = capture;
        this.showToast('🖼️ Screen snapshot attached');
        // If live voice is active, forward the visual frame to Gemini Live WebSocket
        if (this.isLiveVoiceActive) {
          this.liveService.sendScreenFrame(capture.imageBase64);
        }
      } else if (capture && capture.semanticContext) {
        this.showToast('ℹ️ Active screen context attached');
      }
    } catch (e) {
      this.showToast('⚠️ Screen scan failed');
    } finally {
      this.isCapturingScreen = false;
      this.cdr.detectChanges();
    }
  }

  removeAttachedScreen() {
    this.attachedScreenSnapshot = null;
    this.showToast('Attachment removed');
  }

  // ========================================================
  // Voice Input Recognition for Screen Questions (STT)
  // Powered by Gemini 3.1 Flash-Lite
  // ========================================================
  toggleVoiceInput() {
    if (this.isListeningForVoice) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  startVoiceInput() {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.showToast('⚠️ Speech recognition not supported in this browser.');
      return;
    }

    try {
      this.voiceCoordinator.stopAllVoices();
      this.speechRecognition = new SpeechRec();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';

      this.isListeningForVoice = true;
      this.voiceTranscript = '';
      this.showToast('🎙️ Listening... Ask your question about the screen now!');

      this.speechRecognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.userInput = transcript;
        this.voiceTranscript = transcript;
        this.cdr.detectChanges();
      };

      this.speechRecognition.onerror = (err: any) => {
        console.warn('Voice STT error:', err);
        this.isListeningForVoice = false;
        this.cdr.detectChanges();
      };

      this.speechRecognition.onend = () => {
        this.isListeningForVoice = false;
        this.cdr.detectChanges();
        if (this.userInput && this.userInput.trim().length > 0) {
          const spokeQuery = this.userInput.trim();
          this.userInput = '';
          this.submitScreenQuery(spokeQuery, true);
        }
      };

      this.speechRecognition.start();
    } catch (e) {
      console.warn('Unable to start voice input:', e);
      this.isListeningForVoice = false;
      this.cdr.detectChanges();
    }
  }

  stopVoiceInput() {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {}
    }
    this.isListeningForVoice = false;
    this.cdr.detectChanges();
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingAudio = false;
    this.voiceCoordinator.releaseVoice('chatbot-tts');
    this.cdr.detectChanges();
  }

  /**
   * Submits a question about the screen to Gemini 3.1 Flash-Lite
   * Reads visual snapshot + semantic context and optionally speaks back response.
   */
  async submitScreenQuery(query: string, isVoice: boolean = false) {
    if (!query || !query.trim() || this.isGenerating) return;

    this.voiceCoordinator.stopAllVoices();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      avatar: 'U',
      text: query,
      mode: isVoice ? 'VOICE' : 'TEXT',
      timestamp: timeStr
    });

    this.userInput = '';
    this.voiceTranscript = '';
    this.isGenerating = true;
    this.scrollToBottom();

    // Auto prompt external screen capture if user is asking about windows/desktop outside project
    const wantsExternal = /\b(outside|desktop|external|vs code|vscode|other window|another app|other tab|entire screen|my computer)\b/i.test(query);
    if (wantsExternal && !this.isExternalScreenActive) {
      this.showToast('🖥️ Requesting permission to read your external screen/window...');
      const granted = await this.screenReader.startExternalScreenCapture();
      if (!granted) {
        this.showToast('⚠️ External screen permission needed to view outside windows.');
      }
    }

    // Auto capture freshest screen view (always capture fresh frame if external screen is active for follow-up turns)
    if (this.isExternalScreenActive || !this.attachedScreenSnapshot) {
      this.isCapturingScreen = true;
      try {
        this.attachedScreenSnapshot = await this.screenReader.captureScreen();
      } catch (e) {
        console.warn('Auto screen capture exception:', e);
      } finally {
        this.isCapturingScreen = false;
      }
    }

    const screenImg = this.attachedScreenSnapshot ? this.attachedScreenSnapshot.imageBase64 : undefined;
    let screenCtx = this.attachedScreenSnapshot ? this.attachedScreenSnapshot.semanticContext : undefined;

    if (this.isExternalScreenActive) {
      screenCtx = `[EXTERNAL SCREEN ACTIVE] Visual feed captured from external OS window/desktop/application outside MentorHub. User is asking a direct or follow-up question regarding their external screen.\n` + (screenCtx || '');
    } else if (!screenCtx) {
      const route = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      screenCtx = this.screenReader.extractSemanticContext(route);
    }

    this.attachedScreenSnapshot = null;
    const historyPayload = this.buildHistoryPayload();

    const aiMessageId = 'msg-' + Date.now();
    const aiMessage: LiveChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      avatar: 'AI',
      text: '',
      provider: 'GEMINI',
      model: 'gemini-3.1-flash-lite',
      mode: isVoice ? 'VOICE' : 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(aiMessage);
    this.scrollToBottom();

    this.aiChatService.askAboutScreen(
      query,
      isVoice,
      screenImg,
      screenCtx,
      historyPayload
    ).subscribe({
      next: (res) => {
        this.isGenerating = false;
        aiMessage.text = res.response || res.message || 'I analyzed your active screen.';
        aiMessage.provider = res.provider || 'GEMINI';
        aiMessage.model = res.model || 'gemini-3.1-flash-lite';
        this.cdr.detectChanges();
        this.scrollToBottom();

        // Speak aloud if query was asked via voice or voiceMode returned
        if (isVoice || res.voiceMode) {
          const speakText = res.spokenText || aiMessage.text;
          if (this.isLiveVoiceActive && this.liveService.isConnected()) {
            const liveVoicePrompt = `[MULTIMODAL SCREEN ANALYSIS FROM GEMINI 3.1 FLASH-LITE]
User asked: "${query}"
Gemini 3.1 Flash-Lite inspected the active screen snapshot and provided this analysis:
"${speakText}"

Instruction: You are the MentorHub AI Live Voice assistant speaking in your natural Kore voice. Speak this screen analysis answer clearly and naturally to the user. Speak in the exact language used by the user. Be concise, direct, and helpful.`;
            const sent = this.liveService.sendPromptToLiveModel(liveVoicePrompt);
            if (!sent) {
              this.speakVoiceResponse(speakText, true);
            }
          } else {
            this.speakVoiceResponse(speakText);
          }
        }
      },
      error: () => {
        this.isGenerating = false;
        aiMessage.text = "I'm unable to analyze your screen right now. Please try again.";
        this.scrollToBottom();
      }
    });
  }

  /**
   * Handles spoken screen queries in Live Voice conversation mode.
   * Intercepts the speech turn, captures live screen (in-app or external OS),
   * queries Gemini 3.1 Flash-Lite for multimodal perception,
   * and feeds the resulting analysis back to the Gemini Live voice model (Kore voice) to speak aloud.
   */
  async handleLiveVoiceScreenQuery(userText: string) {
    if (!userText || !userText.trim()) return;

    // Immediately stop any blind audio output and signal screen query processing
    this.liveService.handleInterruption();
    this.liveService.isProcessingScreenQuery = true;
    if (this.liveVoiceScreenFallbackTimer) {
      clearTimeout(this.liveVoiceScreenFallbackTimer);
      this.liveVoiceScreenFallbackTimer = null;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      avatar: 'U',
      text: userText,
      mode: 'VOICE',
      timestamp: timeStr
    });

    const aiMessageId = 'msg-' + Date.now();
    const aiMessage: LiveChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      avatar: 'AI',
      text: '🔍 Capturing live screen and analyzing with Gemini 3.1 Flash-Lite...',
      provider: 'GEMINI',
      model: 'gemini-3.1-flash-lite',
      mode: 'VOICE',
      timestamp: timeStr
    };
    this.messages.push(aiMessage);
    this.activeScreenAiMessage = aiMessage;
    this.scrollToBottom();

    // Check if user asked about external windows / OS desktop
    const wantsExternal = /\b(outside|desktop|external|vs code|vscode|other window|another app|other tab|entire screen|my computer)\b/i.test(userText);
    if (wantsExternal && !this.isExternalScreenActive) {
      this.showToast('🖥️ Requesting permission to read your external screen/window...');
      const granted = await this.screenReader.startExternalScreenCapture();
      if (!granted) {
        this.showToast('⚠️ External screen permission needed to view outside windows.');
      }
    }

    this.isCapturingScreen = true;
    let screenSnapshot = null;
    try {
      screenSnapshot = await this.screenReader.captureScreen();
    } catch (e) {
      console.warn('Live voice screen capture exception:', e);
    } finally {
      this.isCapturingScreen = false;
    }

    const screenImg = screenSnapshot ? screenSnapshot.imageBase64 : undefined;
    let screenCtx = screenSnapshot ? screenSnapshot.semanticContext : undefined;

    if (this.isExternalScreenActive) {
      screenCtx = `[EXTERNAL SCREEN ACTIVE] Visual feed captured from external OS window/desktop/application outside MentorHub. User is asking a direct question in live voice regarding their external screen.\n` + (screenCtx || '');
    } else if (!screenCtx) {
      const route = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      screenCtx = this.screenReader.extractSemanticContext(route);
    }

    const historyPayload = this.buildHistoryPayload();

    this.aiChatService.askAboutScreen(
      userText,
      true,
      screenImg,
      screenCtx,
      historyPayload
    ).subscribe({
      next: (res) => {
        aiMessage.text = res.response || res.message || 'I analyzed your active screen.';
        aiMessage.provider = res.provider || 'GEMINI';
        aiMessage.model = res.model || 'gemini-3.1-flash-lite';
        this.cdr.detectChanges();
        this.scrollToBottom();

        const spokenAnalysis = res.spokenText || res.response || res.message || 'I analyzed your active screen.';

        // Route the Flash-Lite multimodal analysis to the Live Voice model (Kore persona)
        if (this.isLiveVoiceActive && this.liveService.isConnected()) {
          const liveVoicePrompt = `[MULTIMODAL SCREEN ANALYSIS FROM GEMINI 3.1 FLASH-LITE]
The user asked via live voice: "${userText}"
Gemini 3.1 Flash-Lite inspected the active screen snapshot and provided this analysis:
"${spokenAnalysis}"

Instruction: You are the MentorHub AI Live Voice assistant speaking in your natural Kore voice. Speak this screen analysis answer clearly and naturally to the user. Speak in the exact language used by the user. Be concise, direct, and helpful.`;

          const sent = this.liveService.sendPromptToLiveModel(liveVoicePrompt);
          if (sent) {
            // Latency safety guard: if Live Voice model does not begin speaking in 2500ms, use speech synthesis fallback
            this.liveVoiceScreenFallbackTimer = setTimeout(() => {
              if (!this.audioPlayback.isSpeaking$.value && this.liveService.status$.value !== 'SPEAKING') {
                console.log('GeminiLiveService: Live voice audio latency guard triggered, falling back to TTS');
                this.speakVoiceResponse(spokenAnalysis, true);
              }
            }, 2500);
          } else {
            this.speakVoiceResponse(spokenAnalysis, true);
          }
        } else {
          this.speakVoiceResponse(spokenAnalysis, true);
        }
      },
      error: (err) => {
        console.error('Live voice screen query error:', err);
        aiMessage.text = "I'm unable to analyze your screen right now. Please try again.";
        this.liveService.isProcessingScreenQuery = false;
        this.activeScreenAiMessage = null;
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });
  }

  // Toggle Live Continuous Voice Mode
  async toggleLiveVoice() {
    if (this.isLiveVoiceActive) {
      this.endLiveVoice();
    } else {
      this.voiceCoordinator.stopAllVoices();
      this.showToast('🟢 Live Voice Mode Active (Kore Professional Voice)');
      const success = await this.liveService.startLiveSession();
      if (!success) {
        this.showToast('⚠️ Microphone access required for Live Voice');
      }
    }
  }

  endLiveVoice() {
    this.voiceCoordinator.stopAllVoices();
    this.liveService.endLiveSession();
    this.showToast('⏹️ Live Voice Session Ended');
  }

  // Instant Barge-In Interruption Handler
  triggerBargeInInterruption() {
    this.voiceCoordinator.stopAllVoices();
    this.liveService.handleInterruption();
    this.showToast('⚡ Audio Interrupted by User');
  }

  private processVoiceQuery(queryText: string) {
    if (!this.liveService.isFallbackMode) {
      return;
    }

    if (this.voiceQuerySub) this.voiceQuerySub.unsubscribe();

    const historyPayload = this.buildHistoryPayload();
    this.scrollToBottom();

    let screenCtx: string | undefined;
    if (this.isScreenPerceptionActive) {
      const route = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      screenCtx = this.screenReader.extractSemanticContext(route);
    }

    this.voiceQuerySub = this.modelRouter.sendTextMessage(queryText, historyPayload, undefined, screenCtx).subscribe({
      next: (res) => {
        const aiResponseText = res.response || res.message || 'I have processed your speech input.';

        this.messages.push({
          id: 'msg-' + Date.now(),
          sender: 'ai',
          avatar: 'AI',
          text: aiResponseText,
          provider: res.provider || 'GEMINI',
          model: res.model || 'gemini-3.5-flash',
          mode: 'VOICE',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.scrollToBottom();
        this.speakVoiceResponse(aiResponseText);
      },
      error: () => {
        console.warn('Voice Query processing error');
      }
    });
  }

  selectLiveVoice() {
    this.showToast('🎙️ Single Professional Voice: Kore (Studio 24kHz HD)');
  }

  private detectLanguageCode(text: string): string {
    if (!text) return 'en-US';
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN'; // Hindi / Marathi
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
    if (/[\u0B00-\u0B7F]/.test(text)) return 'or-IN'; // Odia
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
    if (/\b(hola|gracias|buenos|por favor|amigo)\b/i.test(text)) return 'es-ES';
    if (/\b(bonjour|merci|s'il vous plaît|oui)\b/i.test(text)) return 'fr-FR';
    if (/\b(hallo|guten tag|danke|bitte)\b/i.test(text)) return 'de-DE';
    return 'en-US';
  }

  private getBestVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (!langCode.startsWith('en')) {
      const match = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(langCode.toLowerCase().substring(0, 2)));
      if (match) return match;
    }

    return this.getBestProfessionalVoice();
  }

  private getBestProfessionalVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Strictly prefer a single authoritative English Male professional voice
    const maleVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Guy') ||
       v.name.includes('David') ||
       v.name.includes('Christopher') ||
       v.name.includes('Eric') ||
       v.name.includes('Roger') ||
       v.name.includes('Daniel') ||
       v.name.includes('George') ||
       v.name.includes('Oliver') ||
       v.name.includes('Google UK English Male') ||
       (v.name.includes('Male') && !v.name.includes('Female')))
    );
    if (maleVoice) return maleVoice;

    return voices.find(v => v.lang.startsWith('en')) || null;
  }

  speakVoiceResponse(text: string, forceFallback: boolean = false) {
    // STRICT SINGLE VOICE GUARANTEE: Never allow browser speechSynthesis to speak if Gemini Live is active (unless forcing fallback)!
    if (!forceFallback && (this.isLiveVoiceActive || this.liveService.status$.value !== 'IDLE' || this.voiceCoordinator.isChannelActive('gemini-live') || this.audioPlayback.isSpeaking$.value)) {
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.voiceCoordinator.acquireVoice('chatbot-tts');
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\[\[NAVIGATE:[^\]]+\]\]/gi, '')
      .replace(/```[\s\S]*?```/g, ' Code snippet displayed on screen. ')
      .replace(/:::path[\s\S]*?:::/g, ' I have prepared your step by step action path on screen. ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/###\s*/g, '')
      .replace(/[-*#]/g, '')
      .replace(/\bCUTM\b/gi, 'C.U.T.M.')
      .trim();

    if (!cleanText) {
      this.voiceCoordinator.releaseVoice('chatbot-tts');
      return;
    }

    const langCode = this.detectLanguageCode(cleanText);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = 0.98;
    utterance.pitch = 0.94;

    const professionalVoice = this.getBestVoiceForLanguage(langCode);
    if (professionalVoice) {
      utterance.voice = professionalVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingAudio = true;
      this.cdr.detectChanges();
    };

    utterance.onend = () => {
      this.isSpeakingAudio = false;
      this.voiceCoordinator.releaseVoice('chatbot-tts');
      this.cdr.detectChanges();
    };

    utterance.onerror = () => {
      this.isSpeakingAudio = false;
      this.voiceCoordinator.releaseVoice('chatbot-tts');
      this.cdr.detectChanges();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Text Chat Handler (Gemini 3.1 Flash-Lite)
  sendMessage() {
    if (!this.userInput.trim() || this.isGenerating) return;

    // Immediately stop any active voice playback when a new prompt is submitted
    this.voiceCoordinator.stopAllVoices();

    const query = this.userInput.trim();

    // Route system & browser control tasks to Autonomous Agent Engine
    if (this.systemAgent.isControlIntent(query)) {
      this.handleTextControlTask(query);
      return;
    }

    // Route screen-targeted queries to Gemini 3.1 Flash-Lite multimodal reader
    const isScreenTargeted = this.isScreenPerceptionActive || 
                             this.isExternalScreenActive ||
                             !!this.attachedScreenSnapshot ||
                             /\b(screen|page|current view|what am i seeing|this tab|this view|what is on my screen|read screen|analyze screen|outside|desktop|external|window|vscode|vs code|terminal)\b/i.test(query);

    if (isScreenTargeted) {
      this.submitScreenQuery(query, false);
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      avatar: 'U',
      text: query,
      mode: 'TEXT',
      timestamp: timeStr
    });

    this.userInput = '';
    this.isGenerating = true;
    this.scrollToBottom();

    const historyPayload = this.buildHistoryPayload();

    // Multimodal Screen Perception Context
    const screenImg = this.attachedScreenSnapshot ? this.attachedScreenSnapshot.imageBase64 : undefined;
    let screenCtx: string | undefined = this.attachedScreenSnapshot ? this.attachedScreenSnapshot.semanticContext : undefined;

    if (this.isScreenPerceptionActive && !screenCtx) {
      const route = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      screenCtx = this.screenReader.extractSemanticContext(route);
    }

    // Clear attached snapshot after attaching to request
    this.attachedScreenSnapshot = null;

    // Create a placeholder message for the AI response
    const aiMessageId = 'msg-' + Date.now();
    const aiMessage: LiveChatMessage = {
      id: aiMessageId,
      sender: 'ai',
      avatar: 'AI',
      text: '',
      provider: this.selectedProvider,
      model: this.selectedModel,
      mode: 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(aiMessage);
    this.scrollToBottom();

    this.textChatSub = this.modelRouter.streamTextMessage(
      query,
      historyPayload,
      screenImg,
      screenCtx,
      this.selectedProvider,
      this.selectedModel
    ).subscribe({
      next: (res) => {
        // As chunks arrive, append them to the aiMessage
        const chunkText = res ? (res.text || res.response || res.message || '') : '';
        if (chunkText) {
          aiMessage.text += chunkText;
          
          if (res.provider) aiMessage.provider = res.provider;
          if (res.model) aiMessage.model = res.model;

          // Force view update
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
      },
      error: () => {
        this.isGenerating = false;
        this.textChatSub = null;
        if (!aiMessage.text) {
          aiMessage.text = "I'm unable to reach the AI server right now. Please try again.";
        }
        this.scrollToBottom();
      },
      complete: () => {
        this.isGenerating = false;
        this.textChatSub = null;
        this.scrollToBottom();
      }
    });
  }

  // ========================================================
  // Autonomous System & Browser Control Agent Methods
  // Strict 6-Tier Priority Model Dispatcher & Permission UX
  // ========================================================

  handleTextControlTask(query: string) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      avatar: 'U',
      text: query,
      mode: 'TEXT',
      timestamp: timeStr
    });
    this.userInput = '';
    this.isGenerating = true;
    this.scrollToBottom();

    let screenCtx: string | undefined;
    if (this.isExternalScreenActive) {
      screenCtx = '[EXTERNAL SCREEN ACTIVE] Visual feed captured from external OS window/desktop.';
    } else if (this.isScreenPerceptionActive) {
      const route = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
      screenCtx = this.screenReader.extractSemanticContext(route);
    }

    const aiMsgId = 'msg-' + Date.now();
    const planningMsg: LiveChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      avatar: 'AI',
      text: '🛡️ Analyzing task with **Gemini 3.8 Flash (Primary Agent)** and formulating execution plan...',
      provider: 'GEMINI',
      model: 'Gemini 3.8 Flash',
      mode: 'TEXT',
      timestamp: timeStr
    };
    this.messages.push(planningMsg);
    this.scrollToBottom();

    this.systemAgent.planTask(query, screenCtx).subscribe({
      next: (plan) => {
        this.isGenerating = false;
        if (plan.requiresPermission) {
          this.pendingActionPlan = plan;
          planningMsg.text = `### 🛡️ System & Browser Control Request\n` +
            `**Assigned Model:** ${plan.assignedModel} (${plan.modelRole})\n\n` +
            `MentorHub AI requests authorization to operate your system and browser to perform the following actions:\n\n` +
            plan.actions.map((a, idx) => `${idx + 1}. **${a.description}** \`[${a.type}]\``).join('\n') +
            `\n\n*Please confirm below to grant authorization or deny to cancel.*`;
        } else {
          planningMsg.text = plan.naturalResponse || 'Task evaluated.';
        }
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => {
        this.isGenerating = false;
        planningMsg.text = '⚠️ Unable to formulate plan: ' + (err?.message || 'Server error');
        this.scrollToBottom();
      }
    });
  }

  handleLiveVoiceControlTask(userText: string) {
    if (!userText || !userText.trim()) return;
    this.liveService.handleInterruption();
    this.voiceCoordinator.stopAllVoices();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      avatar: 'U',
      text: userText,
      mode: 'VOICE',
      timestamp: timeStr
    });

    const aiMsgId = 'msg-' + Date.now();
    const planningMsg: LiveChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      avatar: 'AI',
      text: '🛡️ Planning system action with **Gemini 3.8 Flash** and requesting permission...',
      provider: 'GEMINI',
      model: 'Gemini 3.8 Flash',
      mode: 'VOICE',
      timestamp: timeStr
    };
    this.messages.push(planningMsg);
    this.scrollToBottom();

    this.systemAgent.planTask(userText).subscribe({
      next: (plan) => {
        if (plan.requiresPermission) {
          this.pendingActionPlan = plan;
          planningMsg.text = `### 🛡️ System & Browser Control Request\n` +
            `**Assigned Model:** ${plan.assignedModel} (${plan.modelRole})\n\n` +
            `MentorHub AI requests authorization to operate your system and browser to perform the following actions:\n\n` +
            plan.actions.map((a, idx) => `${idx + 1}. **${a.description}** \`[${a.type}]\``).join('\n') +
            `\n\n*Please confirm below or say "Authorize" to proceed.*`;
          this.cdr.detectChanges();
          this.scrollToBottom();

          const spokenPrompt = `I have prepared the plan to ${plan.taskSummary}. May I take control of your system to proceed? Please say authorize or confirm on screen.`;
          this.speakVoiceResponse(spokenPrompt, true);
        } else {
          planningMsg.text = plan.naturalResponse || 'Task evaluated.';
          this.cdr.detectChanges();
          this.scrollToBottom();
          this.speakVoiceResponse(plan.naturalResponse || 'Task evaluated.', true);
        }
      },
      error: (err) => {
        planningMsg.text = '⚠️ Unable to formulate plan: ' + (err?.message || 'Server error');
        this.scrollToBottom();
      }
    });
  }

  authorizeAndExecutePlan(isVoice: boolean = false) {
    if (!this.pendingActionPlan || this.isExecutingPlan) return;
    const plan = this.pendingActionPlan;
    this.isExecutingPlan = true;
    this.showToast('⚡ System control authorized. Executing actions with ' + plan.assignedModel + '...');

    const execAiMessage: LiveChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'ai',
      avatar: 'AI',
      text: `⚙️ **Executing Authorized Actions** via **${plan.assignedModel}** (${plan.modelRole})...\n\n` +
            plan.actions.map(a => `⏳ ${a.description}`).join('\n'),
      provider: 'GEMINI',
      model: plan.assignedModel,
      mode: isVoice ? 'VOICE' : 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.messages.push(execAiMessage);
    this.scrollToBottom();

    this.systemAgent.executePlan(plan.planId, plan.actions, true).subscribe({
      next: (result) => {
        this.isExecutingPlan = false;
        this.pendingActionPlan = null;
        this.executedPlanResult = result;

        const summaryActions = result.executedActions && result.executedActions.length > 0
          ? result.executedActions.map(a => `${a.status === 'COMPLETED' ? '✅' : '❌'} **${a.description}**\n${a.output ? '```\n' + a.output + '\n```' : ''}`).join('\n\n')
          : '';

        execAiMessage.text = `### 🛡️ System Control Task Completed\n` +
          `**Executing Agent:** ${result.executingModel} (${result.executingModelRole})\n\n` +
          `${summaryActions}\n\n` +
          `${result.completionMessage}`;
        execAiMessage.model = result.executingModel;

        this.cdr.detectChanges();
        this.scrollToBottom();

        if (isVoice || this.isLiveVoiceActive) {
          this.speakVoiceResponse(result.spokenSummary, true);
        }
      },
      error: (err) => {
        this.isExecutingPlan = false;
        this.pendingActionPlan = null;
        execAiMessage.text = `❌ **Execution Error:** Unable to complete system actions. ${err?.message || ''}`;
        this.scrollToBottom();
        if (isVoice || this.isLiveVoiceActive) {
          this.speakVoiceResponse("Unable to complete system action: " + (err?.message || 'system error'), true);
        }
      }
    });
  }

  denyPlan(isVoice: boolean = false) {
    if (!this.pendingActionPlan) return;
    const plan = this.pendingActionPlan;
    this.pendingActionPlan = null;
    this.isExecutingPlan = false;
    this.showToast('🛑 System control permission denied by user.');

    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'ai',
      avatar: 'AI',
      text: `🛑 **System Control Cancelled:** Permission was denied for: *${plan.taskSummary}*. No actions were performed on your system.`,
      provider: 'GEMINI',
      model: plan.assignedModel,
      mode: isVoice ? 'VOICE' : 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.scrollToBottom();

    if (isVoice || this.isLiveVoiceActive) {
      this.speakVoiceResponse('System control was cancelled and no actions were performed.', true);
    }
  }

  toggleModelsModal() {
    this.showModelsModal = !this.showModelsModal;
  }

  copyMessage(msg: LiveChatMessage) {
    if (!msg.text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg.text).then(() => {
        msg.isCopied = true;
        this.showToast('📋 Response copied to clipboard!');
        setTimeout(() => { msg.isCopied = false; }, 2500);
      });
    }
  }

  toggleReaction(msg: LiveChatMessage, type: 'like' | 'dislike') {
    if (msg.reaction === type) {
      msg.reaction = null;
    } else {
      msg.reaction = type;
      this.showToast(type === 'like' ? '👍 Feedback saved!' : '👎 Feedback recorded.');
    }
  }

  clearChat() {
    if (this.messages.length <= 1) return;
    this.messages = [this.messages[0]];
    this.showToast('🧹 Conversation cleared.');
    this.scrollToBottom();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 3200);
  }

  private buildHistoryPayload(): { role: string; content: string }[] {
    const history: { role: string; content: string }[] = [];
    const startIdx = this.messages.length > 1 && this.messages[0].sender === 'ai' ? 1 : 0;

    for (let i = startIdx; i < this.messages.length - 1; i++) {
      const msg = this.messages[i];
      history.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    }

    return history.slice(-10);
  }

  formatMarkdown(text: string): string {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="chat-code-block"><div class="code-lang-tag">${lang || 'code'}</div><pre><code>${code}</code></pre></div>`;
    });

    // 2. Action Pathway Blocks (:::path ... :::)
    formatted = formatted.replace(/:::path\s*([\s\S]*?):::/gi, (match, pathContent) => {
      const lines = pathContent.trim().split('\n').filter((l: string) => l.trim().length > 0);
      let stepsHtml = '';

      lines.forEach((line: string, index: number) => {
        const parts = line.split('|').map((p: string) => p.trim());
        const rawTitle = parts[0] || `Step ${index + 1}`;
        const desc = parts[1] || '';

        const stepNumMatch = rawTitle.match(/Step\s*(\d+)[\s:]*(.*)/i);
        const stepNum = stepNumMatch ? stepNumMatch[1] : (index + 1);
        const stepTitle = stepNumMatch ? (stepNumMatch[2] || rawTitle) : rawTitle;

        stepsHtml += `
          <div class="path-step-item">
            <div class="step-num-pill">${stepNum}</div>
            <div class="step-details">
              <div class="step-title-text serif-title">${stepTitle}</div>
              ${desc ? `<div class="step-desc-text serif-title">${desc}</div>` : ''}
            </div>
          </div>
        `;
      });

      return `
        <div class="ai-path-roadmap-card elevated-card-3d">
          <div class="path-card-header">
            <div class="path-header-badge serif-title">
              <span class="path-pulse-icon">🗺️</span>
              <span>ACADEMIC STUDY PATHWAY</span>
            </div>
          </div>
          <div class="path-steps-list">
            ${stepsHtml}
          </div>
        </div>
      `;
    });

    // 3. Strip any in-line navigation directives or tags completely
    formatted = formatted.replace(/\[\[NAVIGATE:[^\]]+\]\]/gi, '');
    formatted = formatted.replace(/\[([^\]]+)\]\((?:navigate:[^)]+|\/[a-zA-Z0-9_\-\/?=&%#]+)\)/gi, '<strong>$1</strong>');

    // 4. Standard Inline Formats
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 class="chat-h4 serif-title">$1</h4>');
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  close() {
    this.endLiveVoice();
    this.closeChatbot.emit();
  }
}
