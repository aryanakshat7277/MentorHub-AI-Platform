import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent implements OnInit {
  sessions: any[] = [];
  stats: any = { total: 18, pending: 2, completed: 14, confirmed: 2 };
  showBookingModal = false;

  newSession = {
    mentorName: 'AKSHAT ARYAN',
    topic: 'Spring Boot 3 WebSockets & Microservices',
    durationMinutes: 60,
    scheduledAt: new Date(Date.now() + 86400000).toISOString().substring(0, 16)
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadSessions();
  }

  getAvatarByName(name: string): string {
    if (!name) return 'assets/mentorhub-logo.png';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return 'assets/mentorhub-logo.png';
  }

  loadSessions() {
    this.apiService.getSessions().subscribe(data => {
      this.sessions = data;
    });

    this.apiService.getSessionStats().subscribe(st => {
      if (st) this.stats = st;
    });
  }

  createSession() {
    this.apiService.bookSession(this.newSession).subscribe(() => {
      this.showBookingModal = false;
      this.loadSessions();
    });
  }

  updateStatus(session: any, newStatus: string) {
    this.apiService.updateSessionStatus(session.id, newStatus).subscribe(() => {
      session.status = newStatus;
      this.loadSessions();
    });
  }
}
