import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  constructor(private ngZone: NgZone) {}

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

  /**
   * Enqueues Base64 encoded PCM 24kHz audio or binary ArrayBuffer for sample-accurate WebAudio streaming playback.
   * Drops chunk if it belongs to an older/interrupted turn generation.
   */
  public enqueueBase64Pcm(base64Audio: string, sampleRate = 24000, turnId?: number) {
    if (!base64Audio) return;
    if (turnId !== undefined && turnId !== this.activeTurnId) {
      // Discard stale chunk from previous turn
      return;
    }
    try {
      const binary = window.atob(base64Audio);
      const len = binary.length;
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
      // Discard stale chunk from previous turn
      return;
    }

    this.initContextIfNeeded(sampleRate);
    if (!this.audioCtx) return;

    try {
      const audioBuffer = this.pcm16ToAudioBuffer(buffer, this.audioCtx, sampleRate);
      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.analyser) {
        source.connect(this.analyser);
      } else {
        source.connect(this.audioCtx.destination);
      }

      const currentTime = this.audioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.03; // 30ms buffer jitter compensation
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      this.isSpeaking$.next(true);
      this.startVolumeMonitoring();

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          const remainingTime = this.audioCtx ? (this.nextStartTime - this.audioCtx.currentTime) : 0;
          if (remainingTime <= 0.05) {
            this.isSpeaking$.next(false);
            this.outputVolumeRms$.next(0);
          } else {
            setTimeout(() => {
              if (this.activeSources.length === 0) {
                this.isSpeaking$.next(false);
                this.outputVolumeRms$.next(0);
              }
            }, Math.max(10, remainingTime * 1000));
          }
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
    this.activeTurnId++; // Invalidate any incoming chunks from the interrupted turn
    this.activeSources.forEach(source => {
      try {
        source.stop(0);
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = 0;

    this.isSpeaking$.next(false);
    this.outputVolumeRms$.next(0);

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private startVolumeMonitoring() {
    const dataArray = new Uint8Array(32);

    const updateVolume = () => {
      if (this.activeSources.length === 0 || !this.analyser) {
        this.outputVolumeRms$.next(0);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 128);

      this.ngZone.runOutsideAngular(() => {
        this.outputVolumeRms$.next(normalized);
      });

      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    if (this.animFrameId === null) {
      this.animFrameId = requestAnimationFrame(updateVolume);
    }
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
