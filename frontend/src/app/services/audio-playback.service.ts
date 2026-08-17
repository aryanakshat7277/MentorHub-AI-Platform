import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioPlaybackService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private animFrameId: number | null = null;

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
   * Enqueues Base64 encoded PCM 24kHz audio or binary ArrayBuffer for immediate streaming playback
   */
  public enqueueBase64Pcm(base64Audio: string, sampleRate = 24000) {
    if (!base64Audio) return;
    try {
      const binary = window.atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      this.enqueueArrayBuffer(bytes.buffer, sampleRate);
    } catch (e) {
      console.warn('AudioPlaybackService: Base64 decode error:', e);
    }
  }

  public enqueueArrayBuffer(buffer: ArrayBuffer, sampleRate = 24000) {
    this.initContextIfNeeded(sampleRate);
    this.audioQueue.push(buffer);

    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.audioQueue.length === 0 || !this.audioCtx || this.audioCtx.state === 'closed') {
      this.isPlaying = false;
      this.isSpeaking$.next(false);
      this.outputVolumeRms$.next(0);
      return;
    }

    this.isPlaying = true;
    this.isSpeaking$.next(true);

    const chunk = this.audioQueue.shift()!;
    try {
      const audioBuffer = this.pcm16ToAudioBuffer(chunk, this.audioCtx, 24000);
      
      this.currentSourceNode = this.audioCtx.createBufferSource();
      this.currentSourceNode.buffer = audioBuffer;
      
      if (this.analyser) {
        this.currentSourceNode.connect(this.analyser);
      } else {
        this.currentSourceNode.connect(this.audioCtx.destination);
      }

      this.startVolumeMonitoring();

      this.currentSourceNode.onended = () => {
        this.currentSourceNode = null;
        this.processQueue();
      };

      this.currentSourceNode.start(0);

    } catch (err) {
      console.warn('AudioPlaybackService: Audio chunk decoding error:', err);
      this.processQueue();
    }
  }

  /**
   * Immediate Barge-in / Interruption: Stops active playback and flushes queue instantly (< 10ms)
   */
  public interrupt() {
    this.audioQueue = [];

    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop(0);
        this.currentSourceNode.disconnect();
      } catch (e) {}
      this.currentSourceNode = null;
    }

    this.isPlaying = false;
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
      if (!this.isPlaying || !this.analyser) {
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
