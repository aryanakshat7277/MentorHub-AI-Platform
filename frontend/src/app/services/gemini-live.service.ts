import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { AudioCaptureService, AudioPcmChunk } from './audio-capture.service';
import { AudioPlaybackService } from './audio-playback.service';
import { VoiceCoordinatorService } from './voice-coordinator.service';

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
  private isConnecting = false;
  private wsUrl = 'ws://localhost:8080/ws-ai-live';

  public readonly liveModel = 'gemini-3.1-flash-live-preview';
  public readonly selectedVoice$ = new BehaviorSubject<string>('Kore');
  public status$ = new BehaviorSubject<LiveSessionStatus>('IDLE');
  public inputTranscript$ = new BehaviorSubject<string>('');
  public outputTranscript$ = new BehaviorSubject<string>('');
  public transcriptEvent$ = new Subject<{ role: 'user' | 'assistant'; text: string }>();

  private pcmSub: Subscription | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimer: any = null;
  public isFallbackMode = false;

  // 1024 samples = 2048 bytes of silence in Base64 (matches ~64ms audio frame, valid length of 2732)
  private readonly silencePcmBase64 = (() => {
    const bytes = new Uint8Array(2048);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return typeof window !== 'undefined' ? window.btoa(binary) : 'A'.repeat(2731) + '=';
  })();

  private heartbeatInterval: any = null;
  private loudFrameCount = 0;
  private lastAiSpeechStartTime = 0;
  private lastAiSpeechEndTime = 0;
  private currentTurnId = 0;
  private isTurnInProgress = false;
  private pendingUserTranscript = '';
  public isProcessingScreenQuery = false;

  public isScreenReadingIntent(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const q = text.toLowerCase().trim();
    if (q.length < 3) return false;

    if (/\b(read|analyze|inspect|check|examine|look at|see|view|scan|explain|describe)\b.*\b(screen|desktop|window|display|monitor|page|ide|code|terminal)\b/i.test(q)) {
      return true;
    }
    if (/\b(screen|desktop|display|monitor|window)\b.*\b(read|analyze|inspect|check|explain|describe|view|scan)\b/i.test(q)) {
      return true;
    }
    if (/\b(what('?s| is| are)|what do you see|what can you see|tell me what)\b.*\b(on|in|at)\b.*\b(screen|desktop|display|monitor|window|page)\b/i.test(q)) {
      return true;
    }
    if (/\b(can you (see|read|check|inspect|analyze|look at)) (my|the|this)? ?(screen|desktop|window|display)\b/i.test(q)) {
      return true;
    }
    if (/\b(what am i (seeing|looking at))\b/i.test(q)) {
      return true;
    }
    if (/\b(read (my|the|this|active|current)? ?screen)\b/i.test(q)) {
      return true;
    }
    if (/\b(look at (my|the|this)? ?screen)\b/i.test(q)) {
      return true;
    }
    if (/\b(error|bug|code|issue)\b.*\b(on (my|the) screen)\b/i.test(q)) {
      return true;
    }
    if (/\b(screen|desktop)\b.*\b(pe|par)? ?(kya|dekho|padho|batao)\b/i.test(q)) {
      return true;
    }
    return false;
  }

  public isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN && this.isSetupComplete;
  }

  public sendPromptToLiveModel(promptText: string): boolean {
    if (!promptText || !this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isSetupComplete) {
      console.warn('GeminiLiveService: Cannot send prompt to live model - WebSocket not open or setup incomplete');
      return false;
    }
    try {
      this.isProcessingScreenQuery = false;
      this.outputTranscript$.next('');
      this.currentTurnId = this.audioPlayback.startNewTurn();
      this.setStatus('THINKING');

      const payload = {
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: promptText
                }
              ]
            }
          ],
          turnComplete: true
        }
      };
      this.ws.send(JSON.stringify(payload));
      console.log('GeminiLiveService: Dispatched multimodal screen analysis turn to Live Voice model');

      // Safety watchdog: Automatically restore LISTENING if model response is delayed or dropped
      setTimeout(() => {
        if (this.status$.value === 'THINKING' && !this.audioPlayback.isSpeaking$.value) {
          this.setStatus('LISTENING');
        }
      }, 3500);

      return true;
    } catch (err) {
      console.error('GeminiLiveService: sendPromptToLiveModel failed:', err);
      this.setStatus('LISTENING');
      return false;
    }
  }

  constructor(
    private http: HttpClient,
    private audioCapture: AudioCaptureService,
    private audioPlayback: AudioPlaybackService,
    private voiceCoordinator: VoiceCoordinatorService,
    private ngZone: NgZone
  ) {
    this.initVoicePreference();
    this.audioPlayback.isSpeaking$.subscribe(speaking => {
      if (!speaking) {
        this.lastAiSpeechEndTime = Date.now();
        if (this.status$.value === 'SPEAKING' || this.status$.value === 'THINKING') {
          this.setStatus('LISTENING');
        }
      }
    });
  }

  private initVoicePreference() {
    this.selectedVoice$.next('Kore');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mentorhub_live_voice', 'Kore');
    }
  }

  public setVoice(_voice: string = 'Kore') {
    this.selectedVoice$.next('Kore');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mentorhub_live_voice', 'Kore');
    }
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.heartbeatInterval = setInterval(() => {
      const st = this.status$.value;
      if (st !== 'IDLE' && st !== 'ENDED' && st !== 'CONNECTING' && st !== 'RECONNECTING') {
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
          console.warn('GeminiLiveService: Heartbeat detected inactive WebSocket. Reconnecting...');
          this.handleConnectionFailure();
        }
      }
    }, 4000);
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public async startLiveSession(): Promise<boolean> {
    if (this.status$.value === 'CONNECTED' || this.status$.value === 'LISTENING' || this.status$.value === 'SPEAKING') {
      return true;
    }

    this.voiceCoordinator.stopAllVoices();
    this.setStatus('CONNECTING');
    this.isFallbackMode = false;
    this.reconnectAttempts = 0;
    this.audioPlayback.ensureContext(24000);
    this.currentTurnId = this.audioPlayback.startNewTurn();
    this.isTurnInProgress = false;
    this.pendingUserTranscript = '';

    const captured = await this.audioCapture.startCapture();
    if (!captured) {
      this.setStatus('ERROR');
      return false;
    }

    if (this.pcmSub) this.pcmSub.unsubscribe();
    this.pcmSub = this.audioCapture.pcmChunk$.subscribe((chunk: AudioPcmChunk) => {
      this.handleUserMicChunk(chunk);
    });

    this.outputTranscript$.next('');
    this.inputTranscript$.next('');
    this.isSetupComplete = false;
    this.startHeartbeatMonitor();
    this.connectWebSocket();
    return true;
  }

  private connectWebSocket() {
    if (this.isConnecting) return;

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch (e) {}
      this.ws = null;
    }

    this.isConnecting = true;

    try {
      const voice = 'Kore';
      const connectionUrl = `${this.wsUrl}?voice=${voice}&model=${this.liveModel}`;
      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.isSetupComplete = false;
        this.isFallbackMode = false;
        this.ngZone.run(() => {
          this.setStatus('LISTENING');
          console.log(`GeminiLiveService: Connected to Live Voice Proxy (${this.liveModel}, Voice: Kore).`);
        });
      };

      this.ws.onmessage = (evt) => {
        this.handleServerFrame(evt.data);
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.warn('GeminiLiveService: WebSocket error:', err);
      };

      this.ws.onclose = (evt) => {
        this.isConnecting = false;
        this.isSetupComplete = false;
        if (this.status$.value !== 'ENDED' && this.status$.value !== 'IDLE') {
          this.handleConnectionFailure();
        }
      };

    } catch (e) {
      this.isConnecting = false;
      console.error('GeminiLiveService: Connection attempt failed:', e);
      this.handleConnectionFailure();
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

      if (msg.type === 'DISCONNECTED' || msg.type === 'FALLBACK') {
        console.warn('GeminiLiveService: Upstream session disconnected from backend:', msg);
        if (this.status$.value !== 'ENDED' && this.status$.value !== 'IDLE') {
          this.handleConnectionFailure();
        }
        return;
      }

      if (msg.setupComplete) {
        this.isSetupComplete = true;
        this.isFallbackMode = false;
        console.log(`GeminiLiveService: ${this.liveModel} setupComplete! Continuous listening active.`);

        // Send a brief introductory greeting trigger once via official BidiGenerateContent clientContent turn
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: 'Hello. Greet me in 1 short sentence as MentorHub AI. Note: Automatically detect whichever language I speak in and always speak back to me in that exact language only. Never pronounce CUTM as a word; always pronounce it letter-by-letter as C.U.T.M.'
                    }
                  ]
                }
              ],
              turnComplete: true
            }
          }));
        }
      }

      if (msg.serverContent) {
        const sc = msg.serverContent;

        if (sc.inputTranscription && sc.inputTranscription.text) {
          this.pendingUserTranscript += sc.inputTranscription.text;
          this.inputTranscript$.next(this.pendingUserTranscript.trim());
          if (this.isScreenReadingIntent(this.pendingUserTranscript)) {
            if (!this.isProcessingScreenQuery) {
              console.log('GeminiLiveService: Detected screen reading query from live speech transcription. Halting blind audio and routing to Gemini 3.1 Flash-Lite.');
              this.isProcessingScreenQuery = true;
              this.audioPlayback.interrupt();
              this.setStatus('THINKING');
            }
          }
        }

        if (sc.outputTranscription && sc.outputTranscription.text) {
          if (!this.isProcessingScreenQuery) {
            const currentOut = this.outputTranscript$.value + sc.outputTranscription.text;
            this.outputTranscript$.next(currentOut);
          }
        }

        if (sc.interrupted) {
          this.isTurnInProgress = false;
          this.handleInterruption();
          return;
        }

        if (sc.modelTurn && sc.modelTurn.parts) {
          if (this.pendingUserTranscript.trim()) {
            const userText = this.pendingUserTranscript.trim();
            this.pendingUserTranscript = '';
            this.inputTranscript$.next('');
            this.ngZone.run(() => {
              this.transcriptEvent$.next({ role: 'user', text: userText });
            });
          }

          if (this.isProcessingScreenQuery) {
            // Drop blind audio chunks and suppress blind speech turn while Gemini 3.1 Flash-Lite is inspecting the screen
            return;
          }

          if (!this.isTurnInProgress) {
            this.isTurnInProgress = true;
            this.currentTurnId = this.audioPlayback.startNewTurn();
            this.lastAiSpeechStartTime = Date.now();
            this.ngZone.run(() => {
              this.setStatus('SPEAKING');
            });
          }

          for (const part of sc.modelTurn.parts) {
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData) {
              const mime = inlineData.mimeType || inlineData.mime_type || '';
              if (inlineData.data && (mime.startsWith('audio/') || !mime)) {
                this.audioPlayback.enqueueBase64Pcm(inlineData.data, 24000, this.currentTurnId);
              }
            }
            if (part.text) {
              const current = this.outputTranscript$.value + part.text;
              this.outputTranscript$.next(current);
            }
          }
        }

        if (sc.turnComplete) {
          this.isTurnInProgress = false;
          if (this.pendingUserTranscript.trim()) {
            const userText = this.pendingUserTranscript.trim();
            this.pendingUserTranscript = '';
            this.inputTranscript$.next('');
            this.ngZone.run(() => {
              this.transcriptEvent$.next({ role: 'user', text: userText });
            });
          }

          if (this.isProcessingScreenQuery) {
            // Screen analysis is actively in flight with Gemini 3.1 Flash-Lite; maintain THINKING state
            this.outputTranscript$.next('');
            return;
          }

          const finalOutput = this.outputTranscript$.value.trim();
          if (finalOutput) {
            this.outputTranscript$.next('');
            this.ngZone.run(() => {
              this.transcriptEvent$.next({ role: 'assistant', text: finalOutput });
            });
          }
          if (!this.audioPlayback.isSpeaking$.value) {
            this.ngZone.run(() => {
              this.setStatus('LISTENING');
            });
          }
        }
      }

    } catch (e) {
      console.warn('GeminiLiveService: Frame parse error:', e);
    }
  }

  private handleUserMicChunk(chunk: AudioPcmChunk) {
    if (!this.isSetupComplete) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const isSpeaking = this.audioPlayback.isSpeaking$.value;

    if (isSpeaking) {
      // Acoustic Gate: AI is currently speaking.
      // 1. Brief 250ms lockout so playback starts cleanly without click transients
      const timeSinceSpeechStart = Date.now() - this.lastAiSpeechStartTime;
      if (timeSinceSpeechStart > 250) {
        // 2. Speaker volume comparison
        const speakerRms = this.audioPlayback.outputVolumeRms$.value;
        // With browser AEC active, speaker bleed into the mic is typically < 0.025 RMS.
        // User voice in near-field is typically 0.045 - 0.25 RMS.
        // Scale threshold gracefully with speaker output:
        const bargeInThreshold = Math.max(0.038, speakerRms * 0.05 + 0.028);

        // Check if user is actively speaking above threshold
        if (chunk.rms >= bargeInThreshold && chunk.isVoice) {
          this.loudFrameCount++;
          // 2 consecutive frames (~128ms) of voice OR 1 firm/loud syllable (rms >= 0.08) triggers barge-in!
          if (this.loudFrameCount >= 2 || chunk.rms >= 0.08) {
            console.log(`GeminiLiveService: Barge-in triggered! (Mic RMS: ${chunk.rms.toFixed(3)}, Speaker RMS: ${speakerRms.toFixed(3)}, Thresh: ${bargeInThreshold.toFixed(3)}). Halting AI.`);
            this.triggerBargeInInterruption();
            this.loudFrameCount = 0;
            this.sendPcmToGemini(chunk.base64);
            return;
          }
        } else {
          if (this.loudFrameCount > 0) this.loudFrameCount--;
        }
      } else {
        this.loudFrameCount = 0;
      }
      // While AI is speaking and user is NOT speaking, suppress mic frames to avoid acoustic feedback
      return;
    }

    this.loudFrameCount = 0;

    // Post-speech reverb tail: drop to prevent speaker room echo re-trigger (120ms)
    if (Date.now() - this.lastAiSpeechEndTime < 120) {
      return;
    }

    // Direct live microphone 16kHz PCM streaming to Gemini Live
    this.sendPcmToGemini(chunk.base64);
  }

  private sendPcmToGemini(base64Pcm: string) {
    if (!base64Pcm || typeof base64Pcm !== 'string' || base64Pcm.length < 10) return;
    // Validate Base64 padding/length: must be a multiple of 4
    if (base64Pcm.length % 4 !== 0) {
      console.warn('GeminiLiveService: Discarding corrupt Base64 chunk with invalid length', base64Pcm.length);
      return;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Pcm
          }
        }
      }));
    }
  }

  public sendScreenFrame(base64Jpeg: string): boolean {
    if (!base64Jpeg || typeof base64Jpeg !== 'string') return false;
    const cleanBase64 = base64Jpeg.replace(/^data:image\/[a-z]+;base64,/, '').trim();
    if (cleanBase64.length < 100 || cleanBase64.startsWith('data:') || !/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
      return false;
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isSetupComplete) {
      const framePayload = {
        realtimeInput: {
          video: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        }
      };
      this.ws.send(JSON.stringify(framePayload));
      return true;
    }
    return false;
  }

  public triggerBargeInInterruption() {
    this.lastAiSpeechEndTime = 0; // Reset reverb tail guard so user's words right after interrupting are NOT dropped!
    this.handleInterruption();
  }

  public handleInterruption() {
    this.isTurnInProgress = false;
    this.setStatus('INTERRUPTED');
    this.voiceCoordinator.stopAllVoices();
    this.currentTurnId = this.audioPlayback.activeTurnId;
    this.outputTranscript$.next('');
    setTimeout(() => {
      if (this.status$.value === 'INTERRUPTED') {
        this.setStatus('LISTENING');
      }
    }, 150);
  }

  private handleConnectionFailure() {
    if (this.status$.value === 'ENDED' || this.status$.value === 'IDLE') return;

    if (this.reconnectTimer) {
      return; // Already debounced reconnect scheduled
    }

    this.reconnectAttempts++;
    this.setStatus('RECONNECTING');

    const backoffMs = Math.min(3000, this.reconnectAttempts * 800);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.status$.value !== 'ENDED' && this.status$.value !== 'IDLE') {
        this.connectWebSocket();
      }
    }, backoffMs);
  }

  public endLiveSession() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeatMonitor();
    this.setStatus('ENDED');
    this.isConnecting = false;
    this.isTurnInProgress = false;
    this.loudFrameCount = 0;
    this.pendingUserTranscript = '';
    this.isProcessingScreenQuery = false;
    this.voiceCoordinator.stopAllVoices();
    this.audioCapture.stopCapture();

    if (this.pcmSub) {
      this.pcmSub.unsubscribe();
      this.pcmSub = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
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
