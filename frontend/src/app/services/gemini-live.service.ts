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
  
  public status$ = new BehaviorSubject<LiveSessionStatus>('IDLE');
  public inputTranscript$ = new BehaviorSubject<string>(''); // Kept for UI backwards compatibility, but won't populate natively
  public outputTranscript$ = new BehaviorSubject<string>('');
  public transcriptEvent$ = new Subject<{ role: 'user' | 'assistant'; text: string }>();

  private pcmSub: Subscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  public isFallbackMode = false;

  private heartbeatInterval: any = null;

  constructor(
    private http: HttpClient,
    private audioCapture: AudioCaptureService,
    private audioPlayback: AudioPlaybackService,
    private ngZone: NgZone
  ) {}

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
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.ngZone.run(() => {
          this.reconnectAttempts = 0;
          this.isSetupComplete = true;
          this.setStatus('LISTENING');
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
      const msg = JSON.parse(textData); console.log("SERVER FRAME:", msg);

      if (msg.type === 'FALLBACK') {
        this.activateGroqFallback();
        return;
      }

      if (msg.setupComplete) {
        this.isSetupComplete = true;
        // Wake up the AI with an initial invisible ping
        if (this.ws) {
          this.ws.send(JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: 'Hello, I am connected. Please greet me briefly.' }]
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

    if (this.audioPlayback.isSpeaking$.value && this.audioCapture.volumeRms$.value > 0.70) {
      this.triggerBargeInInterruption();
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
