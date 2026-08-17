import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiChatService, ChatMessage } from '../../services/ai-chat.service';
import { GeminiLiveService, LiveSessionStatus } from '../../services/gemini-live.service';
import { AudioCaptureService } from '../../services/audio-capture.service';
import { AudioPlaybackService } from '../../services/audio-playback.service';
import { AiModelRouterService } from '../../services/ai-model-router.service';

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
  selectedModel = 'gemini-3.1-flash';

  userInput = '';
  isGenerating = false;
  toastMessage: string | null = null;
  private shouldScrollToBottom = true;

  // Live Voice State
  liveStatus: LiveSessionStatus = 'IDLE';
  isLiveVoiceActive = false;

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

  messages: LiveChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'ai',
      avatar: 'AI',
      text: 'Greetings! I am the **MentorHub AI Copilot** (Gemini 3.1 Flash).\n\nAsk me code questions in text chat, or click **🟢 LIVE VOICE** for a continuous, real-time voice conversation with barge-in interruption support!',
      provider: 'GEMINI',
      model: 'gemini-3.1-flash',
      mode: 'TEXT',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  constructor(
    private aiChatService: AiChatService,
    public modelRouter: AiModelRouterService,
    public liveService: GeminiLiveService,
    public audioCapture: AudioCaptureService,
    public audioPlayback: AudioPlaybackService
  ) {}

  ngOnInit() {
    // Subscribe to Gemini Live status & transcripts
    this.liveStatusSub = this.liveService.status$.subscribe(status => {
      this.liveStatus = status;
      this.isLiveVoiceActive = status !== 'IDLE' && status !== 'ENDED';
      this.scrollToBottom();
    });

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

  // Toggle Live Continuous Voice Mode
  async toggleLiveVoice() {
    if (this.isLiveVoiceActive) {
      this.endLiveVoice();
    } else {
      this.showToast('🟢 Live Voice Mode Active (Continuous Speech)');
      const success = await this.liveService.startLiveSession();
      if (!success) {
        this.showToast('⚠️ Microphone access required for Live Voice');
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
    if (this.voiceQuerySub) this.voiceQuerySub.unsubscribe();

    const historyPayload = this.buildHistoryPayload();
    this.scrollToBottom();

    this.voiceQuerySub = this.modelRouter.sendTextMessage(queryText, historyPayload).subscribe({
      next: (res) => {
        const aiResponseText = res.response || res.message || 'I have processed your speech input.';

        this.messages.push({
          id: 'msg-' + Date.now(),
          sender: 'ai',
          avatar: 'AI',
          text: aiResponseText,
          provider: res.provider || 'GEMINI',
          model: res.model || 'gemini-3.1-flash',
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

  speakVoiceResponse(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' Code snippet displayed on screen. ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/###\s*/g, '')
      .replace(/[-*#]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;

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

    this.textChatSub = this.modelRouter.sendTextMessage(query, historyPayload).subscribe({
      next: (res) => {
        this.isGenerating = false;
        this.textChatSub = null;

        const aiResponseText = res.response || res.message || 'I have processed your request.';

        this.messages.push({
          id: 'msg-' + Date.now(),
          sender: 'ai',
          avatar: 'AI',
          text: aiResponseText,
          provider: res.provider || 'GEMINI',
          model: res.model || 'gemini-3.1-flash',
          mode: 'TEXT',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        this.scrollToBottom();
      },
      error: () => {
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

    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<div class="chat-code-block"><div class="code-lang-tag">${lang || 'code'}</div><pre><code>${code}</code></pre></div>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/^### (.*$)/gim, '<h4 class="chat-h4 orbitron-font">$1</h4>');
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  close() {
    this.endLiveVoice();
    this.closeChatbot.emit();
  }
}
