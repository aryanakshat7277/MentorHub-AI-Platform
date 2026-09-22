import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioCaptureService {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  public pcmChunk$ = new Subject<string>(); // Emits Base64 PCM 16kHz audio chunks
  public volumeRms$ = new BehaviorSubject<number>(0); // Emits 0..1 volume level for audio-reactive waveform
  public isRecording$ = new BehaviorSubject<boolean>(false);

  private animFrameId: number | null = null;

  constructor(private ngZone: NgZone) {}

  async startCapture(): Promise<boolean> {
    if (this.isRecording$.value) return true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true, // Enables browser hardware/DSP noise suppression
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 16000 });

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      // Vocal Bandpass Filters: High-pass (250Hz) eliminates room rumble/fans; Low-pass (3400Hz) eliminates clicks/hiss
      const highpass = this.audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(250, this.audioCtx.currentTime);

      const lowpass = this.audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3400, this.audioCtx.currentTime);

      // 512 samples at 16kHz = ~32ms chunks
      this.scriptNode = this.audioCtx.createScriptProcessor(512, 1, 1);

      this.sourceNode.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(this.analyser);
      this.analyser.connect(this.scriptNode);
      // Zero-gain mute node keeps ScriptProcessor active in Web Audio graph
      // while preventing physical microphone audio from leaking into speakers (acoustic echo loopback prevention)
      const silenceGain = this.audioCtx.createGain();
      silenceGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.scriptNode.connect(silenceGain);
      silenceGain.connect(this.audioCtx.destination);

      this.scriptNode.onaudioprocess = (evt: AudioProcessingEvent) => {
        if (!this.isRecording$.value) return;

        const inputBuffer = evt.inputBuffer.getChannelData(0);
        const pcm16 = this.float32ToInt16WithGain(inputBuffer, 1.0); // 1.0x unity gain prevents amplifying background noise floor
        const base64Chunk = this.arrayBufferToBase64(pcm16.buffer);

        this.pcmChunk$.next(base64Chunk);
      };

      this.startVolumeMonitoring();
      this.isRecording$.next(true);
      return true;

    } catch (err) {
      console.error('AudioCaptureService: Failed to access microphone:', err);
      this.stopCapture();
      return false;
    }
  }

  stopCapture() {
    this.isRecording$.next(false);

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode.onaudioprocess = null;
      this.scriptNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.volumeRms$.next(0);
  }

  private startVolumeMonitoring() {
    const dataArray = new Uint8Array(32);

    const updateVolume = () => {
      if (!this.isRecording$.value || !this.analyser) {
        this.volumeRms$.next(0);
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Subtract background noise floor threshold (30) so ambient noise stays strictly 0.0 RMS
      const cleanAvg = Math.max(0, avg - 30);
      const normalized = Math.min(1, cleanAvg / 90.0);

      this.ngZone.runOutsideAngular(() => {
        this.volumeRms$.next(normalized);
      });

      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    this.animFrameId = requestAnimationFrame(updateVolume);
  }

  private float32ToInt16WithGain(buffer: Float32Array, gainMultiplier = 1.0): Int16Array {
    const l = buffer.length;
    const output = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i] * gainMultiplier));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
