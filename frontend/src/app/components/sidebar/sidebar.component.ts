import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<boolean>();

  menuItems = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'AI Matching', route: '/mentor-matching', icon: '⚡' },
    { label: 'Sessions', route: '/sessions', icon: '📅' },
    { label: 'Goal Tracker', route: '/goals', icon: '🎯' },
    { label: 'Learning Paths', route: '/learning-path', icon: '🗺️' },
    { label: 'Live Workspace', route: '/workspace', icon: '💻' },
    { label: 'Resource Hub', route: '/resource-hub', icon: '📚' },
    { label: 'Leaderboard', route: '/gamification', icon: '🏆' },
    { label: 'Analytics', route: '/analytics', icon: '📈' },
    { label: 'Certificates', route: '/certificates', icon: '📜' },
    { label: 'My Profile', route: '/profile', icon: '👤' }
  ];

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleCollapse.emit(this.isCollapsed);
  }
}
