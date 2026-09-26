import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VoiceCoordinatorService } from './voice-coordinator.service';

@Injectable({
  providedIn: 'root'
})
export class AudioPlaybackService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private animFrameId: number | null = null;
  public activeTurnId = 0; // Generation/Turn sequence tracker to prevent overlapping voices

  public isSpeaking$ = new BehaviorSubject<boolean>(false);
  public outputVolumeRms$ = new BehaviorSubject<number>(0);

  constructor(
    private ngZone: NgZone,
    private voiceCoordinator: VoiceCoordinatorService
  ) {
    // Register preemption handler so another voice can cleanly interrupt Gemini Live playback
    this.voiceCoordinator.registerPreemptHandler('gemini-live', () => {
      this.interrupt();
    });
  }

  public ensureContext(sampleRate = 24000) {
    this.initContextIfNeeded(sampleRate);
  }

  private initContextIfNeeded(sampleRate = 24000) {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Resets playback and starts a fresh turn generation ID.
   * Any late/stale chunks from previous turns are dropped immediately.
   */
  public startNewTurn(): number {
    this.interrupt();
    return this.activeTurnId;
  }

  private speakingEndTimer: any = null;
  private lastRmsEmitTime = 0;

  /**
   * Enqueues Base64 encoded PCM 24kHz audio or binary ArrayBuffer for sample-accurate WebAudio streaming playback.
   * Drops chunk if it belongs to an older/interrupted turn generation.
   */
  public enqueueBase64Pcm(base64Audio: string, sampleRate = 24000, turnId?: number) {
    if (!base64Audio) return;
    if (turnId !== undefined && turnId !== this.activeTurnId) {
      return;
    }
    try {
      const binary = window.atob(base64Audio);
      // Ensure even number of bytes for 16-bit signed PCM (2 bytes per sample)
      const len = binary.length - (binary.length % 2);
      if (len <= 0) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      this.enqueueArrayBuffer(bytes.buffer, sampleRate, turnId);
    } catch (e) {
      console.warn('AudioPlaybackService: Base64 decode error:', e);
    }
  }

  public enqueueArrayBuffer(buffer: ArrayBuffer, sampleRate = 24000, turnId?: number) {
    if (turnId !== undefined && turnId !== this.activeTurnId) {
      return;
    }

    const byteLen = buffer.byteLength - (buffer.byteLength % 2);
    if (byteLen <= 0) return;

    this.initContextIfNeeded(sampleRate);
    if (!this.audioCtx) return;

    try {
      if (this.speakingEndTimer) {
        clearTimeout(this.speakingEndTimer);
        this.speakingEndTimer = null;
      }

      // Only acquire lock and set isSpeaking = true once when playback begins (prevents 50x/sec change detection thrashing)
      if (!this.isSpeaking$.value) {
        this.voiceCoordinator.acquireVoice('gemini-live');
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        this.ngZone.run(() => {
          this.isSpeaking$.next(true);
        });
      }

      const safeBuffer = byteLen === buffer.byteLength ? buffer : buffer.slice(0, byteLen);
      const audioBuffer = this.pcm16ToAudioBuffer(safeBuffer, this.audioCtx, sampleRate);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.analyser) {
        source.connect(this.analyser);
      } else {
        source.connect(this.audioCtx.destination);
      }

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.025;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      this.startVolumeMonitoring();

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          const remainingTime = this.audioCtx ? Math.max(0, this.nextStartTime - this.audioCtx.currentTime) : 0;
          const waitMs = Math.max(160, Math.round(remainingTime * 1000) + 120);
          if (this.speakingEndTimer) clearTimeout(this.speakingEndTimer);
          this.speakingEndTimer = setTimeout(() => {
            if (this.activeSources.length === 0) {
              this.ngZone.run(() => {
                this.isSpeaking$.next(false);
                this.outputVolumeRms$.next(0);
              });
              this.voiceCoordinator.releaseVoice('gemini-live');
            }
          }, waitMs);
        }
      };

    } catch (err) {
      console.warn('AudioPlaybackService: Audio chunk scheduling error:', err);
    }
  }

  /**
   * Immediate Barge-in / Interruption: Stops active playback, flushes hardware queue instantly (< 10ms),
   * and increments activeTurnId so any trailing in-flight network chunks are discarded.
   */
  public interrupt() {
    this.activeTurnId++;
    if (this.speakingEndTimer) {
      clearTimeout(this.speakingEndTimer);
      this.speakingEndTimer = null;
    }
    this.activeSources.forEach(source => {
      try {
        source.stop(0);
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;

    if (this.isSpeaking$.value) {
      this.ngZone.run(() => {
        this.isSpeaking$.next(false);
        this.outputVolumeRms$.next(0);
      });
    }
    this.voiceCoordinator.releaseVoice('gemini-live');

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private startVolumeMonitoring() {
    if (this.animFrameId !== null) return;
    const dataArray = new Uint8Array(32);

    const updateVolume = () => {
      if (this.activeSources.length === 0 || !this.analyser) {
        this.animFrameId = null;
        this.outputVolumeRms$.next(0);
        return;
      }

      const now = performance.now();
      // Throttle RMS emissions to ~16 FPS (every 60ms) so Angular change detection never saturates the CPU
      if (now - this.lastRmsEmitTime >= 60) {
        this.lastRmsEmitTime = now;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        this.outputVolumeRms$.next(normalized);
      }

      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    this.animFrameId = requestAnimationFrame(updateVolume);
  }

  private pcm16ToAudioBuffer(buffer: ArrayBuffer, ctx: AudioContext, sampleRate: number): AudioBuffer {
    const int16Array = new Int16Array(buffer);
    const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }
    return audioBuffer;
  }
}
