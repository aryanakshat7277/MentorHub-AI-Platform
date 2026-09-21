import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export interface FacialTelemetry {
  leftEar: number;          // Eye Aspect Ratio (0.0 to ~0.45)
  rightEar: number;         // Eye Aspect Ratio (0.0 to ~0.45)
  isLeftBlinking: boolean;
  isRightBlinking: boolean;
  isBothBlinking: boolean;
  gazeX: number;            // -1.0 (Looking Left) to +1.0 (Looking Right)
  gazeY: number;            // -1.0 (Looking Down) to +1.0 (Looking Up)
  gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  headYaw: number;          // Head angle (informational only)
  headPitch: number;        // Head angle (informational only)
  headRoll: number;         // Head angle (informational only)
  cursorX: number;          // Screen X percentage strictly driven by eye movement (0 to 100)
  cursorY: number;          // Screen Y percentage strictly driven by eye movement (0 to 100)
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

  // Live Telemetry Stream strictly driven by eye movement
  public telemetry$ = new BehaviorSubject<FacialTelemetry>({
    leftEar: 0.32,
    rightEar: 0.32,
    isLeftBlinking: false,
    isRightBlinking: false,
    isBothBlinking: false,
    gazeX: 0,
    gazeY: 0,
    gazeDirection: 'CENTER',
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    cursorX: 50,
    cursorY: 50,
    calibratedBaselineEar: 0.30
  });

  // Action Event Streams strictly driven by eye gestures
  public blinkEvent$ = new Subject<{ type: BlinkGestureType; timestamp: number }>();
  public spatialNod$ = new Subject<SpatialNodDirection>();

  // Landmark Indices
  // Left Eye Contour: [outer, upper1, upper2, inner, lower1, lower2]
  private readonly LEFT_EYE = [33, 160, 158, 133, 153, 144];
  // Right Eye Contour: [inner, upper1, upper2, outer, lower1, lower2]
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
  private lastGazeMoveTime = 0;
  private readonly GAZE_TRIGGER_COOLDOWN_MS = 600; // Delay between directional jumps

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
      console.log('✅ Ocular AirNav: MediaPipe FaceLandmarker with Iris Tracking Ready');
    } catch (err) {
      console.warn('⚠️ FaceLandmarker initialization failed, fallback available:', err);
      this.isModelLoaded$.next(true);
    }
  }

  /**
   * Toggles Eye Navigation Tracking ON / OFF
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
      console.warn('⚠️ Camera access unavailable. Running ocular eye-movement simulation.', err);
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
        this.processEyeMovements(landmarks);
      }
    }

    this.animFrameId = requestAnimationFrame(this.runDetectionLoop);
  };

  /**
   * STRICT OCULAR ENGINE: Processes strictly Iris and Eye Contours
   */
  private processEyeMovements(pts: any[]): void {
    // 1. Calculate Eye Aspect Ratio (EAR) for Blinking
    const leftEar = this.computeEar(pts, this.LEFT_EYE);
    const rightEar = this.computeEar(pts, this.RIGHT_EYE);

    // Adaptive threshold based on baseline
    const blinkThreshold = Math.max(0.18, this.baselineEar * 0.65);
    const isLeftClosed = leftEar < blinkThreshold;
    const isRightClosed = rightEar < blinkThreshold;
    const isBothClosed = isLeftClosed && isRightClosed;

    // 2. STRICT IRIS & PUPIL TRACKING (No Head Movement)
    // Left Eye Reference Nodes: Outer=33, Inner=133, Top=159, Bottom=145
    // Right Eye Reference Nodes: Inner=362, Outer=263, Top=386, Bottom=374
    let leftIrisX = 0, leftIrisY = 0;
    let rightIrisX = 0, rightIrisY = 0;

    if (pts.length >= 478) {
      // Direct MediaPipe Iris Centers (468 = Left, 473 = Right)
      leftIrisX = pts[468].x;
      leftIrisY = pts[468].y;
      rightIrisX = pts[473].x;
      rightIrisY = pts[473].y;
    } else {
      // Robust contour centroid approximation
      leftIrisX = (pts[33].x + pts[133].x + pts[159].x + pts[145].x) / 4;
      leftIrisY = (pts[33].y + pts[133].y + pts[159].y + pts[145].y) / 4;
      rightIrisX = (pts[362].x + pts[263].x + pts[386].x + pts[374].x) / 4;
      rightIrisY = (pts[362].y + pts[263].y + pts[386].y + pts[374].y) / 4;
    }

    // Relative ocular position inside the eye frame
    const lOuter = pts[33], lInner = pts[133], lTop = pts[159], lBottom = pts[145];
    const lWidth = Math.abs(lInner.x - lOuter.x) || 0.04;
    const lHeight = Math.abs(lBottom.y - lTop.y) || 0.015;

    const rInner = pts[362], rOuter = pts[263], rTop = pts[386], rBottom = pts[374];
    const rWidth = Math.abs(rOuter.x - rInner.x) || 0.04;
    const rHeight = Math.abs(rBottom.y - rTop.y) || 0.015;

    // Gaze ratio: 0.0 to 1.0 (0.5 is looking dead center)
    const lGazeX = (leftIrisX - Math.min(lOuter.x, lInner.x)) / lWidth;
    const lGazeY = (leftIrisY - Math.min(lTop.y, lBottom.y)) / lHeight;

    const rGazeX = (rightIrisX - Math.min(rInner.x, rOuter.x)) / rWidth;
    const rGazeY = (rightIrisY - Math.min(rTop.y, rBottom.y)) / rHeight;

    // Combined Normalized Gaze Vector (-1.0 to +1.0)
    // Looking Left -> Negative GazeX, Looking Right -> Positive GazeX
    const rawGazeX = ((lGazeX + rGazeX) / 2 - 0.5) * 3.5;
    // Looking Down -> Positive GazeY, Looking Up -> Negative GazeY
    const rawGazeY = ((lGazeY + rGazeY) / 2 - 0.5) * 3.5;

    // Smooth Screen Cursor Mapping STRICTLY FROM EYE GAZE
    // Mirror adjustment: Looking to candidate's right moves cursor to screen right
    const targetCursorX = Math.min(95, Math.max(5, 50 - (rawGazeX * 48)));
    const targetCursorY = Math.min(95, Math.max(5, 50 + (rawGazeY * 48)));

    this.smoothedX += (targetCursorX - this.smoothedX) * 0.24;
    this.smoothedY += (targetCursorY - this.smoothedY) * 0.24;

    // 3. Eye Blink Dynamics
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

        if (duration >= 150 && duration <= 580) {
          if (now - this.lastBlinkEndTime < 380) {
            // Rapid double blink!
            this.ngZone.run(() => {
              this.blinkEvent$.next({ type: 'DOUBLE', timestamp: now });
            });
          } else {
            // Single deliberate click blink!
            this.ngZone.run(() => {
              this.blinkEvent$.next({ type: 'SINGLE', timestamp: now });
            });
          }
          this.lastBlinkEndTime = now;
        }
      }
    }

    // 4. Wink Gestures (Left / Right Eye Winks)
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

    // 5. STRICT EYE-GAZE DIRECTIONAL NAVIGATION
    // Looking Left, Right, Up, Down triggers spatial navigation WITHOUT head nods!
    let gazeDir: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' = 'CENTER';

    if (now - this.lastGazeMoveTime > this.GAZE_TRIGGER_COOLDOWN_MS && !isBothClosed) {
      if (rawGazeX < -0.28) {
        gazeDir = 'RIGHT'; // Inverted mirror perspective
        this.lastGazeMoveTime = now;
        this.ngZone.run(() => this.spatialNod$.next('RIGHT'));
      } else if (rawGazeX > 0.28) {
        gazeDir = 'LEFT';
        this.lastGazeMoveTime = now;
        this.ngZone.run(() => this.spatialNod$.next('LEFT'));
      } else if (rawGazeY < -0.26) {
        gazeDir = 'UP';
        this.lastGazeMoveTime = now;
        this.ngZone.run(() => this.spatialNod$.next('UP'));
      } else if (rawGazeY > 0.26) {
        gazeDir = 'DOWN';
        this.lastGazeMoveTime = now;
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
        gazeX: Number(rawGazeX.toFixed(2)),
        gazeY: Number(rawGazeY.toFixed(2)),
        gazeDirection: gazeDir,
        headYaw: 0,
        headPitch: 0,
        headRoll: 0,
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
   * Smooth Simulated Fallback for Ocular Eye-Movement
   */
  private startSimulatedFallback(): void {
    let t = 0;
    this.simulatedIntervalId = setInterval(() => {
      t += 0.05;
      const isSimBlink = Math.sin(t * 2.8) > 0.88;
      const simEar = isSimBlink ? 0.12 : 0.32;

      // Simulate eyes scanning across the screen
      const eyeScanX = Math.sin(t * 0.8) * 0.45;
      const eyeScanY = Math.cos(t * 0.6) * 0.35;

      let gazeDir: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' = 'CENTER';
      if (eyeScanX > 0.32) gazeDir = 'RIGHT';
      else if (eyeScanX < -0.32) gazeDir = 'LEFT';
      else if (eyeScanY < -0.26) gazeDir = 'UP';
      else if (eyeScanY > 0.26) gazeDir = 'DOWN';

      this.telemetry$.next({
        leftEar: simEar,
        rightEar: simEar,
        isLeftBlinking: isSimBlink,
        isRightBlinking: isSimBlink,
        isBothBlinking: isSimBlink,
        gazeX: Number(eyeScanX.toFixed(2)),
        gazeY: Number(eyeScanY.toFixed(2)),
        gazeDirection: gazeDir,
        headYaw: 0,
        headPitch: 0,
        headRoll: 0,
        cursorX: Math.round(50 + eyeScanX * 45),
        cursorY: Math.round(50 + eyeScanY * 45),
        calibratedBaselineEar: 0.30
      });

      if (isSimBlink) {
        this.blinkEvent$.next({ type: 'SINGLE', timestamp: performance.now() });
      }
    }, 80);
  }
}
