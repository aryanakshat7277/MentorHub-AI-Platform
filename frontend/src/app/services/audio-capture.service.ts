import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface AudioPcmChunk {
  base64: string;
  rms: number;
  isVoice: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AudioCaptureService {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  public pcmChunk$ = new Subject<AudioPcmChunk>(); // Emits Base64 PCM 16kHz audio chunks with RMS energy
  public volumeRms$ = new BehaviorSubject<number>(0); // Emits 0..1 volume level for audio-reactive waveform
  public isRecording$ = new BehaviorSubject<boolean>(false);

  private animFrameId: number | null = null;
  private sampleAccumulator: number[] = [];

  // DSP Noise Gate state
  private noiseFloor = 0.015;
  private hangoverFrames = 0;

  constructor(private ngZone: NgZone) {}

  async startCapture(): Promise<boolean> {
    if (this.isRecording$.value) return true;
    this.sampleAccumulator = [];
    this.noiseFloor = 0.015;
    this.hangoverFrames = 0;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 }
        }
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 16000 });

      // Resume context if suspended
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      // 1. High-pass filter: 120Hz (cuts electrical 50/60Hz AC hum, room rumble, table thuds)
      const highpass = this.audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(120, this.audioCtx.currentTime);

      // 2. Low-pass filter: 3800Hz (cuts computer fan whine, high sibilant hiss, electronic noise)
      const lowpass = this.audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3800, this.audioCtx.currentTime);

      // 3. Speech Presence Filter: +2.5dB at 1800Hz (enhances speech clarity/intelligibility)
      const speechPresence = this.audioCtx.createBiquadFilter();
      speechPresence.type = 'peaking';
      speechPresence.frequency.setValueAtTime(1800, this.audioCtx.currentTime);
      speechPresence.Q.setValueAtTime(1.0, this.audioCtx.currentTime);
      speechPresence.gain.setValueAtTime(2.5, this.audioCtx.currentTime);

      // 4. Dynamics Compressor / Gentle Limiter: catches sudden shouting or table bangs without squashing natural speech
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(2.5, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.audioCtx.currentTime);

      // 5. Script processor: 1024 samples
      this.scriptNode = this.audioCtx.createScriptProcessor(1024, 1, 1);

      // Connect DSP chain:
      // source -> highpass -> lowpass -> speechPresence -> compressor -> analyser -> scriptNode
      this.sourceNode.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(speechPresence);
      speechPresence.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.scriptNode);

      // Silent gain sink to keep graph active
      const silenceGain = this.audioCtx.createGain();
      silenceGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.scriptNode.connect(silenceGain);
      silenceGain.connect(this.audioCtx.destination);

      const currentSampleRate = this.audioCtx.sampleRate;

      this.scriptNode.onaudioprocess = (evt: AudioProcessingEvent) => {
        if (!this.isRecording$.value) return;

        const rawBuffer = evt.inputBuffer.getChannelData(0);
        // Resample accurately to 16,000 Hz if hardware driver runs at 44.1k/48k
        const resampled = this.downsampleTo16k(rawBuffer, currentSampleRate);
        for (let i = 0; i < resampled.length; i++) {
          this.sampleAccumulator.push(resampled[i]);
        }

        // Emit fixed-length 1024-sample frames (64ms @ 16kHz = exactly 2048 bytes of 16-bit PCM = 2732 base64 chars)
        while (this.sampleAccumulator.length >= 1024) {
          const chunkFloats = new Float32Array(this.sampleAccumulator.splice(0, 1024));

          // Compute chunk RMS energy for DSP noise gate & barge-in detection
          let sumSquares = 0;
          for (let i = 0; i < chunkFloats.length; i++) {
            sumSquares += chunkFloats[i] * chunkFloats[i];
          }
          const rms = Math.sqrt(sumSquares / chunkFloats.length);

          // Adaptive noise floor tracking: slow exponential moving average
          if (rms < this.noiseFloor * 1.5) {
            this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
          }
          // Threshold: minimum 0.020 or 2.0x measured ambient noise floor
          const gateThreshold = Math.max(0.020, this.noiseFloor * 2.0);

          const isVoice = rms >= gateThreshold;
          if (isVoice) {
            this.hangoverFrames = 6; // ~384ms hangover preserves trailing phonemes & word endings
          } else if (this.hangoverFrames > 0) {
            this.hangoverFrames--;
          }

          const hasVoice = isVoice || this.hangoverFrames > 0;

          if (!hasVoice) {
            // Noise gate: send digital silence to Gemini Live so ambient hiss doesn't trigger server VAD
            chunkFloats.fill(0);
          }

          // Emit UI volume level accurately from chunk RMS (smooth response)
          const uiVolume = Math.min(1, Math.max(0, (rms - 0.012) / 0.12));
          this.volumeRms$.next(uiVolume);

          // Convert to PCM16 with balanced 1.15x gain (prevents clipping)
          const pcm16 = this.float32ToInt16WithGain(chunkFloats, 1.15);
          const base64Chunk = this.arrayBufferToBase64(pcm16.buffer);

          this.pcmChunk$.next({
            base64: base64Chunk,
            rms: rms,
            isVoice: hasVoice
          });
        }
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
    this.sampleAccumulator = [];
    this.noiseFloor = 0.015;
    this.hangoverFrames = 0;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode.onaudioprocess = null;
      this.scriptNode = null;
    }

    if (this.compressor) {
      this.compressor.disconnect();
      this.compressor = null;
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
      // Gentle noise floor subtraction so normal voice reacts cleanly
      const cleanAvg = Math.max(0, avg - 14);
      const normalized = Math.min(1, cleanAvg / 75.0);

      this.volumeRms$.next(normalized);
      this.animFrameId = requestAnimationFrame(updateVolume);
    };

    this.animFrameId = requestAnimationFrame(updateVolume);
  }

  private downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
    if (inputSampleRate === 16000) return input;
    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetInput = 0;
    while (offsetResult < result.length) {
      const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
      let sum = 0;
      let count = 0;
      for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
        sum += input[i];
        count++;
      }
      result[offsetResult] = count > 0 ? sum / count : 0;
      offsetResult++;
      offsetInput = nextOffsetInput;
    }
    return result;
  }

  private float32ToInt16WithGain(buffer: Float32Array, gainMultiplier = 1.5): Int16Array {
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
