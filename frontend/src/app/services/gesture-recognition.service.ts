import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export type GestureType = 'NONE' | 'SCROLL' | 'NAV_DOT' | 'PINCH_CLICK';

export interface GestureFeedback {
  gesture: GestureType;
  label: string;
  emoji: string;
  timestamp: number;
}

export interface ScrollEventData {
  deltaY: number;
  speed: number;
  direction: 'UP' | 'DOWN' | 'NONE';
  normalizedDisplacement: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  isPinching: boolean;
  dwellProgress: number;
  isVisible: boolean;
  isScrollMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GestureRecognitionService {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private watchdogIntervalId: any = null;

  // Observables
  public isEnabled$ = new BehaviorSubject<boolean>(false);
  public isModelLoaded$ = new BehaviorSubject<boolean>(false);
  public isCameraReady$ = new BehaviorSubject<boolean>(false);
  public currentGesture$ = new BehaviorSubject<GestureType>('NONE');
  public handLandmarks$ = new BehaviorSubject<any[] | null>(null);
  public gestureFeedback$ = new Subject<GestureFeedback>();

  // 1. Single Dot Navigation Cursor State
  public cursorPosition$ = new BehaviorSubject<CursorPosition>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
    isPinching: false,
    dwellProgress: 0,
    isVisible: false,
    isScrollMode: false
  });

  // 2. Precision Scroll State
  public scrollData$ = new BehaviorSubject<ScrollEventData>({
    deltaY: 0,
    speed: 0,
    direction: 'NONE',
    normalizedDisplacement: 0
  });

  // Frame Watchdog & Monotonic Timestamp Engine
  private lastVideoTime = -1;
  private lastVisionTimestamp = 0;
  private lastFrameProcessedTime = 0;

  // Adaptive 1-Euro Style Dynamic Smoothing Engine for Zero Tremor
  private smoothedCursorX = 0.5;
  private smoothedCursorY = 0.5;
  private lastRawCursorX = 0.5;
  private lastRawCursorY = 0.5;

  // Pinch-Lock Stabilization (prevents cursor slip when pinching)
  private isPinchingState = false;
  private lockedCursorX = 0;
  private lockedCursorY = 0;
  private pinchLockStartTime = 0;

  // Precision Scroll Engine with Dynamic Anchor
  private scrollAnchorY: number | null = null;
  private smoothedScrollY = 0.5;
  private readonly SCROLL_DEADZONE = 0.026;

  // Dwell & Click Interaction State
  private lastDwellTarget: HTMLElement | null = null;
  private dwellStartTime = 0;
  private lastFeedbackTimestamp = 0;
  private activeScrollTarget: HTMLElement | null = null;

  constructor(private ngZone: NgZone) {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        const elem = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        if (elem) {
          this.activeScrollTarget = this.findClosestScrollable(elem);
        }
      }, { passive: true });
    }
  }

  public async initializeModel(): Promise<boolean> {
    if (this.handLandmarker) return true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.55
      });

      this.isModelLoaded$.next(true);
      return true;
    } catch (err) {
      console.warn('GPU delegate fallback to CPU...', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });
        this.isModelLoaded$.next(true);
        return true;
      } catch (cpuErr) {
        console.error('Failed to initialize HandLandmarker:', cpuErr);
        return false;
      }
    }
  }

  public async startTracking(): Promise<boolean> {
    if (this.isEnabled$.value) return true;

    const ready = await this.initializeModel();
    if (!ready) return false;

    try {
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('autoplay', '');
        this.videoElement.setAttribute('muted', '');
        this.videoElement.setAttribute('playsinline', '');
        this.videoElement.style.position = 'fixed';
        this.videoElement.style.top = '-9999px';
        this.videoElement.style.left = '-9999px';
        this.videoElement.style.width = '320px';
        this.videoElement.style.height = '240px';
        this.videoElement.style.opacity = '0.001';
        this.videoElement.style.pointerEvents = 'none';
        this.videoElement.style.zIndex = '-999';
        document.body.appendChild(this.videoElement);
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.isEnabled$.next(true);
      this.isCameraReady$.next(true);
      this.lastFrameProcessedTime = performance.now();

      this.ngZone.runOutsideAngular(() => {
        this.processVideoFrame();
        this.startWatchdog();
      });

      this.emitFeedback('NAV_DOT', 'Precision Gestures Active', '🎯');
      return true;
    } catch (err) {
      console.error('Error starting camera stream:', err);
      this.stopTracking();
      return false;
    }
  }

  public stopTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.watchdogIntervalId) {
      clearInterval(this.watchdogIntervalId);
      this.watchdogIntervalId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.isEnabled$.next(false);
    this.isCameraReady$.next(false);
    this.currentGesture$.next('NONE');
    this.handLandmarks$.next(null);
    this.cursorPosition$.next({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      isPinching: false,
      dwellProgress: 0,
      isVisible: false,
      isScrollMode: false
    });
  }

  public toggleTracking(): void {
    if (this.isEnabled$.value) {
      this.stopTracking();
    } else {
      this.startTracking();
    }
  }

  public getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  private startWatchdog() {
    if (this.watchdogIntervalId) clearInterval(this.watchdogIntervalId);
    this.watchdogIntervalId = setInterval(() => {
      if (this.isEnabled$.value && this.videoElement) {
        const timeSinceLastFrame = performance.now() - this.lastFrameProcessedTime;
        if (timeSinceLastFrame > 2500) {
          if (this.videoElement.paused) {
            this.videoElement.play().catch(() => {});
          }
          if (this.animationFrameId === null) {
            this.animationFrameId = requestAnimationFrame(this.processVideoFrame);
          }
        }
      }
    }, 1500);
  }

  private processVideoFrame = () => {
    if (!this.isEnabled$.value || !this.videoElement || !this.handLandmarker) {
      this.animationFrameId = null;
      return;
    }

    if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
      if (this.videoElement.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = this.videoElement.currentTime;
        this.lastFrameProcessedTime = performance.now();

        let now = performance.now();
        if (now <= this.lastVisionTimestamp) {
          now = this.lastVisionTimestamp + 1;
        }
        this.lastVisionTimestamp = now;

        try {
          const results = this.handLandmarker.detectForVideo(this.videoElement, now);

          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            this.handLandmarks$.next(landmarks);
            this.processPrecisionGestures(landmarks, now);
          } else {
            this.handLandmarks$.next(null);
            this.currentGesture$.next('NONE');
            this.scrollAnchorY = null;
            this.cursorPosition$.next({
              ...this.cursorPosition$.value,
              isVisible: false,
              dwellProgress: 0,
              isScrollMode: false
            });
            this.scrollData$.next({ deltaY: 0, speed: 0, direction: 'NONE', normalizedDisplacement: 0 });
          }
        } catch (err) {
          console.warn('Frame processing error in MediaPipe:', err);
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.processVideoFrame);
  };

  /**
   * HIGH PRECISION DISAMBIGUATION ENGINE:
   * 1. 🔴 Single Dot Navigation & Click (Index Finger pointing, Pinch or Dwell to click)
   * 2. ↕️ Scroll Up & Down (Two Fingers: Index + Middle extended together)
   */
  private processPrecisionGestures(landmarks: any[], now: number) {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexDip = landmarks[7];
    const indexTip = landmarks[8];
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleDip = landmarks[11];
    const middleTip = landmarks[12];
    const ringMcp = landmarks[13];
    const ringPip = landmarks[14];
    const ringTip = landmarks[16];
    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    // Reference Scale: Palm Diameter (Wrist to Middle MCP)
    const palmSize = Math.max(0.01, this.distance2D(wrist, middleMcp));

    // True Anatomical Extension Heuristics
    const isIndexExtended = this.isFingerExtended(wrist, indexMcp, indexPip, indexTip, palmSize);
    const isMiddleExtended = this.isFingerExtended(wrist, middleMcp, middlePip, middleTip, palmSize);
    const isRingExtended = this.isFingerExtended(wrist, ringMcp, ringPip, ringTip, palmSize);
    const isPinkyExtended = this.isFingerExtended(wrist, pinkyMcp, pinkyPip, pinkyTip, palmSize);

    // Anatomical Pinch Metric (Thumb Tip to Index Tip relative to Index Proximal Phalanx)
    const indexPhalanxLength = Math.max(0.01, this.distance2D(indexMcp, indexPip));
    const pinchRatio = this.distance2D(thumbTip, indexTip) / indexPhalanxLength;
    
    // Hysteresis threshold: 0.95 to trigger, 1.25 to release
    const pinchThreshold = this.isPinchingState ? 1.25 : 0.95;
    const isPinching = pinchRatio < pinchThreshold;

    // -------------------------------------------------------------
    // GESTURE 1: ↕️ TWO-FINGER PRECISION SCROLL (Index + Middle extended)
    // -------------------------------------------------------------
    const isTwoFingerScroll = isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended && !isPinching;
    const isOpenHandScroll = isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && !isPinching;
    const isScrollGesture = isTwoFingerScroll || isOpenHandScroll;

    if (isScrollGesture) {
      this.currentGesture$.next('SCROLL');
      const scrollTrackingY = isTwoFingerScroll ? (indexTip.y + middleTip.y) / 2 : middleMcp.y;
      this.handlePrecisionScroll(scrollTrackingY);

      // Keep laser dot centered and marked in scroll mode
      this.updateAirCursorPosition(indexTip.x, indexTip.y, false, now, false, true);
      return;
    }

    // Reset scroll anchor when not in scroll mode
    this.scrollAnchorY = null;
    this.scrollData$.next({ deltaY: 0, speed: 0, direction: 'NONE', normalizedDisplacement: 0 });

    // -------------------------------------------------------------
    // GESTURE 2: 🔴 SINGLE DOT NAVIGATION & PINCH / DWELL CLICK
    // -------------------------------------------------------------
    const cursorOrigin = isIndexExtended ? indexTip : middleMcp;
    this.updateAirCursorPosition(cursorOrigin.x, cursorOrigin.y, isPinching, now, true, false);

    if (isPinching) {
      this.currentGesture$.next('PINCH_CLICK');
      if (!this.isPinchingState) {
        this.triggerAirClick();
        this.emitFeedback('PINCH_CLICK', 'Air Click Executed', '🎯');
      }
      this.isPinchingState = true;
    } else {
      this.isPinchingState = false;
      this.currentGesture$.next('NAV_DOT');
    }
  }

  private isFingerExtended(wrist: any, mcp: any, pip: any, tip: any, palmSize: number): boolean {
    const tipToMcp = this.distance2D(tip, mcp);
    const pipToMcp = this.distance2D(pip, mcp);
    const tipToWrist = this.distance2D(tip, wrist);
    const pipToWrist = this.distance2D(pip, wrist);

    // Anatomical extension: Tip must be substantially extended outward from MCP and PIP
    const isExtendedOut = tipToMcp > pipToMcp * 1.25 && tipToMcp > palmSize * 0.38;
    const isFurtherFromWrist = tipToWrist > pipToWrist * 1.05;
    const isUpward = tip.y < pip.y + 0.04 * palmSize;

    return (isExtendedOut && isFurtherFromWrist) || (isExtendedOut && isUpward);
  }

  /**
   * Adaptive 1-Euro Style Dynamic Cursor Smoothing Engine (Rock-solid tremor filter + zero slip on click)
   */
  private updateAirCursorPosition(rawX: number, rawY: number, isPinching: boolean, now: number, allowClick: boolean, isScrollMode: boolean) {
    const mirroredX = 1 - rawX;

    // Comfortable calibration box [0.15, 0.85] mapped to screen viewport
    const clampedNormX = Math.max(0, Math.min(1, (mirroredX - 0.15) / 0.70));
    const clampedNormY = Math.max(0, Math.min(1, (rawY - 0.15) / 0.70));

    // Dynamic Adaptive Alpha: Low speed = high smoothing (zero jitter); High speed = low smoothing (zero lag)
    const moveDist = Math.sqrt(
      Math.pow(clampedNormX - this.lastRawCursorX, 2) + Math.pow(clampedNormY - this.lastRawCursorY, 2)
    );
    this.lastRawCursorX = clampedNormX;
    this.lastRawCursorY = clampedNormY;

    const dynamicAlpha = Math.min(0.80, Math.max(0.18, moveDist * 20));

    this.smoothedCursorX = dynamicAlpha * clampedNormX + (1 - dynamicAlpha) * this.smoothedCursorX;
    this.smoothedCursorY = dynamicAlpha * clampedNormY + (1 - dynamicAlpha) * this.smoothedCursorY;

    let screenX = Math.round(this.smoothedCursorX * window.innerWidth);
    let screenY = Math.round(this.smoothedCursorY * window.innerHeight);

    // PINCH-LOCK STABILIZER: Lock cursor position when pinch starts so index motion doesn't slip off button!
    if (isPinching) {
      if (!this.isPinchingState) {
        this.lockedCursorX = screenX;
        this.lockedCursorY = screenY;
        this.pinchLockStartTime = now;
      }
      if (now - this.pinchLockStartTime < 350) {
        screenX = this.lockedCursorX;
        screenY = this.lockedCursorY;
      }
    }

    // Active Element & Dwell Click
    const elementUnderCursor = document.elementFromPoint(screenX, screenY) as HTMLElement;
    if (elementUnderCursor) {
      this.activeScrollTarget = this.findClosestScrollable(elementUnderCursor);
    }

    let dwellProgress = 0;
    if (allowClick && !isScrollMode) {
      const isClickable = elementUnderCursor ? this.isElementClickable(elementUnderCursor) : false;

      if (isClickable && !isPinching) {
        if (this.lastDwellTarget === elementUnderCursor) {
          const dwellTime = now - this.dwellStartTime;
          dwellProgress = Math.min(1, dwellTime / 650);
          if (dwellProgress >= 1) {
            this.triggerAirClick();
            this.emitFeedback('PINCH_CLICK', 'Dwell Click Executed', '🎯');
            this.dwellStartTime = now + 800; // cooldown debounce
          }
        } else {
          this.lastDwellTarget = elementUnderCursor;
          this.dwellStartTime = now;
        }
      } else {
        this.lastDwellTarget = null;
        this.dwellStartTime = now;
      }
    }

    this.cursorPosition$.next({
      x: screenX,
      y: screenY,
      isPinching,
      dwellProgress,
      isVisible: true,
      isScrollMode
    });
  }

  /**
   * Smart Click Bubble Resolver: Dispatches clean native click on exact interactive target
   */
  public triggerAirClick() {
    const { x, y } = this.cursorPosition$.value;
    const target = document.elementFromPoint(x, y) as HTMLElement;

    if (target) {
      const interactive = this.findClosestClickable(target) || target;
      interactive.focus();

      const mousedownEvt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window });
      const mouseupEvt = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window });
      const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window });

      interactive.dispatchEvent(mousedownEvt);
      interactive.dispatchEvent(mouseupEvt);
      interactive.dispatchEvent(clickEvt);
      interactive.click();
    }
  }

  private isElementClickable(el: HTMLElement): boolean {
    return !!this.findClosestClickable(el);
  }

  private findClosestClickable(el: HTMLElement | null): HTMLElement | null {
    let curr = el;
    while (curr && curr !== document.body) {
      const tag = curr.tagName.toLowerCase();
      if (
        tag === 'button' ||
        tag === 'a' ||
        tag === 'input' ||
        tag === 'textarea' ||
        curr.hasAttribute('routerLink') ||
        curr.hasAttribute('(click)') ||
        curr.classList.contains('clickable') ||
        curr.classList.contains('nav-item') ||
        curr.classList.contains('btn') ||
        curr.classList.contains('clay-badge-3d') ||
        curr.classList.contains('card')
      ) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  /**
   * High-Precision Smooth Scroll Engine with Velocity Acceleration & Neutral Halt
   */
  private handlePrecisionScroll(rawIndexY: number) {
    this.smoothedScrollY = 0.35 * rawIndexY + 0.65 * this.smoothedScrollY;

    if (this.scrollAnchorY === null) {
      this.scrollAnchorY = this.smoothedScrollY;
      return;
    }

    const displacement = this.smoothedScrollY - this.scrollAnchorY;

    if (Math.abs(displacement) < this.SCROLL_DEADZONE) {
      this.scrollData$.next({ deltaY: 0, speed: 0, direction: 'NONE', normalizedDisplacement: displacement });
      return;
    }

    const sign = Math.sign(displacement);
    const effectiveDisplacement = Math.abs(displacement) - this.SCROLL_DEADZONE;
    const normalizedPower = Math.min(effectiveDisplacement / 0.14, 1.0);

    const baseSpeed = 5;
    const maxMultiplier = 42;
    const speed = baseSpeed + Math.pow(normalizedPower, 1.35) * maxMultiplier;

    const scrollDelta = sign * speed;
    const direction: 'UP' | 'DOWN' = scrollDelta < 0 ? 'UP' : 'DOWN';

    this.scrollData$.next({ deltaY: scrollDelta, speed: Math.round(speed), direction, normalizedDisplacement: displacement });

    this.executeMultiTargetScroll(scrollDelta);
  }

  private executeMultiTargetScroll(delta: number) {
    if (this.activeScrollTarget && this.canScroll(this.activeScrollTarget, delta)) {
      this.activeScrollTarget.scrollTop += delta;
      return;
    }

    window.scrollBy({ top: delta, behavior: 'auto' });
    if (document.documentElement) {
      document.documentElement.scrollTop += delta;
    }
    if (document.body) {
      document.body.scrollTop += delta;
    }
  }

  private canScroll(element: HTMLElement, delta: number): boolean {
    if (!element || element === document.body || element === document.documentElement) return false;
    return delta > 0
      ? element.scrollTop + element.clientHeight < element.scrollHeight - 2
      : element.scrollTop > 2;
  }

  private findClosestScrollable(elem: HTMLElement | null): HTMLElement | null {
    let current = elem;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      const isScrollable =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        current.scrollHeight > current.clientHeight + 10;

      if (isScrollable) return current;
      current = current.parentElement;
    }
    return null;
  }

  private distance2D(p1: any, p2: any): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private emitFeedback(gesture: GestureType, label: string, emoji: string) {
    const now = performance.now();
    if (now - this.lastFeedbackTimestamp > 1200 || gesture === 'PINCH_CLICK') {
      this.lastFeedbackTimestamp = now;
      this.ngZone.run(() => {
        this.gestureFeedback$.next({ gesture, label, emoji, timestamp: Date.now() });
      });
    }
  }
}
