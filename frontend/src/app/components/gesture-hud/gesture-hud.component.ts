import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GestureFeedback, GestureRecognitionService, GestureType, ScrollEventData } from '../../services/gesture-recognition.service';

@Component({
  selector: 'app-gesture-hud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gesture-hud.component.html',
  styleUrls: ['./gesture-hud.component.scss']
})
export class GestureHudComponent implements OnInit, OnDestroy {
  @ViewChild('skeletonCanvas') skeletonCanvasRef?: ElementRef<HTMLCanvasElement>;

  isEnabled = false;
  isCameraReady = false;
  isMinimized = false;
  showCheatSheet = false;

  currentGesture: GestureType = 'NONE';
  scrollData: ScrollEventData = { deltaY: 0, speed: 0, direction: 'NONE', normalizedDisplacement: 0 };
  recentFeedback: GestureFeedback | null = null;
  feedbackTimeoutId: any = null;

  private subs: Subscription[] = [];
  private renderLoopId: number | null = null;

  // Hand skeleton connectivity graph
  private readonly HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17]             // Palm base
  ];

  constructor(public gestureService: GestureRecognitionService) {}

  ngOnInit(): void {
    this.subs.push(
      this.gestureService.isEnabled$.subscribe((enabled) => {
        this.isEnabled = enabled;
        if (enabled) {
          this.startSkeletonRenderer();
        } else {
          this.stopSkeletonRenderer();
        }
      }),
      this.gestureService.isCameraReady$.subscribe((ready) => (this.isCameraReady = ready)),
      this.gestureService.currentGesture$.subscribe((g) => (this.currentGesture = g)),
      this.gestureService.scrollData$.subscribe((s) => (this.scrollData = s)),
      this.gestureService.gestureFeedback$.subscribe((feedback) => this.triggerFeedback(feedback))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.stopSkeletonRenderer();
  }

  toggleMinimized(): void {
    this.isMinimized = !this.isMinimized;
  }

  toggleCheatSheet(): void {
    this.showCheatSheet = !this.showCheatSheet;
  }

  closeHud(): void {
    this.gestureService.stopTracking();
  }

  private triggerFeedback(feedback: GestureFeedback) {
    this.recentFeedback = feedback;
    if (this.feedbackTimeoutId) clearTimeout(this.feedbackTimeoutId);
    this.feedbackTimeoutId = setTimeout(() => {
      this.recentFeedback = null;
    }, 1800);
  }

  private startSkeletonRenderer() {
    if (this.renderLoopId !== null) return;

    const render = () => {
      this.drawSkeleton();
      this.renderLoopId = requestAnimationFrame(render);
    };
    this.renderLoopId = requestAnimationFrame(render);
  }

  private stopSkeletonRenderer() {
    if (this.renderLoopId !== null) {
      cancelAnimationFrame(this.renderLoopId);
      this.renderLoopId = null;
    }
  }

  private drawSkeleton() {
    if (!this.skeletonCanvasRef || !this.isEnabled) return;
    const canvas = this.skeletonCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const landmarks = this.gestureService.handLandmarks$.value;
    if (!landmarks || landmarks.length === 0) {
      return;
    }

    const getPoint = (lm: any) => ({
      x: (1 - lm.x) * width,
      y: lm.y * height
    });

    // 1. Draw glowing joint connection lines
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = this.currentGesture === 'SCROLL' ? '#34D399' : (this.currentGesture === 'PINCH_CLICK' ? '#10B981' : '#D4AF37');
    ctx.shadowColor = this.currentGesture === 'SCROLL' ? 'rgba(52,211,153,0.8)' : 'rgba(212,175,55,0.7)';
    ctx.shadowBlur = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of this.HAND_CONNECTIONS) {
      const p1 = getPoint(landmarks[startIdx]);
      const p2 = getPoint(landmarks[endIdx]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Keypoint joint dots
    ctx.save();
    for (let i = 0; i < landmarks.length; i++) {
      const p = getPoint(landmarks[i]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 8 ? 5 : 3, 0, 2 * Math.PI);

      if (i === 8) {
        // Highlight active index tip (laser dot origin)
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#FAF4EE';
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 4;
      }
      ctx.fill();
    }
    ctx.restore();
  }
}
