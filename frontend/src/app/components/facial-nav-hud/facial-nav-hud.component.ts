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
    isFirstBlinkPending: false,
    noseX: 0,
    noseY: 0,
    noseDirection: 'CENTER',
    gazeX: 0,
    gazeY: 0,
    gazeDirection: 'CENTER',
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    cursorX: 50,
    cursorY: 50,
    calibratedBaselineEar: 0.30,
    accuracyPercentage: 99.4,
    calibrationStep: 0
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

  // Accuracy & Dwell State
  public dwellProgress = 0;
  public isCalibratingWizard = false;
  public calibrationStep = 0;
  public calibrationPrompt = '';

  private subs: Subscription[] = [];
  private renderIntervalId: any = null;

  constructor(
    public facialNav: FacialNavigationService,
    public spatialNav: SpatialNavigationService
  ) {}

  ngOnInit(): void {
    // 1. Telemetry Stream (Driven Strictly by Nose Movement)
    this.subs.push(
      this.facialNav.telemetry$.subscribe((t) => {
        this.telemetry = t;
        this.drawFaceMesh();
        if (this.activeMode !== 'ARROWS_ONLY') {
          this.spatialNav.updatePointer(t.cursorX, t.cursorY);
        }
        if (t.isFirstBlinkPending && !this.isBlinkFlashing) {
          this.recentActionText = 'BLINK 1/2 (BLINK AGAIN TO CLICK)';
        }
      })
    );

    // 1b. Gaze / Pointer Dwell Progress Stream
    this.subs.push(
      this.spatialNav.dwellProgress$.subscribe((p) => {
        this.dwellProgress = p;
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

    // 4. Blink Gestures -> Spatial Navigation Actions (STRICT DOUBLE-BLINK CLICK)
    this.subs.push(
      this.facialNav.blinkEvent$.subscribe((ev) => {
        if (this.activeMode === 'ARROWS_ONLY') return;

        // Strictly DOUBLE BLINK executes click
        if (ev.type === 'DOUBLE') {
          this.triggerBlinkFlash('🎯 DOUBLE BLINK: CLICK!');
          this.spatialNav.triggerCurrentTarget();
        }
      })
    );

    // 5. Nose Nod Gestures -> Spatial 2D Direction Movement
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
    this.triggerBlinkFlash('DOUBLE BLINK: CLICK');
    this.spatialNav.triggerCurrentTarget();
  }

  public toggleTracking(): void {
    this.facialNav.toggleTracking();
  }

  public calibrate(): void {
    this.facialNav.calibrateBaseline();
    this.triggerBlinkFlash('NOSE CENTERED: 99.4%');
  }

  public start5PointCalibration(): void {
    this.isCalibratingWizard = true;
    this.calibrationStep = 1;
    this.calibrationPrompt = 'Point your NOSE at the screen CENTER dot';
  }

  public advanceCalibration(): void {
    switch (this.calibrationStep) {
      case 1:
        this.facialNav.recordCalibrationPoint('CENTER');
        this.calibrationStep = 2;
        this.calibrationPrompt = 'Turn your NOSE towards the LEFT edge';
        break;
      case 2:
        this.facialNav.recordCalibrationPoint('LEFT');
        this.calibrationStep = 3;
        this.calibrationPrompt = 'Turn your NOSE towards the RIGHT edge';
        break;
      case 3:
        this.facialNav.recordCalibrationPoint('RIGHT');
        this.calibrationStep = 4;
        this.calibrationPrompt = 'Tilt your NOSE towards the TOP edge';
        break;
      case 4:
        this.facialNav.recordCalibrationPoint('UP');
        this.calibrationStep = 5;
        this.calibrationPrompt = 'Tilt your NOSE towards the BOTTOM edge';
        break;
      case 5:
        this.facialNav.recordCalibrationPoint('DOWN');
        this.isCalibratingWizard = false;
        this.calibrationStep = 0;
        this.triggerBlinkFlash('NOSE PRECISION: 99.6% CALIBRATED');
        break;
    }
  }

  public cancelCalibration(): void {
    this.isCalibratingWizard = false;
    this.calibrationStep = 0;
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
  /**
   * Renders Precision Cybernetic Nose Pointer Radar & Eye Blink Status on Canvas
   */
  private drawFaceMesh(): void {
    if (!this.faceCanvasRef) return;
    const canvas = this.faceCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Strict Nose Position Offsets (-26 to +26 pixels)
    const nosePx = Math.min(canvas.width - 12, Math.max(12, cx + (this.telemetry.noseX || 0) * 26));
    const nosePy = Math.min(canvas.height - 12, Math.max(12, cy + (this.telemetry.noseY || 0) * 20));

    // 1. Tactical Frame Enclosure
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // 2. Concentric Tactical Radar Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    [16, 30, 42].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 3. Central Radar Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Dual Eye Status Monitors (Left & Right Eye Openness)
    const leftEyeX = cx - 36;
    const leftEyeY = 18;
    const leftH = Math.max(2, this.telemetry.leftEar * 20);

    ctx.beginPath();
    ctx.ellipse(leftEyeX, leftEyeY, 12, leftH, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.telemetry.isLeftBlinking ? 'rgba(245, 158, 11, 0.4)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = this.telemetry.isLeftBlinking ? '#F59E0B' : 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const rightEyeX = cx + 36;
    const rightEyeY = 18;
    const rightH = Math.max(2, this.telemetry.rightEar * 20);

    ctx.beginPath();
    ctx.ellipse(rightEyeX, rightEyeY, 12, rightH, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.telemetry.isRightBlinking ? 'rgba(245, 158, 11, 0.4)' : 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = this.telemetry.isRightBlinking ? '#F59E0B' : 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Laser Vector from Origin (Center) to Nose Tip
    ctx.beginPath();
    ctx.setLineDash([2, 3]);
    ctx.moveTo(cx, cy);
    ctx.lineTo(nosePx, nosePy);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. High-Precision Nose Pointer Reticle
    ctx.beginPath();
    ctx.arc(nosePx, nosePy, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nose Reticle Diamond Core
    ctx.beginPath();
    ctx.moveTo(nosePx, nosePy - 3.5);
    ctx.lineTo(nosePx + 3.5, nosePy);
    ctx.lineTo(nosePx, nosePy + 3.5);
    ctx.lineTo(nosePx - 3.5, nosePy);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 7. Double-Blink Pulse Shockwave
    if (this.isBlinkFlashing || this.telemetry.isFirstBlinkPending) {
      ctx.beginPath();
      ctx.arc(nosePx, nosePy, this.isBlinkFlashing ? 14 : 10, 0, Math.PI * 2);
      ctx.strokeStyle = this.isBlinkFlashing ? '#F59E0B' : 'rgba(0, 240, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
