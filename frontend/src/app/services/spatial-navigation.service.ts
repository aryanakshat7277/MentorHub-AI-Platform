import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SpatialNodDirection } from './facial-navigation.service';

export interface NavTargetInfo {
  element: HTMLElement | null;
  name: string;
  tag: string;
  rect: DOMRect | null;
}

@Injectable({
  providedIn: 'root'
})
export class SpatialNavigationService {
  private activeElement: HTMLElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSoundEnabled = true;

  // Active target status stream
  public activeTarget$ = new BehaviorSubject<NavTargetInfo>({
    element: null,
    name: 'None (Press Arrow or Blink to Engage)',
    tag: '',
    rect: null
  });

  // Last triggered action notification
  public actionFeedback$ = new Subject<{ action: string; targetName: string; timestamp: number }>();

  // Spatial navigation mode
  public isSpatialModeActive$ = new BehaviorSubject<boolean>(true);

  // Gaze Fixation & Dwell Progress (0.0 to 1.0)
  public dwellProgress$ = new BehaviorSubject<number>(0);
  private dwellStartTime = 0;
  private currentDwellTarget: HTMLElement | null = null;
  private readonly DWELL_THRESHOLD_MS = 800; // 800ms dwell activation

  constructor(private ngZone: NgZone) {
    if (typeof window !== 'undefined') {
      this.initKeyboardListener();
    }
  }

  /**
   * Magnetic Target Snapping driven strictly by Nose Pointer screen coordinates.
   * Focuses and locks onto interactive elements within 85px radius.
   * Click execution is reserved strictly for intentional DOUBLE BLINK of the eyes.
   */
  public updatePointer(screenXPercent: number, screenYPercent: number): void {
    if (typeof window === 'undefined') return;

    const px = (screenXPercent / 100) * window.innerWidth;
    const py = (screenYPercent / 100) * window.innerHeight;

    const candidates = this.scanInteractiveDOM();
    let closestTarget: HTMLElement | null = null;
    let minDistance = 85; // 85px magnetic snap radius

    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(px - cx, py - cy);

      if (dist < minDistance) {
        minDistance = dist;
        closestTarget = el;
      }
    }

