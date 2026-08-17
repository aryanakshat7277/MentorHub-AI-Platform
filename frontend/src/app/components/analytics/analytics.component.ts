import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  analyticsData: any = null;

  weeklyPoints = [
    { day: 'Mon', sessions: 4, height: 40, xp: 120 },
    { day: 'Tue', sessions: 7, height: 70, xp: 210 },
    { day: 'Wed', sessions: 5, height: 50, xp: 150 },
    { day: 'Thu', sessions: 9, height: 90, xp: 320 },
    { day: 'Fri', sessions: 6, height: 60, xp: 180 },
    { day: 'Sat', sessions: 8, height: 80, xp: 240 },
    { day: 'Sun', sessions: 11, height: 100, xp: 390 }
  ];

  topicsDistribution = [
    { name: 'Distributed Systems & Spring Boot 3', pct: 40, color: '#00D4FF' },
    { name: 'Angular 17 Architecture & RxJS', pct: 25, color: '#A855F7' },
    { name: 'AI/ML Infrastructure & RAG', pct: 20, color: '#10B981' },
    { name: 'Database Tuning & Cloud DevOps', pct: 15, color: '#F59E0B' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getAnalytics(1).subscribe(data => {
      this.analyticsData = data;
    });
  }
}
