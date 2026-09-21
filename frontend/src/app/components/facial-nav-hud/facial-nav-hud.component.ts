import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FacialNavigationService, FacialTelemetry, SpatialNodDirection } from '../../services/facial-navigation.service';
import { NavTargetInfo, SpatialNavigationService } from '../../services/spatial-navigation.service';

export type AirNavMode = 'HYBRID' | 'ARROWS_ONLY' | 'BLINK_ONLY';

@Component({
  selector: 'app-facial-nav-hud',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facial-nav-hud.component.html',
  styleUrls: ['./facial-nav-hud.component.scss']
})
export class FacialNavHudComponent implements OnInit, OnDestroy {
  @ViewChild('faceCanvas') faceCanvasRef?: ElementRef<HTMLCanvasElement>;

  // HUD UI State
  public isCollapsed = false;
  public isLaserEnabled = true;
  public activeMode: AirNavMode = 'HYBRID';
  public isCameraActive = false;
  public isSoundOn = true;

  // Telemetry & Target
  public telemetry: FacialTelemetry = {
    leftEar: 0.30,
    rightEar: 0.30,
    isLeftBlinking: false,
    isRightBlinking: false,
    isBothBlinking: false,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    cursorX: 50,
    cursorY: 50,
    calibratedBaselineEar: 0.30
  };

  public currentTarget: NavTargetInfo = {
    element: null,
    name: 'Ready for Navigation',
    tag: '',
    rect: null
  };

  // Recent Action Alert
  public recentActionText = '';
  public isBlinkFlashing = false;
  public activeDirection: SpatialNodDirection | null = null;

  private subs: Subscription[] = [];
  private renderIntervalId: any = null;

  constructor(
    public facialNav: FacialNavigationService,
    public spatialNav: SpatialNavigationService
  ) {}

