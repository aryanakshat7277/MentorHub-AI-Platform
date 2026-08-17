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
  private wsUrl = 'ws://localhost:8080/ws-ai-live';
  private apiUrl = 'http://localhost:8080/api/v1/ai/voice';

  public status$ = new BehaviorSubject<LiveSessionStatus>('IDLE');
  public inputTranscript$ = new BehaviorSubject<string>('');
  public outputTranscript$ = new BehaviorSubject<string>('');
  public transcriptEvent$ = new Subject<{ role: 'user' | 'assistant'; text: string }>();

  private pcmSub: Subscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  public isFallbackMode = false;

  private recognition: any = null;
  private isRecognitionActive = false;
  private heartbeatInterval: any = null;

  constructor(
    private http: HttpClient,
    private audioCapture: AudioCaptureService,
    private audioPlayback: AudioPlaybackService,
    private ngZone: NgZone
  ) {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Speech) {
      this.recognition = new Speech();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isRecognitionActive = true;
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim()) {
          this.inputTranscript$.next(transcript);

          // Barge-in: Interrupt ongoing AI audio if user speaks
          if (this.audioPlayback.isSpeaking$.value) {
            this.handleInterruption();
          }

          if (event.results[event.resultIndex].isFinal) {
            const finalQuery = transcript.trim();
            this.inputTranscript$.next('');
            this.transcriptEvent$.next({ role: 'user', text: finalQuery });
          }
        }
      };

      this.recognition.onerror = (err: any) => {
        console.warn('GeminiLiveService: SpeechRecognition error:', err);
        this.isRecognitionActive = false;
      };

      this.recognition.onend = () => {
        this.isRecognitionActive = false;
        // Safely restart speech recognition after brief 250ms tick to avoid browser state locks
        if (this.status$.value !== 'IDLE' && this.status$.value !== 'ENDED') {
          setTimeout(() => {
            this.restartRecognitionIfNeeded();
          }, 250);
        }
      };
    }
  }

  private restartRecognitionIfNeeded() {
    if (this.recognition && !this.isRecognitionActive && this.status$.value !== 'IDLE' && this.status$.value !== 'ENDED') {
      try {
        this.recognition.start();
        this.isRecognitionActive = true;
      } catch (e) {
        // If engine reported already active or locked, flag active
        this.isRecognitionActive = true;
      }
    }
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();

    // Heartbeat check every 2.5 seconds: ensures mic & recognition NEVER die
    this.heartbeatInterval = setInterval(() => {
      if (this.status$.value !== 'IDLE' && this.status$.value !== 'ENDED') {
        this.restartRecognitionIfNeeded();

        // Check WebSocket connection health
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

    // Start WebRTC mic capture with 2x digital gain boost
    const captured = await this.audioCapture.startCapture();
    if (!captured) {
      this.setStatus('ERROR');
      return false;
    }

    // Subscribe to mic PCM chunks
    if (this.pcmSub) this.pcmSub.unsubscribe();
    this.pcmSub = this.audioCapture.pcmChunk$.subscribe(chunkBase64 => {
      this.handleUserMicChunk(chunkBase64);
    });

    // Start recognition & heartbeat monitor loop
    this.restartRecognitionIfNeeded();
    this.startHeartbeatMonitor();

    // Connect WebSocket proxy to Gemini Live
    this.connectWebSocket();
    return true;
  }

  private connectWebSocket() {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.ngZone.run(() => {
          this.reconnectAttempts = 0;
          this.setStatus('CONNECTED');
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

  private handleServerFrame(data: string) {
    try {
      const msg = JSON.parse(data);

      if (msg.type === 'FALLBACK') {
        this.activateGroqFallback();
        return;
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
            if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/')) {
              this.audioPlayback.enqueueBase64Pcm(part.inlineData.data, 24000);
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
    if (this.audioPlayback.isSpeaking$.value && this.audioCapture.volumeRms$.value > 0.15) {
      this.handleInterruption();
    }

    if (this.isFallbackMode) {
      return; // Continuous SpeechRecognition loop handles speech text -> text model -> speech output
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
    console.log('GeminiLiveService: Live Voice in Fallback Mode (Continuous STT + Gemini 3.1 Flash Text + TTS).');
  }

  public endLiveSession() {
    this.stopHeartbeatMonitor();
    this.setStatus('ENDED');
    this.audioPlayback.interrupt();
    this.audioCapture.stopCapture();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isRecognitionActive = false;

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
