import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeMode>('light');
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('mentorhub_theme') as ThemeMode;
      if (saved === 'dark' || saved === 'light') {
        this.setTheme(saved);
      } else {
        this.setTheme('light');
      }
    }
  }

  get isDarkMode(): boolean {
    return this.themeSubject.value === 'dark';
  }

  get currentTheme(): ThemeMode {
    return this.themeSubject.value;
  }

  toggleTheme(): ThemeMode {
    const next = this.isDarkMode ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  setTheme(mode: ThemeMode) {
    this.themeSubject.next(mode);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      if (mode === 'dark') {
        root.classList.add('dark', 'dark-theme');
        root.classList.remove('warm-clay-theme');
        body.classList.add('dark-theme');
        body.classList.remove('warm-clay-theme');
      } else {
        root.classList.remove('dark', 'dark-theme');
        root.classList.add('warm-clay-theme');
        body.classList.remove('dark-theme');
        body.classList.add('warm-clay-theme');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mentorhub_theme', mode);
      }
    }
  }
}
