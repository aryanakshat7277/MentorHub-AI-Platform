import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { GestureRecognitionService } from '../../services/gesture-recognition.service';
import { SoundService } from '../../services/sound.service';
import { ThemeService } from '../../services/theme.service';

export interface QuickSearchItem {
  title: string;
  category: 'PAGE' | 'MENTOR' | 'SESSION' | 'GOAL';
  path: string;
  icon: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  time: string;
  read: boolean;
  type: 'SESSION' | 'XP' | 'MATCH' | 'GOAL';
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleMobileSidebar = new EventEmitter<void>();
  user: any = null;
  showDropdown = false;
  showNotifications = false;
  showSpotlightSearch = false;
  searchQuery = '';
  isFullScreen = false;

  toggleSound() {
    this.soundService.toggleMute();
  }

  onHamburgerClick() {
    this.soundService.playClickSound();
    this.toggleMobileSidebar.emit();
  }

  notifications: NotificationItem[] = [
    { id: 1, title: 'Upcoming 1-on-1 Session with Kriti in 30 mins', time: 'Just now', read: false, type: 'SESSION', icon: '📅' },
    { id: 2, title: 'Goal Milestone Achieved: Backend Spring Boot (+150 XP)', time: '2 hours ago', read: false, type: 'XP', icon: '🏆' },
    { id: 3, title: 'New 98% AI Match Mentor: Dr. Vanaja S. (AI Research)', time: '1 day ago', read: true, type: 'MATCH', icon: '✨' },
    { id: 4, title: 'Certificate of Excellence generated & verified', time: '2 days ago', read: true, type: 'GOAL', icon: '🎓' }
  ];

  spotlightItems: QuickSearchItem[] = [
    { title: 'Dashboard & Overview', category: 'PAGE', path: '/dashboard', icon: '🏠' },
    { title: 'RPG Career Quest Map', category: 'PAGE', path: '/learning-path', icon: '🗺️' },
    { title: 'Live Collaborative Workspace', category: 'PAGE', path: '/workspace', icon: '💻' },
    { title: 'Booked Sessions & Handover', category: 'PAGE', path: '/sessions', icon: '📅' },
    { title: 'SMART Goals Tracker', category: 'PAGE', path: '/goals', icon: '🎯' },
    { title: 'AI Mentor Matchmaker', category: 'PAGE', path: '/mentor-matching', icon: '👥' },
    { title: 'Achievements, Badges & Trophies', category: 'PAGE', path: '/gamification', icon: '🏆' },
    { title: 'Verified Certificates', category: 'PAGE', path: '/certificates', icon: '🎓' },
    { title: 'Resource Hub & Docs', category: 'PAGE', path: '/resource-hub', icon: '📚' },
    { title: 'Analytics & Learning Progress', category: 'PAGE', path: '/analytics', icon: '📊' },
    { title: 'User Profile & Settings', category: 'PAGE', path: '/profile', icon: '👤' },
    { title: 'Live Interview Confidence Coach', category: 'PAGE', path: '/workspace', icon: '🎙️' },
    { title: 'Verified Proof of Growth Portfolio', category: 'PAGE', path: '/portfolio/pavani', icon: '📄' }
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public gestureService: GestureRecognitionService,
    public soundService: SoundService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  toggleTheme() {
    this.soundService.playClickSound();
    this.themeService.toggleTheme();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleSpotlight();
    } else if (event.key === 'Escape') {
      this.showSpotlightSearch = false;
      this.showNotifications = false;
      this.showDropdown = false;
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    this.showDropdown = false;
    this.showNotifications = false;
  }

  ngOnInit() {
    this.apiService.getCurrentUser().subscribe(data => {
      this.user = data;
      const isAkshat = (data?.name || '').toUpperCase().includes('AKSHAT');
      const isVanaja = (data?.name || '').toUpperCase().includes('VANAJA') || (data?.email || '').toLowerCase().includes('vanaja');
      const isPavani = (data?.name || '').toUpperCase().includes('PAVANI') || (data?.email || '').toLowerCase().includes('pavani');
      const isKriti = (data?.name || '').toUpperCase().includes('KRITI') || (data?.email || '').toLowerCase().includes('kriti');

      if (isAkshat) {
        this.user.avatarUrl = 'assets/akshat-profile.jpg';
      } else if (isVanaja) {
        this.user.avatarUrl = 'assets/vanaja-profile.jpg';
      } else if (isPavani) {
        this.user.avatarUrl = 'assets/pavani-profile.jpg';
      } else if (isKriti) {
        this.user.avatarUrl = 'assets/kriti-profile.jpg';
      } else if (typeof localStorage !== 'undefined') {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
          this.user.avatarUrl = savedAvatar;
        }
      }
    });

    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', () => {
        this.isFullScreen = !!document.fullscreenElement;
      });
    }
  }

  get unreadNotificationCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get filteredSpotlightItems(): QuickSearchItem[] {
    if (!this.searchQuery.trim()) {
      return this.spotlightItems;
    }
    const q = this.searchQuery.toLowerCase();
    return this.spotlightItems.filter(item =>
      item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }

  toggleSpotlight() {
    this.showSpotlightSearch = !this.showSpotlightSearch;
    this.searchQuery = '';
    this.soundService.playClick();
  }

  selectSpotlightItem(item: QuickSearchItem) {
    this.router.navigate([item.path]);
    this.showSpotlightSearch = false;
    this.soundService.playSuccess();
  }

  toggleGestures() {
    this.gestureService.toggleTracking();
    this.soundService.playClick();
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false;
    this.soundService.playClick();
  }

  markAllNotificationsRead() {
    this.notifications.forEach(n => (n.read = true));
    this.soundService.playSuccess();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    this.showNotifications = false;
    this.soundService.playClick();
  }

  toggleFullScreen() {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.warn(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn(err));
    }
    this.soundService.playClick();
  }

  logout() {
    this.showDropdown = false;
    this.soundService.playClick();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
