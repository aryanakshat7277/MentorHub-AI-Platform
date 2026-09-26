import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
  imgIcon?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Navigation drawer is closed/collapsed by default
  isCollapsed = true;
  userRole = '';
  @Output() toggleCollapse = new EventEmitter<boolean>();
  @Output() closeMobile = new EventEmitter<void>();

  private navSub: Subscription | null = null;

  allMenuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Admin Deck', route: '/admin-dashboard', icon: '🛡️' },
    { label: 'Mentor Matching', route: '/mentor-matching', icon: '⚡' },
    { label: 'Sessions', route: '/sessions', icon: '📅' },
    { label: 'Live Workspace', route: '/workspace', icon: '💻' },
    { label: 'CUTM Courses', route: '/cutm-courses', icon: '🏛️', imgIcon: 'assets/cutm-seal.svg' },
    { label: 'Learning Paths', route: '/learning-path', icon: '🗺️' },
    { label: 'Goal Tracker', route: '/goals', icon: '🎯' },
    { label: 'Verified Portfolio', route: '/portfolio/akshat', icon: '📄' },
    { label: 'Resource Hub', route: '/resource-hub', icon: '📚' },
    { label: 'Leaderboard', route: '/gamification', icon: '🏆' },
    { label: 'Analytics', route: '/analytics', icon: '📈' },
    { label: 'Certificates', route: '/certificates', icon: '📜' },
    { label: 'My Profile', route: '/profile', icon: '👤' }
  ];

  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole = (this.authService.getUserRole() || '').toUpperCase();
    this.apiService.getCurrentUser().subscribe(u => {
      if (u && u.role) {
        this.userRole = (u.role || '').toUpperCase();
      }
    });

    // Notify parent on startup that drawer is collapsed by default
    this.toggleCollapse.emit(this.isCollapsed);

    // Auto-close navigation drawer whenever navigating to any section
    this.navSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (!this.isCollapsed) {
        this.isCollapsed = true;
        this.toggleCollapse.emit(this.isCollapsed);
      }
    });
  }

  ngOnDestroy() {
    if (this.navSub) {
      this.navSub.unsubscribe();
    }
  }

  get visibleMenuItems(): MenuItem[] {
    if (this.userRole === 'ADMIN') {
      // Admin sees ALL menu items including Admin Deck
      return this.allMenuItems;
    } else {
      // Mentors & Mentees DO NOT see Admin Deck
      return this.allMenuItems.filter(item => item.route !== '/admin-dashboard');
    }
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleCollapse.emit(this.isCollapsed);
  }

  onNavClick() {
    this.closeMobile.emit();
    // Auto-close navigation drawer when clicked for any section
    if (!this.isCollapsed) {
      this.isCollapsed = true;
      this.toggleCollapse.emit(this.isCollapsed);
    }
  }
}

