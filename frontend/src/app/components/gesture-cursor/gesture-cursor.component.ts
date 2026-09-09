import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CursorPosition, GestureRecognitionService } from '../../services/gesture-recognition.service';

@Component({
  selector: 'app-gesture-cursor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gesture-cursor.component.html',
  styleUrls: ['./gesture-cursor.component.scss']
})
export class GestureCursorComponent implements OnInit, OnDestroy {
  cursor: CursorPosition = {
    x: 0,
    y: 0,
    isPinching: false,
    dwellProgress: 0,
    isVisible: false,
    isScrollMode: false
  };

  isEnabled = false;
  clickRipples: { id: number; x: number; y: number }[] = [];
  private rippleCounter = 0;
  private subs: Subscription[] = [];

  constructor(public gestureService: GestureRecognitionService) {}

  ngOnInit(): void {
    this.subs.push(
      this.gestureService.isEnabled$.subscribe((enabled) => (this.isEnabled = enabled)),
      this.gestureService.cursorPosition$.subscribe((pos) => {
        this.cursor = pos;
        if (pos.isPinching && !this.clickRipples.some((r) => Math.abs(r.x - pos.x) < 10 && Math.abs(r.y - pos.y) < 10)) {
          this.spawnClickRipple(pos.x, pos.y);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  private spawnClickRipple(x: number, y: number) {
    const id = ++this.rippleCounter;
    this.clickRipples.push({ id, x, y });
    setTimeout(() => {
      this.clickRipples = this.clickRipples.filter((r) => r.id !== id);
    }, 600);
  }
}
