import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;

  constructor() {}

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  playClickSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch (e) {
      // Audio not permitted without user gesture
    }
  }

  playSuccessSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, this.audioCtx.currentTime + 0.15); // E5

      osc2.frequency.setValueAtTime(659.25, this.audioCtx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(783.99, this.audioCtx.currentTime + 0.3); // G5

      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start(this.audioCtx.currentTime + 0.15);

      osc1.stop(this.audioCtx.currentTime + 0.15);
      osc2.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio fallback
    }
  }

  playClick() {
    this.playClickSound();
  }

  playSuccess() {
    this.playSuccessSound();
  }

  playVictoryFanfare() {
    this.playQuestCompleteSound();
  }

  playQuestCompleteSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // Arpeggio C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.12, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }

  playChestOpenSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playFanfareSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // Fanfare: G4, C5, E5, G5 sustained chord
      const chords = [
        { f: 392.00, t: 0, d: 0.15 },
        { f: 523.25, t: 0.15, d: 0.15 },
        { f: 659.25, t: 0.30, d: 0.15 },
        { f: 783.99, t: 0.45, d: 0.60 },
        { f: 1046.50, t: 0.45, d: 0.60 }
      ];

      chords.forEach(c => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(c.f, now + c.t);
        gain.gain.setValueAtTime(0.14, now + c.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + c.d);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(now + c.t);
        osc.stop(now + c.t + c.d);
      });
    } catch (e) {}
  }
}