    if (closestTarget) {
      if (this.currentDwellTarget !== closestTarget) {
        this.currentDwellTarget = closestTarget;
        this.setFocus(closestTarget);
      }
    } else {
      this.currentDwellTarget = null;
    }
  }

  /**
   * Backward-compatible alias for updatePointer
   */
  public updateEyeGazePointer(screenXPercent: number, screenYPercent: number): void {
    this.updatePointer(screenXPercent, screenYPercent);
  }

  /**
   * Navigates in the specified 2D spatial direction (UP, DOWN, LEFT, RIGHT)
   */
  public navigate(direction: SpatialNodDirection): void {
    const candidates = this.scanInteractiveDOM();
    if (candidates.length === 0) return;

    if (!this.activeElement || !document.body.contains(this.activeElement) || !this.isVisible(this.activeElement)) {
      this.setFocus(candidates[0]);
      return;
    }

    const currentRect = this.activeElement.getBoundingClientRect();
    const cx = currentRect.left + currentRect.width / 2;
    const cy = currentRect.top + currentRect.height / 2;

    let bestTarget: HTMLElement | null = null;
    let lowestScore = Infinity;

    for (const target of candidates) {
      if (target === this.activeElement) continue;

      const r = target.getBoundingClientRect();
      const tx = r.left + r.width / 2;
      const ty = r.top + r.height / 2;

      const dx = tx - cx;
      const dy = ty - cy;

      let isInDirection = false;
      let primaryDelta = 0;
      let secondaryDelta = 0;

      switch (direction) {
        case 'UP':
          isInDirection = dy < -12;
          primaryDelta = Math.abs(dy);
          secondaryDelta = Math.abs(dx);
          break;
        case 'DOWN':
          isInDirection = dy > 12;
          primaryDelta = Math.abs(dy);
          secondaryDelta = Math.abs(dx);
          break;
        case 'LEFT':
          isInDirection = dx < -12;
          primaryDelta = Math.abs(dx);
          secondaryDelta = Math.abs(dy);
          break;
        case 'RIGHT':
          isInDirection = dx > 12;
          primaryDelta = Math.abs(dx);
          secondaryDelta = Math.abs(dy);
          break;
      }

      if (isInDirection) {
        // Weighted geometric score: heavily favors directly aligned elements
        const score = primaryDelta + (secondaryDelta * 1.8);
        if (score < lowestScore) {
          lowestScore = score;
          bestTarget = target;
        }
      }
    }

    if (bestTarget) {
      this.setFocus(bestTarget);
      this.playBeep(480, 0.04);
    }
  }

  /**
   * Activates (Clicks / Expands) the currently focused element
   */
  public triggerCurrentTarget(): void {
    if (!this.activeElement) {
      const candidates = this.scanInteractiveDOM();
      if (candidates.length > 0) {
        this.setFocus(candidates[0]);
      }
      return;
    }

    const targetName = this.getElementDescriptor(this.activeElement);

    // Apply 3D Gold Pulse animation
    this.activeElement.classList.add('air-nav-blink-pulse');
    setTimeout(() => {
      this.activeElement?.classList.remove('air-nav-blink-pulse');
    }, 450);

    this.playChime();

    this.actionFeedback$.next({
      action: 'CLICK',
      targetName,
      timestamp: performance.now()
    });

    // Execute standard click
    this.activeElement.click();
    if (this.activeElement instanceof HTMLInputElement || this.activeElement instanceof HTMLTextAreaElement) {
      this.activeElement.focus();
    }
  }

  /**
   * Smoothly scrolls the window or active scroll container
   */
  public scrollPage(direction: 'UP' | 'DOWN'): void {
    const scrollAmount = direction === 'DOWN' ? 360 : -360;
    window.scrollBy({
      top: scrollAmount,
      behavior: 'smooth'
    });
    this.playBeep(320, 0.03);
  }

  /**
   * Discovers and indexes all visible interactive DOM targets
   */
  private scanInteractiveDOM(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '.nav-card',
      '.viva-card',
      '.dock-item',
      '.action-btn',
      '.filter-pill',
      '.sidebar-nav-item',
      '.quick-action-btn'
    ].join(',');

    const all = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return all.filter(el => this.isVisible(el));
  }

  /**
   * Applies focus styling and announces element
   */
  private setFocus(el: HTMLElement): void {
    if (this.activeElement) {
      this.activeElement.classList.remove('air-nav-focused-element');
    }

    this.activeElement = el;
    this.activeElement.classList.add('air-nav-focused-element');

    // Smooth auto-scroll to keep active target in view
    this.activeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    });

    const targetName = this.getElementDescriptor(el);
    const rect = el.getBoundingClientRect();

    this.ngZone.run(() => {
      this.activeTarget$.next({
        element: el,
        name: targetName,
        tag: el.tagName.toLowerCase(),
        rect
      });
    });
  }

  /**
   * Derives human-friendly descriptor for any DOM element
   */
  public getElementDescriptor(el: HTMLElement): string {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    const title = el.getAttribute('title');
    if (title) return title.trim();

    if (el instanceof HTMLInputElement) {
      return el.placeholder || el.value || el.name || 'Input Field';
    }

    const textContent = el.innerText || el.textContent || '';
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 0 && cleanText.length <= 40) {
      return cleanText;
    } else if (cleanText.length > 40) {
      return cleanText.substring(0, 37) + '...';
    }

    if (el.classList.contains('dock-item')) return 'Dock Command';
    if (el.classList.contains('viva-card')) return 'Viva Arena Card';
    return el.tagName.toLowerCase() + ' action';
  }

  /**
   * Validates element visibility
   */
  private isVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 12 && r.height > 12 && r.bottom > 0 && r.top < window.innerHeight;
  }

  /**
   * Global Keyboard Arrow & Enter Listener
   */
  private initKeyboardListener(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Don't intercept when user is actively typing in text input/textarea
      const isInputFocused = document.activeElement instanceof HTMLInputElement ||
                             document.activeElement instanceof HTMLTextAreaElement;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInputFocused) {
        e.preventDefault();
        switch (e.key) {
          case 'ArrowUp':    this.navigate('UP'); break;
          case 'ArrowDown':  this.navigate('DOWN'); break;
          case 'ArrowLeft':  this.navigate('LEFT'); break;
          case 'ArrowRight': this.navigate('RIGHT'); break;
        }
      } else if (e.key === 'Enter' && e.ctrlKey) {
        // Ctrl+Enter triggers deliberate blink click action
        this.triggerCurrentTarget();
      }
    });
  }

  /**
   * Web Audio Sound Synthesizers
   */
  private initAudio(): void {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playBeep(freq = 520, duration = 0.05): void {
    if (!this.isSoundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {}
  }

  public playChime(): void {
    if (!this.isSoundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      [880, 1108.73, 1318.51].forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.08, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.18);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.18);
      });
    } catch {}
  }

  public toggleSound(): boolean {
    this.isSoundEnabled = !this.isSoundEnabled;
    return this.isSoundEnabled;
  }
}
