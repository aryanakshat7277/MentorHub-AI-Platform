import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export interface FacialTelemetry {
  leftEar: number;          // Eye Aspect Ratio (0.0 to ~0.45)
  rightEar: number;         // Eye Aspect Ratio (0.0 to ~0.45)
  isLeftBlinking: boolean;
  isRightBlinking: boolean;
  isBothBlinking: boolean;
  headYaw: number;          // -1 (Left) to +1 (Right)
  headPitch: number;        // -1 (Down) to +1 (Up)
  headRoll: number;         // -1 (Tilt Left) to +1 (Tilt Right)
  cursorX: number;          // Screen X percentage (0 to 100)
  cursorY: number;          // Screen Y percentage (0 to 100)
  calibratedBaselineEar: number;
  landmarks?: any[];
}

export type BlinkGestureType = 'SINGLE' | 'DOUBLE' | 'LEFT_WINK' | 'RIGHT_WINK';
export type SpatialNodDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

@Injectable({
  providedIn: 'root'
})
export class FacialNavigationService {
  private faceLandmarker: FaceLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private simulatedIntervalId: any = null;

  public isEnabled$ = new BehaviorSubject<boolean>(false);
  public isCameraReady$ = new BehaviorSubject<boolean>(false);
  public isModelLoaded$ = new BehaviorSubject<boolean>(false);

  // Live Telemetry Stream
  public telemetry$ = new BehaviorSubject<FacialTelemetry>({
    leftEar: 0.32,
    rightEar: 0.32,
    isLeftBlinking: false,
    isRightBlinking: false,
    isBothBlinking: false,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    cursorX: 50,
    cursorY: 50,
    calibratedBaselineEar: 0.30
  });

  // Action Event Streams
  public blinkEvent$ = new Subject<{ type: BlinkGestureType; timestamp: number }>();
  public spatialNod$ = new Subject<SpatialNodDirection>();

  // Landmark Indices
  // Left Eye Contour
  private readonly LEFT_EYE = [33, 160, 158, 133, 153, 144];
  // Right Eye Contour
  private readonly RIGHT_EYE = [362, 385, 387, 263, 373, 380];

  // State Tracking
  private isBothBlinkActive = false;
  private bothBlinkStartTime = 0;
  private lastBlinkEndTime = 0;
  private isLeftWinkActive = false;
  private isRightWinkActive = false;
  private winkStartTime = 0;

  // Smoothing & Calibration
  private smoothedX = 50;
  private smoothedY = 50;
  private baselineEar = 0.30;
  private lastNodTime = 0;
  private readonly NOD_COOLDOWN_MS = 650; // Prevent runaway navigation

  constructor(private ngZone: NgZone) {}

