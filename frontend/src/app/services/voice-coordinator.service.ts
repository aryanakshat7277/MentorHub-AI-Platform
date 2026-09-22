import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type VoiceChannel =
  | 'gemini-live'          // Native Gemini Web Audio PCM stream
  | 'chatbot-tts'          // AI Chatbot browser speech synthesis
  | 'mock-viva-examiner'   // Mock Viva examiner speech synthesis
  | 'mock-viva-answer';    // Mock Viva model answer speech synthesis

@Injectable({
  providedIn: 'root'
})
export class VoiceCoordinatorService {
  private activeChannelSubject = new BehaviorSubject<VoiceChannel | null>(null);
  public activeChannel$: Observable<VoiceChannel | null> = this.activeChannelSubject.asObservable();

  // Callbacks registered by voice providers to handle preemption/interruptions cleanly
  private preemptHandlers = new Map<VoiceChannel, () => void>();

  constructor() {}

  /**
   * Register a preemption callback for a specific voice channel.
   * When another voice channel acquires the lock, this handler is executed immediately.
   */
  public registerPreemptHandler(channel: VoiceChannel, handler: () => void): void {
    this.preemptHandlers.set(channel, handler);
  }

  public unregisterPreemptHandler(channel: VoiceChannel): void {
    this.preemptHandlers.delete(channel);
  }

  /**
   * Returns the currently speaking voice channel, or null if idle.
   */
  public get activeChannel(): VoiceChannel | null {
    return this.activeChannelSubject.value;
  }

  /**
   * Checks if a specific channel is currently speaking.
   */
  public isChannelActive(channel: VoiceChannel): boolean {
    return this.activeChannelSubject.value === channel;
  }

  /**
   * Checks if ANY voice is currently speaking.
   */
  public isAnyVoiceActive(): boolean {
    return this.activeChannelSubject.value !== null;
  }

  /**
   * Strict Mutex: Acquires the global voice lock for the requested channel.
   * Immediately terminates whatever other voice type was speaking and flushes pending speech synthesis.
   */
  public acquireVoice(channel: VoiceChannel): void {
    const current = this.activeChannelSubject.value;

    // If another channel is speaking, preempt it immediately
    if (current && current !== channel) {
      this.preemptChannel(current);
    }

    // Always cancel browser speech synthesis if switching or starting Web Audio
    if (channel === 'gemini-live' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.activeChannelSubject.next(channel);
  }

  /**
   * Releases the voice lock when a voice finishes playback naturally.
   */
  public releaseVoice(channel: VoiceChannel): void {
    if (this.activeChannelSubject.value === channel) {
      this.activeChannelSubject.next(null);
    }
  }

  /**
   * Stops a specific voice channel and invokes its preemption handler.
   */
  public preemptChannel(channel: VoiceChannel): void {
    const handler = this.preemptHandlers.get(channel);
    if (handler) {
      try {
        handler();
      } catch (e) {
        console.warn(`VoiceCoordinatorService: Error executing preemption for ${channel}`, e);
      }
    }
    if (this.activeChannelSubject.value === channel) {
      this.activeChannelSubject.next(null);
    }
  }

  /**
   * Complete Audio Silence: Stops all active voices across the entire platform.
   */
  public stopAllVoices(): void {
    const current = this.activeChannelSubject.value;
    if (current) {
      this.preemptChannel(current);
    }

    // Execute all registered preemption handlers to ensure zero audio residue
    this.preemptHandlers.forEach((handler, ch) => {
      try {
        handler();
      } catch (e) {
        console.warn(`VoiceCoordinatorService: Error stopping voice on channel ${ch}`, e);
      }
    });

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.activeChannelSubject.next(null);
  }
}
