import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GestureRecognitionService } from '../../services/gesture-recognition.service';

@Component({
  selector: 'app-air-radial-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './air-radial-menu.component.html',
  styleUrls: ['./air-radial-menu.component.scss']
})
export class AirRadialMenuComponent implements OnInit, OnDestroy {
  isOpen = false;
  selectedSector = -1;
  routes: any[] = [];
  private subs: Subscription[] = [];

  constructor(public gestureService: GestureRecognitionService, private router: Router) {
    this.routes = this.gestureService.NAV_ROUTES;
  }

  ngOnInit(): void {
    this.subs.push(
      this.gestureService.isRadialMenuOpen$.subscribe((open) => (this.isOpen = open)),
      this.gestureService.selectedRadialSector$.subscribe((sec) => (this.selectedSector = sec))
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  selectRoute(index: number): void {
    if (index >= 0 && index < this.routes.length) {
      const target = this.routes[index];
      this.router.navigate([target.path]);
      this.close();
    }
  }

  close(): void {
    this.gestureService.isRadialMenuOpen$.next(false);
  }
}
