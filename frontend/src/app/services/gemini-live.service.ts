import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { AudioCaptureService } from './audio-capture.service';
import { AudioPlaybackService } from './audio-playback.service';

export type LiveSessionStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'RECONNECTING'
  | 'FALLBACK'
  | 'ERROR'
  | 'ENDED';

@Injectable({
  providedIn: 'root'
})
export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private isSetupComplete = false;
  private wsUrl = 'ws://localhost:8080/ws-ai-live';
  
  public selectedVoice$ = new BehaviorSubject<'Aoede' | 'Charon' | 'Fenrir' | 'Kore'>('Aoede');
  public status$ = new BehaviorSubject<LiveSessionStatus>('IDLE');
  public inputTranscript$ = new BehaviorSubject<string>(''); // Kept for UI backwards compatibility, but won't populate natively
  public outputTranscript$ = new BehaviorSubject<string>('');
  public transcriptEvent$ = new Subject<{ role: 'user' | 'assistant'; text: string }>();

  private pcmSub: Subscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  public isFallbackMode = false;

  private heartbeatInterval: any = null;
  private loudFrameCount = 0;
  private lastAiSpeechStartTime = 0;

  constructor(
    private http: HttpClient,
    private audioCapture: AudioCaptureService,
    private audioPlayback: AudioPlaybackService,
    private ngZone: NgZone
  ) {
    this.initVoicePreference();
  }

  private initVoicePreference() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('mentorhub_live_voice') as 'Aoede' | 'Charon' | 'Fenrir' | 'Kore';
      if (saved && ['Aoede', 'Charon', 'Fenrir', 'Kore'].includes(saved)) {
        this.selectedVoice$.next(saved);
      }
    }
  }

  public setVoice(voice: 'Aoede' | 'Charon' | 'Fenrir' | 'Kore') {
    this.selectedVoice$.next(voice);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mentorhub_live_voice', voice);
    }
    if (this.status$.value === 'CONNECTED' || this.status$.value === 'LISTENING' || this.status$.value === 'SPEAKING') {
      if (this.ws) {
        try { this.ws.close(); } catch {}
      }
      this.connectWebSocket();
    }
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.heartbeatInterval = setInterval(() => {
      if (this.status$.value !== 'IDLE' && this.status$.value !== 'ENDED') {
        if (this.ws && (this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING)) {
          console.warn('GeminiLiveService: Heartbeat detected closed WebSocket. Reconnecting...');
          this.connectWebSocket();
        }
      }
    }, 2500);
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public async startLiveSession(): Promise<boolean> {
    if (this.status$.value === 'CONNECTED' || this.status$.value === 'LISTENING') {
      return true;
    }

    this.setStatus('CONNECTING');
    this.isFallbackMode = false;
    this.reconnectAttempts = 0;

    const captured = await this.audioCapture.startCapture();
    if (!captured) {
      this.setStatus('ERROR');
      return false;
    }

    if (this.pcmSub) this.pcmSub.unsubscribe();
    this.pcmSub = this.audioCapture.pcmChunk$.subscribe(chunkBase64 => {
      this.handleUserMicChunk(chunkBase64);
    });

    this.outputTranscript$.next('');
    this.inputTranscript$.next('');
    this.isSetupComplete = false;
    this.startHeartbeatMonitor();
    this.connectWebSocket();
    return true;
  }

  private connectWebSocket() {
    try {
      const voice = this.selectedVoice$.value || 'Aoede';
      const connectionUrl = `${this.wsUrl}?voice=${voice}&model=gemini-3.1-flash-live-preview`;
      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        this.ngZone.run(() => {
          this.reconnectAttempts = 0;
          this.isSetupComplete = false;
          this.setStatus('LISTENING');
          console.log('GeminiLiveService: Connected to Live Voice Proxy. Awaiting Gemini Live setupComplete...');
        });
      };

      this.ws.onmessage = (evt) => {
        this.ngZone.run(() => {
          this.handleServerFrame(evt.data);
        });
      };

      this.ws.onerror = (err) => {
        console.warn('GeminiLiveService: WebSocket error:', err);
        this.handleConnectionFailure();
      };

      this.ws.onclose = () => {
        if (this.status$.value !== 'ENDED' && this.status$.value !== 'IDLE') {
          this.handleConnectionFailure();
        }
      };

    } catch (e) {
      console.error('GeminiLiveService: Connection attempt failed:', e);
      this.activateGroqFallback();
    }
  }

  private async handleServerFrame(data: any) {
    try {
      let textData = data;
      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        textData = await data.text();
      } else if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
        textData = new TextDecoder('utf-8').decode(data);
      }
      const msg = JSON.parse(textData);

      if (msg.type === 'FALLBACK' || msg.type === 'DISCONNECTED') {
        console.warn('GeminiLiveService: Upstream disconnected or fallback triggered:', msg);
        this.activateGroqFallback();
        return;
      }

      if (msg.setupComplete) {
        this.isSetupComplete = true;
        console.log('GeminiLiveService: Gemini Live (gemini-3.1-flash-live-preview) setupComplete received! Initializing greeting...');
        // Wake up the AI with an initial invisible ping so it speaks first
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: 'Hello, I am connected. Please greet me briefly in 1 or 2 articulate sentences as MentorHub AI.' }]
                }
              ],
              turnComplete: true
            }
          }));
        }
      }

      if (msg.serverContent) {
        const sc = msg.serverContent;

        if (sc.interrupted || sc.turnComplete === false && sc.modelTurn === null) {
          this.handleInterruption();
          return;
        }

        if (sc.modelTurn && sc.modelTurn.parts) {
          this.setStatus('SPEAKING');

          for (const part of sc.modelTurn.parts) {
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData) {
              const mime = inlineData.mimeType || inlineData.mime_type || '';
              if (inlineData.data && (mime.startsWith('audio/') || !mime)) {
                this.audioPlayback.enqueueBase64Pcm(inlineData.data, 24000);
              }
            }
            if (part.text) {
              const current = this.outputTranscript$.value + part.text;
              this.outputTranscript$.next(current);
            }
          }
        }

        if (sc.turnComplete) {
          const finalOutput = this.outputTranscript$.value.trim();
          if (finalOutput) {
            this.transcriptEvent$.next({ role: 'assistant', text: finalOutput });
            this.outputTranscript$.next('');
          }
          this.setStatus('LISTENING');
        }
      }

    } catch (e) {
      console.warn('GeminiLiveService: Frame parse error:', e);
    }
  }

  private handleUserMicChunk(chunkBase64: string) {
    if (!this.isSetupComplete) return;

    // Require sustained intentional human speech (3 consecutive audio frames above 0.70 RMS, ~100ms)
    // to prevent transient noise spikes, clicks, desk bumps or breathing from triggering accidental interruptions
    if (this.audioPlayback.isSpeaking$.value) {
      // 600ms grace period right when AI starts speaking to prevent initial speaker output from self-triggering barge-in
      const timeSinceSpeechStart = Date.now() - this.lastAiSpeechStartTime;
      if (timeSinceSpeechStart > 600) {
        if (this.audioCapture.volumeRms$.value > 0.80) {
          this.loudFrameCount++;
          if (this.loudFrameCount >= 5) {
            this.triggerBargeInInterruption();
            this.loudFrameCount = 0;
          }
        } else {
          this.loudFrameCount = 0;
        }
      } else {
        this.loudFrameCount = 0;
      }
    } else {
      this.lastAiSpeechStartTime = Date.now();
      this.loudFrameCount = 0;
    }

    if (this.isFallbackMode) {
      return; 
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const pcmFrame = {
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: chunkBase64
          }
        }
      };
      this.ws.send(JSON.stringify(pcmFrame));
    }
  }

  /**
   * Transmits a visual screen snapshot into the Gemini Live Bidi WebSocket stream.
   * Enables multimodal vision during live voice conversations.
   */
  public sendScreenFrame(base64Jpeg: string): boolean {
    if (!base64Jpeg || typeof base64Jpeg !== 'string') return false;
    const cleanBase64 = base64Jpeg.replace(/^data:image\/[a-z]+;base64,/, '').trim();
    if (cleanBase64.length < 100 || cleanBase64.startsWith('data:') || !/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
      console.warn('GeminiLiveService: Skipping invalid or malformed screen frame base64');
      return false;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isSetupComplete) {
      const framePayload = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          ]
        }
      };
      this.ws.send(JSON.stringify(framePayload));
      console.log('GeminiLiveService: Sent visual screen frame to upstream Gemini Live API (length: ' + cleanBase64.length + ')');
      return true;
    }
    return false;
  }

  public triggerBargeInInterruption() {
    this.handleInterruption();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send a turnComplete signal to natively cancel the model's ongoing response
      this.ws.send(JSON.stringify({ clientContent: { turns: [], turnComplete: true } }));
    }
  }

  public handleInterruption() {
    this.setStatus('INTERRUPTED');
    this.audioPlayback.interrupt();
    this.outputTranscript$.next('');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTimeout(() => {
      if (this.status$.value === 'INTERRUPTED') {
        this.setStatus('LISTENING');
      }
    }, 300);
  }

  private handleConnectionFailure() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setStatus('RECONNECTING');
      const backoffMs = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.connectWebSocket();
      }, backoffMs);
    } else {
      this.activateGroqFallback();
    }
  }

  private activateGroqFallback() {
    this.isFallbackMode = true;
    this.setStatus('FALLBACK');
    console.log('GeminiLiveService: Live Voice in Fallback Mode.');
  }

  public endLiveSession() {
    this.stopHeartbeatMonitor();
    this.setStatus('ENDED');
    this.audioPlayback.interrupt();
    this.audioCapture.stopCapture();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.pcmSub) {
      this.pcmSub.unsubscribe();
      this.pcmSub = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.inputTranscript$.next('');
    this.outputTranscript$.next('');
    this.setStatus('IDLE');
  }


  private setStatus(newStatus: LiveSessionStatus) {
    this.status$.next(newStatus);
  }
}
