import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiChatService, ChatMessage } from '../../services/ai-chat.service';
import { GeminiLiveService, LiveSessionStatus } from '../../services/gemini-live.service';
import { AudioCaptureService } from '../../services/audio-capture.service';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { AiModelRouterService } from '../../services/ai-model-router.service';
import { AppScreenReaderService, ScreenCaptureResult } from '../../services/app-screen-reader.service';

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
  selectedModel = 'gemini-3.6-flash';

  userInput = '';
  isGenerating = false;
  toastMessage: string | null = null;
  private shouldScrollToBottom = true;

  // Multimodal Screen Reader State
  attachedScreenSnapshot: ScreenCaptureResult | null = null;
  isCapturingScreen = false;
  isScreenPerceptionActive = true;

  // Live Voice State
  liveStatus: LiveSessionStatus = 'IDLE';
  isLiveVoiceActive = false;

  // Professional Voice Persona (Gemini Live & Speech Synthesis)
  currentLiveVoice: 'Aoede' | 'Charon' | 'Fenrir' | 'Kore' = 'Aoede';
  availableVoicePersonas = [
    { id: 'Aoede' as const, name: 'Aoede', title: 'Executive Academic', gender: 'Female', desc: 'Warm, articulate, confident & refined diction', icon: '✨' },
    { id: 'Charon' as const, name: 'Charon', title: 'Senior Scholar', gender: 'Male', desc: 'Composed, deep, informative & reassuring', icon: '🏛️' },
    { id: 'Fenrir' as const, name: 'Fenrir', title: 'Principal Architect', gender: 'Male', desc: 'Resonant, authoritative & decisive', icon: '⚙️' },
    { id: 'Kore' as const, name: 'Kore', title: 'Empathetic Mentor', gender: 'Female', desc: 'Calm, gentle, clear & encouraging', icon: '🌿' }
  ];

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

  quickPrompts: { label: string; prompt: string; icon: string }[] = [
    { icon: '🗺️', label: 'Prepare My Path', prompt: 'I need guidance on what I should do in MentorHub for my problem. Please diagnose my situation, prepare a complete step-by-step path for me, and navigate me there.' },
    { icon: '🎙️', label: 'Viva Preparation Path', prompt: 'I am struggling to prepare for my academic viva exam. Diagnose my problem, prepare a roadmap for me, and navigate me to practice.' },
    { icon: '☕', label: 'Java & Backend Path', prompt: 'I want to master Java and Backend engineering. Guide me what courses to take, where to code, and navigate me there.' },
    { icon: '📸', label: 'Read My Screen', prompt: 'Please read my active screen, explain what I am looking at, and guide me on what actions I should take next.' },
    { icon: '💻', label: 'Code Workspace', prompt: 'Navigate me to the Collaborative Code Workspace and explain how the Piston compiler works.' },
    { icon: '🎯', label: 'Goals & Mentorship', prompt: 'Prepare a path for me to set SMART goals, connect with Senior Mentor Akshat Aryan, and earn verified certificates.' },
    { icon: '🎓', label: 'CUTM Courses', prompt: 'Show me the 385 CUTM Courseware courses and navigate me to browse them.' },
    { icon: '🟢', label: 'NVIDIA Vision', prompt: 'Analyze my current screen with NVIDIA NIM Vision and tell me what to do.' }
  ];

  messages: LiveChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'ai',
      avatar: 'AI',
      text: 'Greetings! I am the **MentorHub AI Voice Assistant & Master Academic Navigator**.\n\nI possess a complete mental model and real-time awareness of our entire platform—including all **385+ CUTM Courseware courses** and **5 CBCS baskets**, **AI Mock Viva defense**, **Collaborative Code Workspace**, **cryptographic certificates**, and our team led by **Senior Mentor Akshat Aryan**.\n\n🗺️ **Personalized Problem Diagnosis & Path Planning Active**:\nTell me what problem you are facing or what you want to achieve! I will diagnose your situation, formulate an **interactive step-by-step pathway**, and **navigate you directly to the right screen in MentorHub**.\n\n👁️ **Screen Perception is active**: Tap **📸 Read My Screen** or ask me about what is displayed on your screen. Tap **🟢 LIVE VOICE** for real-time spoken dialogue with vision!',
      provider: 'GEMINI',
      model: 'gemini-3.6-flash',
      mode: 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  async sendQuickPrompt(prompt: string) {
    if (prompt.includes('Screen') || prompt.includes('screen')) {
      if (!this.attachedScreenSnapshot) {
        await this.captureScreenSnapshot();
      }
    }
    this.userInput = prompt;
    this.sendMessage();
  }

  constructor(
    private aiChatService: AiChatService,
    public modelRouter: AiModelRouterService,
    public liveService: GeminiLiveService,
    public audioCapture: AudioCaptureService,
    public audioPlayback: AudioPlaybackService,
    public screenReader: AppScreenReaderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Subscribe to Gemini Live status & transcripts
    this.liveStatusSub = this.liveService.status$.subscribe(status => {
      this.liveStatus = status;
      this.isLiveVoiceActive = status !== 'IDLE' && status !== 'ENDED';
      this.scrollToBottom();
    });

    this.liveService.selectedVoice$.subscribe(voice => {
      this.currentLiveVoice = voice;
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
        this.messages.push({
          id: 'msg-' + Date.now(),
          sender: 'user',
          avatar: 'U',
          text: event.text,
          mode: 'VOICE',
          timestamp: timeStr
        });

        this.processVoiceQuery(event.text);

      } else if (event.role === 'assistant') {
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
      this.scrollToBottom();
    });

    // Subscribe to Web Audio RMS levels for dynamic audio-reactive waveform visualizer
    this.userRmsSub = this.audioCapture.volumeRms$.subscribe(rms => {
      this.userVolumeRms = rms;
    });

    this.aiRmsSub = this.audioPlayback.outputVolumeRms$.subscribe(rms => {
      this.aiVolumeRms = rms;
    });

    this.speakingSub = this.audioPlayback.isSpeaking$.subscribe(speaking => {
      this.isSpeakingAudio = speaking;
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
    if (this.liveStatusSub) this.liveStatusSub.unsubscribe();
    if (this.transcriptSub) this.transcriptSub.unsubscribe();
    if (this.userRmsSub) this.userRmsSub.unsubscribe();
    if (this.aiRmsSub) this.aiRmsSub.unsubscribe();
    if (this.speakingSub) this.speakingSub.unsubscribe();
    if (this.textChatSub) this.textChatSub.unsubscribe();
    if (this.voiceQuerySub) this.voiceQuerySub.unsubscribe();
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
      this.selectedProvider = 'NVIDIA';
      this.selectedModel = this.modelRouter.config.nvidiaModel;
      this.showToast('🟢 Forced Engine: NVIDIA NIM (Meta LLaMA 3.2 11B Vision)');
    } else {
      this.selectedProvider = 'GEMINI';
      this.selectedModel = this.modelRouter.config.textModel;
      this.showToast('✨ Auto Engine: Gemini Core + NVIDIA NIM Failover');
    }
  }

  toggleScreenPerception() {
    this.isScreenPerceptionActive = this.screenReader.toggleScreenPerception();
    this.showToast(this.isScreenPerceptionActive ? '👁️ Screen Perception: Active' : '🚫 Screen Perception: Paused');
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

  // Toggle Live Continuous Voice Mode
  async toggleLiveVoice() {
    if (this.isLiveVoiceActive) {
      this.endLiveVoice();
    } else {
      this.showToast('🟢 Live Voice Mode Active (Continuous Speech)');
      const success = await this.liveService.startLiveSession();
      if (!success) {
        this.showToast('⚠️ Microphone access required for Live Voice');
      } else {
        // Send initial visual frame to Gemini Live if screen perception is on
        if (this.isScreenPerceptionActive) {
          setTimeout(() => {
            this.screenReader.captureScreen().then(cap => {
              if (cap && cap.imageBase64 && cap.imageBase64.length > 100) {
                this.liveService.sendScreenFrame(cap.imageBase64);
              }
            });
          }, 800);
        }
      }
    }
  }

  endLiveVoice() {
    this.liveService.endLiveSession();
    this.showToast('⏹️ Live Voice Session Ended');
  }

  // Instant Barge-In Interruption Handler
  triggerBargeInInterruption() {
    this.liveService.handleInterruption();
    this.showToast('⚡ Audio Interrupted by User');
  }

  private processVoiceQuery(queryText: string) {
    // Only send voice transcript to text API during fallback mode.
    // When Gemini Live is connected natively, audio responses come via WebSocket.
    if (!this.liveService.isFallbackMode) {
      return;
    }

    if (this.voiceQuerySub) this.voiceQuerySub.unsubscribe();

    this.checkAndTriggerAutoNavigation(queryText);

    const historyPayload = this.buildHistoryPayload();
    this.scrollToBottom();

    // Extract active DOM context so fallback AI has screen awareness
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
          model: res.model || 'gemini-3.6-flash',
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

  selectLiveVoice(voiceId: 'Aoede' | 'Charon' | 'Fenrir' | 'Kore') {
    this.currentLiveVoice = voiceId;
    this.liveService.setVoice(voiceId);
    const persona = this.availableVoicePersonas.find(p => p.id === voiceId);
    this.showToast(`🎙️ Voice persona updated to ${persona?.name} (${persona?.title})`);
  }

  private getBestProfessionalVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. High-fidelity Natural / Neural voices (Edge / Azure Online)
    const naturalVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online'))
    );
    if (naturalVoice) return naturalVoice;

    // 2. Google High-Fidelity English voices (Chrome)
    const googleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google UK English Female') || v.name.includes('Google US English') || v.name.includes('Google'))
    );
    if (googleVoice) return googleVoice;

    // 3. Apple studio voices
    const appleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen') || v.name.includes('Victoria'))
    );
    if (appleVoice) return appleVoice;

    // 4. Clear studio voices (Zira, Aria, Jenny, Guy)
    const studioVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Zira') || v.name.includes('Aria') || v.name.includes('Jenny') || v.name.includes('Guy'))
    );
    if (studioVoice) return studioVoice;

    // 5. Fallback: any English voice
    return voices.find(v => v.lang.startsWith('en')) || null;
  }

  speakVoiceResponse(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet displayed on screen. ')
      .replace(/:::path[\s\S]*?:::/g, ' I have prepared your step by step action path on screen. ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/###\s*/g, '')
      .replace(/[-*#]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.98; // Well-paced, natural, articulate cadence
    utterance.pitch = 1.0;

    const professionalVoice = this.getBestProfessionalVoice();
    if (professionalVoice) {
      utterance.voice = professionalVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingAudio = true;
    };

    utterance.onend = () => {
      this.isSpeakingAudio = false;
    };

    utterance.onerror = () => {
      this.isSpeakingAudio = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Direct In-App Navigation Engine
  navigateTo(route: string, label?: string) {
    if (!route) return;
    let cleanRoute = route.trim();
    if (cleanRoute.startsWith('navigate:')) {
      cleanRoute = cleanRoute.substring('navigate:'.length).trim();
    }

    this.showToast(`🚀 Navigating to ${label || cleanRoute}...`);
    this.router.navigateByUrl(cleanRoute);

    if (this.isLiveVoiceActive && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speakVoiceResponse(`Navigating you to ${label || cleanRoute}.`);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.close();
    }
  }

  handleContentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const btn = target.closest('.ai-nav-action-pill, .path-step-nav-btn, [data-route]') as HTMLElement;
    if (btn) {
      event.preventDefault();
      event.stopPropagation();
      const route = btn.getAttribute('data-route') || btn.getAttribute('href');
      const label = btn.getAttribute('data-label') || btn.innerText || '';
      if (route) {
        this.navigateTo(route, label);
      }
    }
  }

  checkAndTriggerAutoNavigation(query: string) {
    if (!query) return;
    const q = query.toLowerCase();
    const hasNavIntent = q.includes('navigate') || q.includes('take me to') || q.includes('open ') || q.includes('go to ') || q.includes('bring me to');
    if (!hasNavIntent) return;

    if (q.includes('viva') || q.includes('defense') || q.includes('oral exam')) {
      this.navigateTo('/mock-viva', 'Mock Viva Defense Arena');
    } else if (q.includes('course') || q.includes('courseware') || q.includes('cutm') || q.includes('syllabus')) {
      this.navigateTo('/cutm-courses', 'CUTM Courses Repository');
    } else if (q.includes('workspace') || q.includes('code') || q.includes('compiler') || q.includes('ide') || q.includes('editor')) {
      this.navigateTo('/workspace', 'Collaborative Code Workspace');
    } else if (q.includes('mentor') || q.includes('match')) {
      this.navigateTo('/mentor-matching', 'Smart Mentor Matching');
    } else if (q.includes('session') || q.includes('meeting') || q.includes('calendar')) {
      this.navigateTo('/sessions', 'Mentoring Sessions Hub');
    } else if (q.includes('goal') || q.includes('target') || q.includes('milestone')) {
      this.navigateTo('/goals', 'SMART Goals Tracker');
    } else if (q.includes('certificate') || q.includes('credential') || q.includes('verify')) {
      this.navigateTo('/certificates', 'Verified Credentials');
    } else if (q.includes('dashboard') || q.includes('home')) {
      this.navigateTo('/dashboard', 'Executive Dashboard');
    } else if (q.includes('profile')) {
      this.navigateTo('/profile', 'User Profile');
    } else if (q.includes('resource') || q.includes('book') || q.includes('cheat sheet')) {
      this.navigateTo('/resource-hub', 'AI Resource Hub');
    }
  }

  // Text Chat Handler (Gemini 3.1 Flash)
  sendMessage() {
    if (!this.userInput.trim() || this.isGenerating) return;

    if (this.isSpeakingAudio) {
      this.audioPlayback.interrupt();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    const query = this.userInput.trim();
    this.checkAndTriggerAutoNavigation(query);
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

    // 2. Interactive Action Pathway Blocks (:::path ... :::)
    formatted = formatted.replace(/:::path\s*([\s\S]*?):::/gi, (match, pathContent) => {
      const lines = pathContent.trim().split('\n').filter((l: string) => l.trim().length > 0);
      let stepsHtml = '';

      lines.forEach((line: string, index: number) => {
        const parts = line.split('|').map((p: string) => p.trim());
        const rawTitle = parts[0] || `Step ${index + 1}`;
        const desc = parts[1] || '';
        let targetRoute = parts[2] || '';

        if (targetRoute.startsWith('navigate:')) {
          targetRoute = targetRoute.substring('navigate:'.length).trim();
        }

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
            ${targetRoute ? `
              <button type="button" class="path-step-nav-btn tactile-btn-3d serif-title" data-route="${targetRoute}" data-label="${stepTitle}">
                <span>Navigate</span> <span class="step-arrow">➔</span>
              </button>
            ` : ''}
          </div>
        `;
      });

      return `
        <div class="ai-path-roadmap-card elevated-card-3d">
          <div class="path-card-header">
            <div class="path-header-badge serif-title">
              <span class="path-pulse-icon">🗺️</span>
              <span>PERSONALIZED ACTION PATHWAY</span>
            </div>
            <span class="path-card-sub serif-title">Click any step to navigate directly</span>
          </div>
          <div class="path-steps-list">
            ${stepsHtml}
          </div>
        </div>
      `;
    });

    // 3. Interactive In-App Navigation Action Pills [Label](navigate:/route) or [Label](/route)
    formatted = formatted.replace(/\[([^\]]+)\]\((navigate:[^)]+|\/[a-zA-Z0-9_\-\/?=&%#]+)\)/gi, (match, label, route) => {
      let cleanRoute = route;
      if (cleanRoute.startsWith('navigate:')) {
        cleanRoute = cleanRoute.substring('navigate:'.length).trim();
      }
      return `<button type="button" class="ai-nav-action-pill tactile-btn-3d serif-title" data-route="${cleanRoute}" data-label="${label}">
        <span class="pill-nav-icon">🚀</span>
        <span class="pill-nav-label">${label}</span>
        <span class="pill-nav-arrow">➔</span>
      </button>`;
    });

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
