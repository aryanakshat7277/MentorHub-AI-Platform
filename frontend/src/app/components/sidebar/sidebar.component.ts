import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

export interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  userRole = '';
  @Output() toggleCollapse = new EventEmitter<boolean>();
  @Output() closeMobile = new EventEmitter<void>();

  allMenuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Admin Deck', route: '/admin-dashboard', icon: '🛡️' },
    { label: 'AI Matching', route: '/mentor-matching', icon: '⚡' },
    { label: 'Sessions', route: '/sessions', icon: '📅' },
    { label: 'Live Workspace', route: '/workspace', icon: '💻' },
    { label: 'AI Mock Viva', route: '/mock-viva', icon: '🎙️' },
    { label: 'CUTM Courses', route: '/cutm-courses', icon: '🏛️' },
    { label: 'Learning Paths', route: '/learning-path', icon: '🗺️' },
    { label: 'Goal Tracker', route: '/goals', icon: '🎯' },
    { label: 'Verified Portfolio', route: '/portfolio/pavani', icon: '📄' },
    { label: 'Resource Hub', route: '/resource-hub', icon: '📚' },
    { label: 'Leaderboard', route: '/gamification', icon: '🏆' },
    { label: 'Analytics', route: '/analytics', icon: '📈' },
    { label: 'Certificates', route: '/certificates', icon: '📜' },
    { label: 'My Profile', route: '/profile', icon: '👤' }
  ];

  constructor(private authService: AuthService, private apiService: ApiService) {}

  ngOnInit() {
    this.userRole = (this.authService.getUserRole() || '').toUpperCase();
    this.apiService.getCurrentUser().subscribe(u => {
      if (u && u.role) {
        this.userRole = (u.role || '').toUpperCase();
      }
    });
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
  }
}
