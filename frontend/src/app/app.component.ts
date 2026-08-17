import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { AiChatbotComponent } from './components/ai-chatbot/ai-chatbot.component';
import { SoundService } from './services/sound.service';
import { AuthService, LoginEvent } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, AiChatbotComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isAiChatbotOpen = false;

  // 3-Second Graphical App Startup Animation State
  isBooting = false;
  isFadingOut = false;
  bootProgress = 0;
  detectedUserRole = '';
  detectedUserName = '';

  isAuthPage = true;

  private routerSub: Subscription | null = null;
  private loginSub: Subscription | null = null;

  constructor(
    private soundService: SoundService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthRoute(this.router.url);

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkAuthRoute(event.urlAfterRedirects || event.url);
    });

    this.loginSub = this.authService.loginSuccess$.subscribe((evt: LoginEvent) => {
      this.detectedUserRole = evt.role;
      this.detectedUserName = evt.name;
      this.runStartupAnimation();
    });

    if (this.authService.isLoggedIn() && !this.router.url.includes('/login')) {
      this.isAuthPage = false;
      this.isBooting = false;
    }
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.loginSub) this.loginSub.unsubscribe();
  }

  checkAuthRoute(url: string) {
    if (!this.authService.isLoggedIn() || url.includes('/login')) {
      this.isAuthPage = true;
      this.isBooting = false;
    } else {
      this.isAuthPage = false;
    }
  }

  get bootStatusText(): string {
    if (this.bootProgress < 25) {
      return `DETECTING ROLE & VERIFYING ${this.detectedUserRole || 'USER'} CREDENTIALS...`;
    } else if (this.bootProgress < 50) {
      return `LOADING ${this.detectedUserRole || 'NEURAL'} DASHBOARD & WORKSPACE MODULES...`;
    } else if (this.bootProgress < 75) {
      return `SYNCHRONIZING MENTORHUB AI MATCHING & WEBSOCKETS...`;
    } else if (this.bootProgress < 99) {
      return `AUTHENTICATION SUCCESSFUL — LAUNCHING APP...`;
    } else {
      return `SYSTEM READY — WELCOME ${this.detectedUserName || 'SCHOLAR'}`;
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.soundService.playClickSound();
  }

  runStartupAnimation() {
    this.isBooting = true;
    this.isFadingOut = false;
    this.bootProgress = 0;

    // 3000ms total duration (3 seconds)
    const totalDurationMs = 3000;
    const intervalMs = 20;
    const increment = 100 / (totalDurationMs / intervalMs);

    const interval = setInterval(() => {
      this.bootProgress += increment;
      if (this.bootProgress >= 100) {
        this.bootProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          this.isFadingOut = true;
          setTimeout(() => {
            this.isBooting = false;
            this.isAuthPage = false;
          }, 450);
        }, 200);
      }
    }, intervalMs);
  }

  skipBoot() {
    this.isFadingOut = true;
    setTimeout(() => {
      this.isBooting = false;
      this.isAuthPage = false;
    }, 250);
  }

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  toggleAiChatbot() {
    this.isAiChatbotOpen = !this.isAiChatbotOpen;
  }
}
