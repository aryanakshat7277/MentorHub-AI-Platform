import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('dashFileInput') dashFileInput!: ElementRef<HTMLInputElement>;

  currentTime = '';
  currentDate = 'Friday, Aug 14';
  private timer: any;

  // Immediate default Mentor state to prevent UI flicker
  user: any = {
    id: 1,
    name: 'AKSHAT ARYAN',
    email: 'akshat@mentorhub.com',
    role: 'MENTOR',
    title: 'Principal AI & Full Stack Mentor',
    company: 'MetaLab Cybernetics',
    xpPoints: 4890,
    currentStreak: 32,
    rating: 5.0,
    hoursMentored: 142,
    totalSessions: 94,
    badgesCount: 16,
    level: 10,
    nextLevelXp: 6000,
    avatarUrl: 'assets/mentorhub-logo.png'
  };

  radialGauges: any[] = [];
  upcomingSessions: any[] = [];
  radarFeed: any[] = [];

  quickActions = [
    { title: 'Goal Tracker', route: '/goals', icon: '🎯', color: '#38BDF8', desc: 'S.M.A.R.T Tracking' },
    { title: 'Book Session', route: '/sessions', icon: '📅', color: '#00D4FF', desc: 'Schedule 1-on-1' },
    { title: 'Analytics', route: '/analytics', icon: '📈', color: '#818CF8', desc: 'Velocity Metrics' },
    { title: 'Leaderboard', route: '/gamification', icon: '🏆', color: '#F59E0B', desc: 'XP & Badges' },
    { title: 'Resource Hub', route: '/resource-hub', icon: '📚', color: '#A855F7', desc: 'Study Guides' },
    { title: 'Live Workspace', route: '/workspace', icon: '💻', color: '#10B981', desc: 'Real Compiler' }
  ];

  constructor(private apiService: ApiService) {
    this.setupRoleSpecificData();
  }

  ngOnInit() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);

    this.apiService.getCurrentUser().subscribe(data => {
      if (data) {
        const isMentor = (data.role || '').toUpperCase() === 'MENTOR' || (data.name || '').toUpperCase().includes('AKSHAT');
        const isAdmin = (data.role || '').toUpperCase() === 'ADMIN';

        let lvl = 10;
        let nextXp = 6000;

        if (isAdmin) {
          lvl = 20;
          nextXp = 12000;
        } else if (isMentor) {
          lvl = 10;
          nextXp = 6000;
        } else {
          lvl = 5;
          nextXp = 3000;
        }

        const isAkshat = (data.name || '').toUpperCase().includes('AKSHAT');
        const isVanaja = (data.name || '').toUpperCase().includes('VANAJA') || (data.email || '').toLowerCase().includes('vanaja');
        const isPavani = (data.name || '').toUpperCase().includes('PAVANI') || (data.email || '').toLowerCase().includes('pavani');
        const isKriti = (data.name || '').toUpperCase().includes('KRITI') || (data.email || '').toLowerCase().includes('kriti');

        let targetAvatar = 'assets/mentorhub-logo.png';
        if (isAkshat) targetAvatar = 'assets/akshat-profile.jpg';
        else if (isVanaja) targetAvatar = 'assets/vanaja-profile.jpg';
        else if (isPavani) targetAvatar = 'assets/pavani-profile.jpg';
        else if (isKriti) targetAvatar = 'assets/kriti-profile.jpg';
        else if (data.avatarUrl) targetAvatar = data.avatarUrl;

        this.user = {
          ...this.user,
          ...data,
          level: lvl,
          nextLevelXp: nextXp,
          avatarUrl: targetAvatar
        };

        if (typeof localStorage !== 'undefined') {
          if (isAkshat || isVanaja || isPavani || isKriti) {
            localStorage.setItem('userAvatar', targetAvatar);
            this.user.avatarUrl = targetAvatar;
          } else {
            const savedAvatar = localStorage.getItem('userAvatar');
            if (savedAvatar) {
              this.user.avatarUrl = savedAvatar;
            }
          }
        }

        this.setupRoleSpecificData();
      }
    });
  }

  setupRoleSpecificData() {
    const role = (this.user?.role || 'MENTOR').toUpperCase();
    const name = this.user?.name || 'AKSHAT ARYAN';

    if (role === 'ADMIN') {
      this.radialGauges = [
        { title: 'System Uptime', percent: 99, color: '#00D4FF', strokeDash: '310, 314' },
        { title: 'Platform Security', percent: 100, color: '#4ADE80', strokeDash: '314, 314' },
        { title: 'Active AI Nodes', percent: 94, color: '#A855F7', strokeDash: '295, 314' }
      ];

      this.upcomingSessions = [
        { mentor: 'AKSHAT ARYAN', mentee: 'KRITI SAGAR', topic: 'Spring Boot 3 & WebSockets', time: '15:00 PM Today — KRITI SAGAR', status: 'CONFIRMED', avatar: 'assets/kriti-profile.jpg' },
        { mentor: 'AKSHAT ARYAN', mentee: 'PAVANI', topic: 'Angular 17 Standalone Components', time: '11:30 AM Tomorrow — PAVANI', status: 'UPCOMING', avatar: 'assets/pavani-profile.jpg' },
        { mentor: 'AKSHAT ARYAN', mentee: 'VANAJA', topic: 'Cloud Microservices & H2 Database', time: '14:00 PM Thursday — VANAJA', status: 'COMPLETED', avatar: 'assets/vanaja-profile.jpg' }
      ];

      this.radarFeed = [
        { type: 'SECURITY', text: 'Global JWT Authentication Audit: 100% Passed', time: '5m ago', icon: '🛡️' },
        { type: 'USER', text: 'Mentee KRITI SAGAR completed Session #18', time: '20m ago', icon: '⚡' },
        { type: 'SYSTEM', text: 'H2 Database auto-seeded & verified cleanly', time: '1h ago', icon: '💾' },
        { type: 'AI_NET', text: 'Piston Compiler Cluster: 100% Operational', time: '2h ago', icon: '💻' }
      ];
    } else if (role === 'MENTOR') {
      this.radialGauges = [
        { title: 'Mentorship Velocity', percent: 95, color: '#00D4FF', strokeDash: '298, 314' },
        { title: 'Code Review Score', percent: 88, color: '#A855F7', strokeDash: '276, 314' },
        { title: 'Peer Leadership', percent: 98, color: '#4ADE80', strokeDash: '308, 314' }
      ];

      this.upcomingSessions = [
        { mentor: 'AKSHAT ARYAN', mentee: 'KRITI SAGAR', topic: 'Spring Boot 3 WebSockets & Real-Time Sync', time: '15:00 PM Today', status: 'CONFIRMED', avatar: 'assets/kriti-profile.jpg' },
        { mentor: 'AKSHAT ARYAN', mentee: 'PAVANI', topic: 'Angular 17 Standalone & Sci-Fi UI Layout', time: '11:30 AM Tomorrow', status: 'UPCOMING', avatar: 'assets/pavani-profile.jpg' },
        { mentor: 'AKSHAT ARYAN', mentee: 'VANAJA', topic: 'Distributed RAG Vector Search & Embeddings', time: '14:00 PM Thursday', status: 'COMPLETED', avatar: 'assets/vanaja-profile.jpg' }
      ];

      this.radarFeed = [
        { type: 'FEEDBACK', text: 'KRITI SAGAR submitted session feedback: 5.0 ⭐', time: '10m ago', icon: '💬' },
        { type: 'FEEDBACK', text: 'PAVANI completed Angular 17 Standalone component module', time: '45m ago', icon: '⚡' },
        { type: 'MILESTONE', text: 'VANAJA achieved goal: H2 Spring Data JPA Persistence', time: '2h ago', icon: '🎯' },
        { type: 'BADGE', text: 'AKSHAT ARYAN awarded Master Mentor Badge LVL 10', time: '3h ago', icon: '🏆' }
      ];
    } else {
      // MENTEE (KRITI SAGAR / PAVANI / VANAJA)
      this.radialGauges = [
        { title: 'Curriculum Progress', percent: 82, color: '#00D4FF', strokeDash: '257, 314' },
        { title: 'Assignment Score', percent: 94, color: '#4ADE80', strokeDash: '295, 314' },
        { title: 'Streak Power', percent: 88, color: '#F59E0B', strokeDash: '276, 314' }
      ];

      this.upcomingSessions = [
        { mentor: 'AKSHAT ARYAN', mentee: name, topic: 'Spring Boot 3 & WebSockets 1-on-1', time: '15:00 PM Today', status: 'CONFIRMED', avatar: 'assets/akshat-profile.jpg' },
        { mentor: 'AKSHAT ARYAN', mentee: name, topic: 'Angular 17 Standalone Architecture Review', time: '16:30 PM Saturday', status: 'UPCOMING', avatar: 'assets/akshat-profile.jpg' }
      ];

      this.radarFeed = [
        { type: 'ASSIGNMENT', text: 'Mentor AKSHAT ARYAN verified your WebSocket Code submission', time: '15m ago', icon: '✅' },
        { type: 'MILESTONE', text: `${name} reached 14-Day Continuous Daily Learning Streak!`, time: '1h ago', icon: '🔥' },
        { type: 'RESOURCE', text: 'New Study Resource added: Spring Boot 3 & Angular Architecture PDF', time: '2h ago', icon: '📄' },
        { type: 'BADGE', text: `${name} unlocked '⚡ High Scholar' Badge!`, time: '5h ago', icon: '🏆' }
      ];
    }
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  triggerDashFileInput() {
    if (this.dashFileInput && this.dashFileInput.nativeElement) {
      this.dashFileInput.nativeElement.click();
    }
  }

  onDashFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        if (this.user) {
          this.user.avatarUrl = base64Image;
        }
        this.apiService.updateCurrentUser({ avatarUrl: base64Image }).subscribe();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userAvatar', base64Image);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.currentDate = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }

  getXpPercentage(): number {
    if (!this.user) return 82;
    const current = this.user.xpPoints || 4890;
    const target = this.user.nextLevelXp || 6000;
    return Math.min(100, Math.round((current / target) * 100));
  }
}
