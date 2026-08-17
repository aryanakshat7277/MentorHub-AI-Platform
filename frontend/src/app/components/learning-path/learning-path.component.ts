import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.scss']
})
export class LearningPathComponent {
  circularProgressCards = [
    { title: 'Spring Boot 3 & Microservices', pct: 39, color: '#00D4FF', icon: '🍃', status: 'IN PROGRESS' },
    { title: 'Angular 17 Standalone & Sci-Fi UI', pct: 21, color: '#A855F7', icon: '🅰️', status: 'IN PROGRESS' },
    { title: 'Distributed Systems & WebSockets', pct: 63, color: '#10B981', icon: '🌐', status: 'ADVANCED' },
    { title: 'AI Engineering & RAG Architecture', pct: 15, color: '#F59E0B', icon: '🤖', status: 'STARTING' }
  ];

  roadmapTree = [
    { node: 1, title: 'Java 21 Virtual Threads & Concurrency', status: 'COMPLETED', date: 'Aug 02, 2026' },
    { node: 2, title: 'Spring Boot 3 WebSockets & Real-Time Sync', status: 'IN_PROGRESS', date: 'Active Now' },
    { node: 5, title: 'Angular Standalone Component Architecture', status: 'IN_PROGRESS', date: 'Scheduled' },
    { node: 6, title: 'H2 File Persistence & Spring Data JPA', status: 'COMPLETED', date: 'Aug 10, 2026' },
    { node: 7, title: 'Canvas PDF Certificate Generator', status: 'UPCOMING', date: 'Next Step' },
    { node: 8, title: 'Enterprise Peer Mentoring Masterclass', status: 'LOCKED', date: 'Final Milestone' }
  ];
}
