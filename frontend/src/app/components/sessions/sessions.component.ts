import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';

export interface PeerMentor {
  id: number;
  name: string;
  title: string;
  company: string;
  specialty: string;
  rating: number;
  matchScore: number;
  avatar: string;
}

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
  showTransferModal = false;

  // Session being transferred
  sessionToTransfer: any = null;

  // Transfer Form State
  transferForm = {
    newMentorName: '',
    newMentorId: 0,
    transferReason: '',
    selectedQuickTag: ''
  };

  // Peer Mentors Catalog
  allPeerMentors: PeerMentor[] = [
    {
      id: 1,
      name: 'AKSHAT ARYAN',
      title: 'Principal AI & Full-Stack Architect',
      company: 'MetaLab Cybernetics',
      specialty: 'Java 21, Spring Boot 3, Reactive Microservices & WebSockets',
      rating: 5.0,
      matchScore: 98,
      avatar: 'assets/akshat-profile.jpg'
    },
    {
      id: 2,
      name: 'KRITI SAGAR',
      title: 'Full-Stack & Reactive Signal Engineer',
      company: 'Quantum Dynamics',
      specialty: 'Angular 17 Standalone, Spring Boot 3, RAG AI & PostgreSQL',
      rating: 4.9,
      matchScore: 95,
      avatar: 'assets/kriti-profile.jpg'
    },
    {
      id: 3,
      name: 'PAVANI',
      title: 'Senior Frontend & Graphics Specialist',
      company: 'Apex Digital Labs',
      specialty: 'Angular 17, RxJS, TypeScript, HTML5 Canvas & UX/UI Architecture',
      rating: 4.9,
      matchScore: 92,
      avatar: 'assets/pavani-profile.jpg'
    },
    {
      id: 4,
      name: 'VANAJA',
      title: 'Cloud Infrastructure & DevOps Engineer',
      company: 'CloudCore Systems',
      specialty: 'Docker, Kubernetes Ingress, Microservices Mesh & CI/CD Pipelines',
      rating: 4.8,
      matchScore: 90,
      avatar: 'assets/vanaja-profile.jpg'
    }
  ];

  filteredPeerMentors: PeerMentor[] = [];

  // Quick Handover Tags
  quickReasonTags = [
    'Needs Cloud Infrastructure & Kubernetes Specialist',
    'Needs Machine Learning & AI Prompting Expert',
    'Needs Reactive Frontend & HTML5 Canvas Graphics Specialist',
    'Needs Java 21 Concurrency & Microservices Architecture Mentor',
    'Schedule Conflict — Recommending to Best Available Peer Mentor'
  ];

  newSession = {
    mentorName: 'AKSHAT ARYAN',
    topic: 'Spring Boot 3 WebSockets & Microservices',
    durationMinutes: 60,
    scheduledAt: new Date(Date.now() + 86400000).toISOString().substring(0, 16),
    isReverseMentoring: false,
    reverseTopic: ''
  };

  // Toast Notification
  toastMessage = '';
  showToast = false;

  constructor(
    private apiService: ApiService,
    private soundService: SoundService
  ) {}

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

  toggleReverseMentoring() {
    this.soundService.playClick();
    this.newSession.isReverseMentoring = !this.newSession.isReverseMentoring;
    if (this.newSession.isReverseMentoring) {
      this.newSession.durationMinutes = 30;
      this.newSession.topic = 'Showcase: Modern Tailwind Tricks & Browser APIs';
      this.displayToast('🔄 Reverse Mentoring Enabled! You will teach the mentor and earn the Two-Way Learner badge.');
    } else {
      this.newSession.durationMinutes = 60;
      this.newSession.topic = 'Spring Boot 3 WebSockets & Microservices';
    }
  }

  joinShadow(session: any) {
    this.soundService.playClick();
    this.apiService.joinShadowSession(session.id).subscribe(() => {
      this.soundService.playSuccess();
      this.displayToast(`👁️ Joining Session #${session.id} as a Silent Co-Pilot Spectator!`);
      window.location.href = `/workspace?sessionId=${session.id}&mode=spectator`;
    });
  }

  createSession() {
    this.soundService.playClick();
    this.apiService.bookSession(this.newSession).subscribe(() => {
      this.showBookingModal = false;
      this.soundService.playSuccess();
      this.displayToast('✨ New Mentoring Session Scheduled Successfully!');
      this.loadSessions();
    });
  }

  updateStatus(session: any, newStatus: string) {
    this.soundService.playClick();
    this.apiService.updateSessionStatus(session.id, newStatus).subscribe(() => {
      session.status = newStatus;
      this.soundService.playSuccess();
      this.loadSessions();
    });
  }

  // ==========================================
  // MENTOR HANDOVER & TRANSFER LOGIC
  // ==========================================
  openTransferModal(session: any) {
    this.soundService.playClick();
    this.sessionToTransfer = session;

    // Filter out the current mentor so you only recommend to peer mentors
    const currentMentorUpper = (session.mentorName || '').toUpperCase();
    this.filteredPeerMentors = this.allPeerMentors.filter(
      m => !m.name.toUpperCase().includes(currentMentorUpper)
    );

    // Default select first available peer mentor
    const defaultPeer = this.filteredPeerMentors[0] || this.allPeerMentors[0];
    this.transferForm = {
      newMentorName: defaultPeer.name,
      newMentorId: defaultPeer.id,
      transferReason: '',
      selectedQuickTag: ''
    };

    this.showTransferModal = true;
  }

  closeTransferModal() {
    this.soundService.playClick();
    this.showTransferModal = false;
    this.sessionToTransfer = null;
  }

  selectPeerMentor(mentor: PeerMentor) {
    this.soundService.playClick();
    this.transferForm.newMentorName = mentor.name;
    this.transferForm.newMentorId = mentor.id;
  }

  applyQuickTag(tag: string) {
    this.soundService.playClick();
    this.transferForm.selectedQuickTag = tag;
    this.transferForm.transferReason = tag;
  }

  submitTransfer() {
    if (!this.sessionToTransfer || !this.transferForm.newMentorName) return;

    this.soundService.playClick();
    const sessionId = this.sessionToTransfer.id;
    const prevMentor = this.sessionToTransfer.mentorName;
    const targetMentor = this.transferForm.newMentorName;
    const reason = this.transferForm.transferReason || 'Transferred to peer mentor for specialized domain guidance.';

    this.apiService.transferSession(sessionId, {
      newMentorName: targetMentor,
      newMentorId: this.transferForm.newMentorId,
      transferReason: reason
    }).subscribe(() => {
      this.soundService.playSuccess();
      
      // Update local session state
      this.sessionToTransfer.previousMentorName = prevMentor;
      this.sessionToTransfer.mentorName = targetMentor;
      this.sessionToTransfer.transferReason = reason;
      this.sessionToTransfer.status = 'PENDING';

      this.showTransferModal = false;
      this.displayToast(`🔄 Session #MH-${sessionId} transferred from ${prevMentor} to ${targetMentor}!`);
      this.loadSessions();
    });
  }

  displayToast(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}
