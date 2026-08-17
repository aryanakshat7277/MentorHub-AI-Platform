import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.scss']
})
export class GamificationComponent implements OnInit {
  leaderboard: any[] = [];
  badges: any[] = [];

  constructor(private apiService: ApiService) {}

  getAvatarByName(name: string): string {
    if (!name) return 'assets/mentorhub-logo.png';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return 'assets/mentorhub-logo.png';
  }

  ngOnInit() {
    this.apiService.getLeaderboard().subscribe(data => {
      const rawList = data || [
        { rank: 1, name: 'AKSHAT ARYAN', role: 'MENTOR', xpPoints: 4890, title: 'Principal AI & Full Stack Mentor' },
        { rank: 2, name: 'KRITI SAGAR', role: 'MENTEE', xpPoints: 2450, title: 'Junior AI Engineer & Full Stack Mentee' },
        { rank: 3, name: 'PAVANI', role: 'MENTEE', xpPoints: 2120, title: 'Full Stack & Cloud Mentee' },
        { rank: 4, name: 'VANAJA', role: 'MENTEE', xpPoints: 1980, title: 'AI Systems & DevOps Mentee' }
      ];

      // Filter out duplicate user names so AKSHAT ARYAN appears ONLY ONCE
      const uniqueList: any[] = [];
      const seenNames = new Set<string>();

      for (const item of rawList) {
        const cleanName = (item.name || 'AKSHAT ARYAN').trim().toUpperCase();
        if (!seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          uniqueList.push(item);
        }
      }

      this.leaderboard = uniqueList.map((u, idx) => {
        return {
          ...u,
          rank: idx + 1,
          avatarUrl: this.getAvatarByName(u.name),
          xpPoints: u.xpPoints || u.xp || 4890,
          title: u.title || ((u.name || '').toUpperCase().includes('AKSHAT') ? 'Principal AI & Full Stack Mentor' : 'Scholar & Mentee')
        };
      });

      // Sort descending by XP Points so #1 is AKSHAT ARYAN (4,890 XP)
      this.leaderboard.sort((a, b) => (b.xpPoints || 0) - (a.xpPoints || 0));
    });

    this.apiService.getBadges().subscribe(data => {
      this.badges = (data && data.length > 0) ? data : [
        { name: 'Master Mentor', description: 'Orchestrated 50+ real-time sessions.', iconUrl: '👑', xpValue: 500 },
        { name: 'Code Titan', description: 'Authored 5,000+ lines of Spring & Angular code.', iconUrl: '💻', xpValue: 400 },
        { name: '14-Day Streak Master', description: 'Maintained 14-day continuous daily streak.', iconUrl: '🔥', xpValue: 300 },
        { name: 'Verified Specialist', description: 'Earned official AI Microservices Certificate.', iconUrl: '🎓', xpValue: 600 }
      ];
    });
  }
}