  ngOnInit(): void {
    // 1. Telemetry Stream
    this.subs.push(
      this.facialNav.telemetry$.subscribe((t) => {
        this.telemetry = t;
        this.drawFaceMesh();
      })
    );

    // 2. Camera & Tracking State
    this.subs.push(
      this.facialNav.isEnabled$.subscribe((active) => {
        this.isCameraActive = active;
      })
    );

    // 3. Active DOM Target Stream
    this.subs.push(
      this.spatialNav.activeTarget$.subscribe((target) => {
        this.currentTarget = target;
      })
    );

    // 4. Blink Gestures -> Spatial Navigation Actions
    this.subs.push(
      this.facialNav.blinkEvent$.subscribe((ev) => {
        if (this.activeMode === 'ARROWS_ONLY') return;

        if (ev.type === 'SINGLE' || ev.type === 'DOUBLE') {
          this.triggerBlinkFlash(ev.type === 'DOUBLE' ? 'DOUBLE BLINK: ACTIVATE' : 'BLINK: CLICK');
          this.spatialNav.triggerCurrentTarget();
        } else if (ev.type === 'LEFT_WINK') {
          this.triggerBlinkFlash('LEFT WINK: SCROLL UP');
          this.spatialNav.scrollPage('UP');
        } else if (ev.type === 'RIGHT_WINK') {
          this.triggerBlinkFlash('RIGHT WINK: SCROLL DOWN');
          this.spatialNav.scrollPage('DOWN');
        }
      })
    );

    // 5. Head Nod Gestures -> Spatial 2D Direction Movement
    this.subs.push(
      this.facialNav.spatialNod$.subscribe((dir) => {
        if (this.activeMode === 'BLINK_ONLY') return;
        this.highlightDirection(dir);
        this.spatialNav.navigate(dir);
      })
    );

    // Auto-start tracking on load
    this.facialNav.startTracking();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.renderIntervalId) clearInterval(this.renderIntervalId);
  }

  // Directional Arrow Button Click
  public onArrowClick(dir: SpatialNodDirection): void {
    this.highlightDirection(dir);
    this.spatialNav.navigate(dir);
  }

  // Central Click Button
  public onCenterClick(): void {
    this.triggerBlinkFlash('ACTION: CLICK');
    this.spatialNav.triggerCurrentTarget();
  }

  public toggleTracking(): void {
    this.facialNav.toggleTracking();
  }

  public calibrate(): void {
    this.facialNav.calibrateBaseline();
    this.triggerBlinkFlash('CALIBRATED');
  }

  public toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  public toggleSound(): void {
    this.isSoundOn = this.spatialNav.toggleSound();
  }

  public cycleMode(): void {
    if (this.activeMode === 'HYBRID') this.activeMode = 'ARROWS_ONLY';
    else if (this.activeMode === 'ARROWS_ONLY') this.activeMode = 'BLINK_ONLY';
    else this.activeMode = 'HYBRID';
  }

  private triggerBlinkFlash(text: string): void {
    this.recentActionText = text;
    this.isBlinkFlashing = true;
    setTimeout(() => {
      this.isBlinkFlashing = false;
    }, 450);
  }

  private highlightDirection(dir: SpatialNodDirection): void {
    this.activeDirection = dir;
    setTimeout(() => {
      if (this.activeDirection === dir) this.activeDirection = null;
    }, 300);
  }

  /**
   * Renders Cybernetic Face Wireframe & Pupil Tracking on Canvas
   */
  private drawFaceMesh(): void {
    if (!this.faceCanvasRef) return;
    const canvas = this.faceCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Head orientation offsets
    const ox = this.telemetry.headYaw * 20;
    const oy = -this.telemetry.headPitch * 15;

    // 1. Outer Holographic Face Oval
    ctx.beginPath();
    ctx.ellipse(cx + ox, cy + oy, 32, 42, (this.telemetry.headRoll || 0) * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = this.telemetry.isBothBlinking ? '#F59E0B' : 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Left Eye Contour & Pupil
    const leftEyeX = cx + ox - 14;
    const leftEyeY = cy + oy - 8;
    const leftH = Math.max(1, this.telemetry.leftEar * 24);

    ctx.beginPath();
    ctx.ellipse(leftEyeX, leftEyeY, 8, leftH, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.telemetry.isLeftBlinking ? '#F59E0B' : 'rgba(0, 240, 255, 0.25)';
    ctx.fill();
    ctx.strokeStyle = this.telemetry.isLeftBlinking ? '#F59E0B' : '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left Pupil
    if (!this.telemetry.isLeftBlinking) {
      ctx.beginPath();
      ctx.arc(leftEyeX + ox * 0.2, leftEyeY + oy * 0.2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    // 3. Right Eye Contour & Pupil
    const rightEyeX = cx + ox + 14;
    const rightEyeY = cy + oy - 8;
    const rightH = Math.max(1, this.telemetry.rightEar * 24);

    ctx.beginPath();
    ctx.ellipse(rightEyeX, rightEyeY, 8, rightH, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.telemetry.isRightBlinking ? '#F59E0B' : 'rgba(0, 240, 255, 0.25)';
    ctx.fill();
    ctx.strokeStyle = this.telemetry.isRightBlinking ? '#F59E0B' : '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right Pupil
    if (!this.telemetry.isRightBlinking) {
      ctx.beginPath();
      ctx.arc(rightEyeX + ox * 0.2, rightEyeY + oy * 0.2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }

    // 4. Nose Bridge & Directional Vector
    ctx.beginPath();
    ctx.moveTo(cx + ox, cy + oy - 4);
    ctx.lineTo(cx + ox, cy + oy + 8);
    ctx.lineTo(cx + ox + (this.telemetry.headYaw * 12), cy + oy + 8);
    ctx.strokeStyle = '#DE7048';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Mouth Line
    ctx.beginPath();
    ctx.moveTo(cx + ox - 10, cy + oy + 22);
    ctx.lineTo(cx + ox + 10, cy + oy + 22);
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