  /**
   * Initializes MediaPipe Vision FaceLandmarker
   */
  public async initialize(): Promise<void> {
    if (this.faceLandmarker) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      });

      this.isModelLoaded$.next(true);
      console.log('✅ Cybernetic AirNav: MediaPipe FaceLandmarker Initialized Successfully');
    } catch (err) {
      console.warn('⚠️ FaceLandmarker initialization failed, fallback available:', err);
      this.isModelLoaded$.next(true);
    }
  }

  /**
   * Toggles Facial Navigation Tracking ON / OFF
   */
  public async toggleTracking(): Promise<boolean> {
    if (this.isEnabled$.value) {
      this.stopTracking();
      return false;
    } else {
      return await this.startTracking();
    }
  }

  /**
   * Starts Webcam and Processing Loop
   */
  public async startTracking(): Promise<boolean> {
    await this.initialize();

    try {
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('autoplay', '');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 30 }
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.isCameraReady$.next(true);
      this.isEnabled$.next(true);

      this.runDetectionLoop();
      return true;
    } catch (err) {
      console.warn('⚠️ Camera access denied or hardware not found. Activating simulated facial telemetry.', err);
      this.isEnabled$.next(true);
      this.isCameraReady$.next(true);
      this.startSimulatedFallback();
      return true;
    }
  }

  /**
   * Stops Webcam and Processing Loop
   */
  public stopTracking(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.simulatedIntervalId) {
      clearInterval(this.simulatedIntervalId);
      this.simulatedIntervalId = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      this.videoElement.srcObject = null;
    }

    this.isEnabled$.next(false);
    this.isCameraReady$.next(false);
  }

  /**
   * Main 60 FPS Detection Loop
   */
  private runDetectionLoop = () => {
    if (!this.isEnabled$.value || !this.videoElement) return;

    if (this.faceLandmarker && this.videoElement.readyState >= 2) {
      const startTimeMs = performance.now();
      const results = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs);

      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        this.processFacialLandmarks(landmarks);
      }
    }

    this.animFrameId = requestAnimationFrame(this.runDetectionLoop);
  };

  /**
   * Processes Landmark Coordinates for EAR, Head Pose & Gesture Triggers
   */
  private processFacialLandmarks(pts: any[]): void {
    // 1. Calculate Eye Aspect Ratio (EAR)
    const leftEar = this.computeEar(pts, this.LEFT_EYE);
    const rightEar = this.computeEar(pts, this.RIGHT_EYE);

    // Adaptive threshold based on baseline
    const blinkThreshold = Math.max(0.18, this.baselineEar * 0.65);
    const isLeftClosed = leftEar < blinkThreshold;
    const isRightClosed = rightEar < blinkThreshold;
    const isBothClosed = isLeftClosed && isRightClosed;

    // 2. Head Orientation via Key Facial Reference Nodes
    const nose = pts[1];
    const leftCheek = pts[234];
    const rightCheek = pts[454];
    const forehead = pts[10];
    const chin = pts[152];

    const faceWidth = Math.abs(rightCheek.x - leftCheek.x) || 0.1;
    const faceHeight = Math.abs(chin.y - forehead.y) || 0.1;

    // Yaw: -1.0 (Left) to +1.0 (Right)
    const rawYaw = ((nose.x - (leftCheek.x + rightCheek.x) / 2) / faceWidth) * 2.2;
    // Pitch: -1.0 (Down) to +1.0 (Up)
    const rawPitch = ((forehead.y + chin.y) / 2 - nose.y) / faceHeight * 2.5;
    // Roll: Tilt angle
    const rawRoll = (rightCheek.y - leftCheek.y) * 2;

    // Smooth Cursor Coordinates (EMA Filter: alpha = 0.22)
    const targetCursorX = Math.min(95, Math.max(5, 50 - (rawYaw * 42)));
    const targetCursorY = Math.min(95, Math.max(5, 50 - (rawPitch * 42)));
    this.smoothedX += (targetCursorX - this.smoothedX) * 0.22;
    this.smoothedY += (targetCursorY - this.smoothedY) * 0.22;

    // 3. Process Blink Dynamics
    const now = performance.now();

    if (isBothClosed) {
      if (!this.isBothBlinkActive) {
        this.isBothBlinkActive = true;
        this.bothBlinkStartTime = now;
      }
    } else {
      if (this.isBothBlinkActive) {
        this.isBothBlinkActive = false;
        const duration = now - this.bothBlinkStartTime;

        // Deliberate blink: 150ms to 580ms
        if (duration >= 150 && duration <= 580) {
          if (now - this.lastBlinkEndTime < 380) {
            // Rapid double blink!
            this.ngZone.run(() => {
              this.blinkEvent$.next({ type: 'DOUBLE', timestamp: now });
            });
          } else {
            // Single deliberate blink!
            this.ngZone.run(() => {
              this.blinkEvent$.next({ type: 'SINGLE', timestamp: now });
            });
          }
          this.lastBlinkEndTime = now;
        }
      }
    }

    // 4. Process Left & Right Winks (Single Eye Closed while Other Open)
    if (!isBothClosed) {
      if (isLeftClosed && !isRightClosed) {
        if (!this.isLeftWinkActive) {
          this.isLeftWinkActive = true;
          this.winkStartTime = now;
        } else if (now - this.winkStartTime > 240) {
          this.ngZone.run(() => {
            this.blinkEvent$.next({ type: 'LEFT_WINK', timestamp: now });
          });
          this.isLeftWinkActive = false;
        }
      } else {
        this.isLeftWinkActive = false;
      }

      if (isRightClosed && !isLeftClosed) {
        if (!this.isRightWinkActive) {
          this.isRightWinkActive = true;
          this.winkStartTime = now;
        } else if (now - this.winkStartTime > 240) {
          this.ngZone.run(() => {
            this.blinkEvent$.next({ type: 'RIGHT_WINK', timestamp: now });
          });
          this.isRightWinkActive = false;
        }
      } else {
        this.isRightWinkActive = false;
      }
    }

    // 5. Directional Spatial Nods (Head Pose Trigger)
    if (now - this.lastNodTime > this.NOD_COOLDOWN_MS) {
      if (rawYaw > 0.42) {
        this.lastNodTime = now;
        this.ngZone.run(() => this.spatialNod$.next('RIGHT'));
      } else if (rawYaw < -0.42) {
        this.lastNodTime = now;
        this.ngZone.run(() => this.spatialNod$.next('LEFT'));
      } else if (rawPitch > 0.38) {
        this.lastNodTime = now;
        this.ngZone.run(() => this.spatialNod$.next('UP'));
      } else if (rawPitch < -0.38) {
        this.lastNodTime = now;
        this.ngZone.run(() => this.spatialNod$.next('DOWN'));
      }
    }

    // Emit Live Telemetry
    this.ngZone.run(() => {
      this.telemetry$.next({
        leftEar: Number(leftEar.toFixed(3)),
        rightEar: Number(rightEar.toFixed(3)),
        isLeftBlinking: isLeftClosed,
        isRightBlinking: isRightClosed,
        isBothBlinking: isBothClosed,
        headYaw: Number(rawYaw.toFixed(2)),
        headPitch: Number(rawPitch.toFixed(2)),
        headRoll: Number(rawRoll.toFixed(2)),
        cursorX: Math.round(this.smoothedX),
        cursorY: Math.round(this.smoothedY),
        calibratedBaselineEar: this.baselineEar,
        landmarks: pts
      });
    });
  }

  /**
   * Euclidean Eye Aspect Ratio (EAR) Formula
   */
  private computeEar(pts: any[], idx: number[]): number {
    const dist = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const vert1 = dist(pts[idx[1]], pts[idx[5]]);
    const vert2 = dist(pts[idx[2]], pts[idx[4]]);
    const horiz = dist(pts[idx[0]], pts[idx[3]]);
    return horiz === 0 ? 0.3 : (vert1 + vert2) / (2.0 * horiz);
  }

  /**
   * Calibrates baseline EAR to current user resting eyes
   */
  public calibrateBaseline(): void {
    const current = this.telemetry$.value;
    const avg = (current.leftEar + current.rightEar) / 2;
    if (avg > 0.20) {
      this.baselineEar = Number(avg.toFixed(3));
      console.log(`🎯 Baseline EAR Calibrated to: ${this.baselineEar}`);
    }
  }

  /**
   * Smooth Simulated Fallback for Testing / Headless environments
   */
  private startSimulatedFallback(): void {
    let t = 0;
    this.simulatedIntervalId = setInterval(() => {
      t += 0.06;
      const isSimBlink = Math.sin(t * 2.5) > 0.88;
      const simEar = isSimBlink ? 0.12 : 0.32;
      const yaw = Math.sin(t * 0.7) * 0.3;
      const pitch = Math.cos(t * 0.5) * 0.2;

      this.telemetry$.next({
        leftEar: simEar,
        rightEar: simEar,
        isLeftBlinking: isSimBlink,
        isRightBlinking: isSimBlink,
        isBothBlinking: isSimBlink,
        headYaw: Number(yaw.toFixed(2)),
        headPitch: Number(pitch.toFixed(2)),
        headRoll: 0,
        cursorX: Math.round(50 + yaw * 35),
        cursorY: Math.round(50 + pitch * 35),
        calibratedBaselineEar: 0.30
      });

      if (isSimBlink) {
        this.blinkEvent$.next({ type: 'SINGLE', timestamp: performance.now() });
      }
    }, 80);
  }
}
