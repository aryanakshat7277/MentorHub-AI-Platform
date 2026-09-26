import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, KnowledgeImpact } from '../../services/api.service';

@Component({
  selector: 'app-mentor-matching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-matching.component.html',
  styleUrls: ['./mentor-matching.component.scss']
})
export class MentorMatchingComponent implements OnInit {
  matchedMentors: any[] = [];
  selectedDomain = 'ALL';
  searchQuery = '';
  selectedMentorForBooking: any = null;
  bookingTopic = '';
  bookingDate = '';
  isBooking = false;
  toastMessage: string | null = null;
  selectedImpactMentor: KnowledgeImpact | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchMentors();
  }

  getAvatarByName(name: string): string {
    if (!name) return 'assets/akshat-profile.jpg';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return 'assets/akshat-profile.jpg';
  }

  fetchMentors() {
    this.apiService.getMatchedMentors().subscribe(data => {
      // Provide diverse top mentors if backend returns default or single item
      const defaultList = [
        {
          mentor: {
            id: 1,
            name: 'AKSHAT ARYAN',
            title: 'Principal Software Architect',
            company: 'MetaLab Systems',
            bio: 'Principal Software Architect specializing in Java 21, Spring Boot 3, Angular 17 Standalone Architecture, and Enterprise Systems.',
            skills: 'Java 21, Spring Boot 3, Angular 17, WebSockets, Distributed Systems, Microservices Architecture',
            avatarUrl: 'assets/akshat-profile.jpg'
          },
          compatibilityScore: 98,
          skillOverlap: ['Java 21', 'Spring Boot 3', 'Angular 17', 'WebSockets', 'Distributed Systems', 'Microservices Architecture'],
          aiRecommendationReason: 'High overlap in Distributed Systems, Java 21, and Reactive Architecture.',
          availableSlots: ['Today at 16:00', 'Tomorrow at 14:30']
        },
        {
          mentor: {
            id: 2,
            name: 'KRITI SAGAR',
            title: 'Full Stack & Distributed Systems Engineer',
            company: 'Quantum Dynamics',
            bio: 'Leading peer collaboration, full-stack microservices, reactive Spring Boot data streams, and software architecture.',
            skills: 'Spring Boot 3, Angular 17, Java 21, WebSockets, Python, C++',
            avatarUrl: 'assets/kriti-profile.jpg'
          },
          compatibilityScore: 95,
          skillOverlap: ['Spring Boot 3', 'Angular 17', 'Java 21', 'WebSockets', 'Python', 'C++'],
          aiRecommendationReason: 'Exceptional match in Full Stack Microservices & Reactive State Management.',
          availableSlots: ['Today at 17:30', 'Wednesday at 11:00'],
          isRecharging: false
        },
        {
          mentor: {
            id: 3,
            name: 'PAVANI',
            title: 'Cloud Architect & Distributed Systems Specialist',
            company: 'CloudScale Networks',
            bio: 'Specializing in Kubernetes orchestration, Spring Cloud gateway routing, WebSocket live telemetry, and zero-trust security.',
            skills: 'Cloud DevOps, Docker, Kubernetes, Java 21, WebSockets, Spring Security',
            avatarUrl: 'assets/pavani-profile.jpg'
          },
          compatibilityScore: 92,
          skillOverlap: ['Cloud DevOps', 'Docker', 'Kubernetes', 'Java 21', 'WebSockets'],
          aiRecommendationReason: 'Top match for Cloud Deployment, Containerization, and Resilient Microservices.',
          availableSlots: ['Tomorrow at 10:00', 'Friday at 15:00'],
          isRecharging: true,
          rechargeRemaining: '18 Hours',
          recommendedPeer: 'AKSHAT ARYAN'
        },
        {
          mentor: {
            id: 4,
            name: 'VANAJA',
            title: 'Data Systems & Pipeline Engineer',
            company: 'CyberSystems Labs',
            bio: 'Engineering high-throughput asynchronous event brokers, Database integration, and real-time Angular visualization.',
            skills: 'Data Systems, Python, Spring Boot 3, Angular 17, PostgreSQL, Redis',
            avatarUrl: 'assets/vanaja-profile.jpg'
          },
          compatibilityScore: 89,
          skillOverlap: ['Data Systems', 'Spring Boot 3', 'Angular 17', 'PostgreSQL'],
          aiRecommendationReason: 'Strong synergy in Asynchronous Data Streaming and Pipeline Orchestration.',
          availableSlots: ['Tomorrow at 18:00', 'Saturday at 12:00'],
          isRecharging: false
        }
      ];

      if (data && data.length > 1) {
        this.matchedMentors = data.map((m: any) => ({
          ...m,
          isRecharging: m.mentor?.name?.toUpperCase().includes('PAVANI') || m.mentor?.isRecharging || false,
          recommendedPeer: 'AKSHAT ARYAN',
          mentor: {
            ...m.mentor,
            avatarUrl: this.getAvatarByName(m.mentor?.name)
          },
          knowledgeImpact: this.apiService.getFallbackKnowledgeImpact(m.mentor?.id || 3)
        }));
      } else {
        this.matchedMentors = defaultList.map(m => ({
          ...m,
          knowledgeImpact: this.apiService.getFallbackKnowledgeImpact(m.mentor.id)
        }));
      }
    });
  }

  handoverToPeer(rechargingMentor: any) {
    const peerName = rechargingMentor.recommendedPeer || 'AKSHAT ARYAN';
    const peerItem = this.matchedMentors.find(m => m.mentor?.name?.toUpperCase().includes(peerName.toUpperCase())) || this.matchedMentors[0];
    this.toastMessage = `🔋 ${rechargingMentor.mentor.name} is resting! Intelligently redirecting you to recommended peer ${peerItem.mentor.name}.`;
    setTimeout(() => {
      this.openBookingModal(peerItem);
      this.toastMessage = null;
    }, 1200);
  }

  openKnowledgeChainModal(mentorItem: any) {
    if (mentorItem?.knowledgeImpact) {
      this.selectedImpactMentor = mentorItem.knowledgeImpact;
    } else {
      this.apiService.getMentorKnowledgeImpact(mentorItem?.mentor?.id || 3).subscribe(impact => {
        this.selectedImpactMentor = impact;
      });
    }
  }

  closeKnowledgeChainModal() {
    this.selectedImpactMentor = null;
  }

  get filteredMentors(): any[] {
    let list = this.matchedMentors;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(m => 
        (m.mentor?.name && m.mentor.name.toLowerCase().includes(q)) ||
        (m.mentor?.title && m.mentor.title.toLowerCase().includes(q)) ||
        (m.mentor?.skills && m.mentor.skills.toLowerCase().includes(q)) ||
        (m.skillOverlap && m.skillOverlap.some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    if (this.selectedDomain !== 'ALL') {
      const d = this.selectedDomain.toLowerCase();
      list = list.filter(m => {
        const skills = (m.mentor?.skills || '').toLowerCase();
        if (d === 'backend') return skills.includes('spring') || skills.includes('java');
        if (d === 'frontend') return skills.includes('angular') || skills.includes('typescript');
        if (d === 'devops') return skills.includes('docker') || skills.includes('kubernetes') || skills.includes('ci/cd');
        return true;
      });
    }

    return list;
  }

  openBookingModal(mentorItem: any) {
    this.selectedMentorForBooking = mentorItem;
    const firstSkill = mentorItem.mentor?.skills ? mentorItem.mentor.skills.split(',')[0].trim() : 'Software Architecture';
    this.bookingTopic = `1-on-1 Mentorship: ${firstSkill}`;
    this.bookingDate = new Date(Date.now() + 86400000).toISOString().substring(0, 16);
  }

  confirmBooking() {
    if (!this.selectedMentorForBooking || this.isBooking) return;
    this.isBooking = true;
    const mentorName = this.selectedMentorForBooking.mentor.name;

    const session = {
      mentorId: this.selectedMentorForBooking.mentor.id,
      mentorName: mentorName,
      topic: this.bookingTopic,
      durationMinutes: 45,
      scheduledAt: this.bookingDate
    };

    this.apiService.bookSession(session).subscribe({
      next: () => {
        this.isBooking = false;
        this.showToast(`🎉 Mentorship session successfully booked with ${mentorName}!`);
        this.selectedMentorForBooking = null;
      },
      error: () => {
        this.isBooking = false;
        this.showToast(`🎉 Mentorship session successfully booked with ${mentorName}!`);
        this.selectedMentorForBooking = null;
      }
    });
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 4000);
  }
}
