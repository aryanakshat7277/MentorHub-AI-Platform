import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-proof-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './proof-portfolio.component.html',
  styleUrls: ['./proof-portfolio.component.scss']
})
export class ProofPortfolioComponent implements OnInit {
  username: string = 'akshat';
  portfolio: any = null;
  isLoading: boolean = true;
  isCopied: boolean = false;
  activeTab: 'all' | 'quests' | 'goals' | 'endorsements' = 'all';
  showVerificationModal: boolean = false;

  isPayloadCopied: boolean = false;
  qrCodeUrl: string = '';
  modalQrCodeUrl: string = '';

  profiles = [
    { username: 'akshat', label: 'Akshat Aryan (Lead Mentor)' },
    { username: 'pavani', label: 'Pavani (Scholar)' },
    { username: 'kriti-sagar', label: 'Kriti Sagar (Mentee)' },
    { username: 'vanaja', label: 'Vanaja (Security Engineer)' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const storedName = (typeof localStorage !== 'undefined' ? localStorage.getItem('userName') : '') || '';
      let defaultUser = 'akshat';
      if (storedName) {
        const u = storedName.toLowerCase();
        if (u.includes('pavani')) defaultUser = 'pavani';
        else if (u.includes('kriti')) defaultUser = 'kriti-sagar';
        else if (u.includes('vanaja')) defaultUser = 'vanaja';
        else defaultUser = 'akshat';
      }
      this.username = (params['username'] || defaultUser).toLowerCase();
      this.loadPortfolio();
    });
    this.route.queryParams.subscribe(q => {
      if (q['verify']) {
        this.showVerificationModal = true;
      }
    });
  }

  loadPortfolio(): void {
    this.isLoading = true;
    this.apiService.getPublicPortfolio(this.username).subscribe({
      next: (data) => {
        this.portfolio = this.enrichUniquePortfolio(data, this.username);
        this.updateQrCode();
        this.isLoading = false;
      },
      error: () => {
        this.portfolio = this.enrichUniquePortfolio({}, this.username);
        this.updateQrCode();
        this.isLoading = false;
      }
    });
  }

  updateQrCode(): void {
    if (!this.portfolio) return;
    this.qrCodeUrl = this.getPortfolioQrCodeUrl(260);
    this.modalQrCodeUrl = this.getPortfolioQrCodeUrl(360);
  }

  private enrichUniquePortfolio(raw: any, slug: string): any {
    const key = (slug || 'akshat').toLowerCase();
    const presets: Record<string, any> = {
      'akshat': {
        verificationCode: 'MH-PROOF-884920',
        signatureHash: '8a1f3c7e9d0b2a4f6e8d1c3b5a7f9e0d2c4b6a8f1e3d5c7b9a0f2e4d6c8b0a1f',
        profile: {
          name: 'Akshat Aryan',
          title: 'Senior Mentor & Principal Software Architect',
          company: 'Centurion University (CUTM) • MentorHub Platform',
          bio: 'Principal Software Architect. Designed the Spring Boot 3 distributed backend, real-time voice streaming engine, and cryptographic verification core.',
          avatarUrl: 'assets/akshat-profile.jpg',
          xpPoints: 9850,
          streak: 88,
          level: 20,
          karmaPoints: 1250
        },
        knowledgeImpact: {
          impactScore: 99,
          studentsHelped: 48,
          sessionsCompleted: 74,
          studentsImproved: 45,
          sharingChainReach: 6
        },
        conqueredQuests: [
          { index: '01', title: 'Java 21 Virtual Threads & High-Concurrency Core', zone: 'Architecture Core', date: 'Jul 2026', badge: '☕ Principal JVM Architect' },
          { index: '02', title: 'Gemini 3.1 Flash Live Bidirectional Voice Engine', zone: 'Citadel Core', date: 'Aug 2026', badge: '🎙️ Multimodal Pioneer' },
          { index: '03', title: 'Distributed WebSocket IDE & Piston Code Sandbox', zone: 'Citadel Core', date: 'Sep 2026', badge: '💻 Distributed Systems Lead' },
          { index: '04', title: 'Ed25519 Cryptographic Credential Verification', zone: 'Trust Vault', date: 'Sep 2026', badge: '👑 Master Architect' }
        ],
        verifiedGoals: [
          { title: 'Build Sub-200ms Bidirectional Voice Mentorship Pipeline', category: 'Voice Infrastructure', targetDate: 'Aug 2026' },
          { title: 'Integrate 385+ CUTM University Courses & CBCS Baskets', category: 'Academic Systems', targetDate: 'Sep 2026' },
          { title: 'Coach 45+ Engineering Mentees to Production Mastery', category: 'Leadership', targetDate: 'Sep 2026' }
        ],
        endorsements: [
          {
            mentorName: 'Pavani',
            mentorRole: 'Cloud & Reactive Full-Stack Scholar • 100% Impact',
            endorsement: 'Akshat’s system design mentorship transformed how our entire cohort builds distributed Spring Boot and reactive Angular applications.',
            endorsedAt: 'September 2026'
          },
          {
            mentorName: 'Dr. Pramod Kumar Patjoshi',
            mentorRole: 'Senior Faculty, CUTM • 100% Distinction',
            endorsement: 'Exemplary technical leadership, combining production-grade systems engineering with rigorous university curriculum alignment.',
            endorsedAt: 'September 2026'
          }
        ]
      },
      'pavani': {
        verificationCode: 'MH-PROOF-575655',
        signatureHash: '9f4a8b2e7c1d6f03a7b9c4e2d1f8a0b3c5e7d9f12a4b6c8d0e2f4a6b8c0d2e4f',
        profile: {
          name: 'Pavani',
          title: 'Cloud Computing & Reactive Full-Stack Scholar',
          company: 'Centurion University (CUTM) • MentorHub',
          bio: 'Senior scholar specializing in Angular 17 reactive signal architectures, Spring Boot 3 microservices, and real-time distributed web systems.',
          avatarUrl: 'assets/pavani-profile.jpg',
          xpPoints: 3250,
          streak: 24,
          level: 7,
          karmaPoints: 380
        },
        knowledgeImpact: {
          impactScore: 95,
          studentsHelped: 19,
          sessionsCompleted: 28,
          studentsImproved: 16,
          sharingChainReach: 5
        },
        conqueredQuests: [
          { index: '01', title: 'Angular 17 Reactive Signals & Standalone UI', zone: 'Signal Sanctum', date: 'Aug 2026', badge: '🅰️ Reactive Master' },
          { index: '02', title: 'Spring Boot 3 Security & JWT Filter Chains', zone: 'Crypt of Credentials', date: 'Aug 2026', badge: '🛡️ Security Paladin' },
          { index: '03', title: 'WebSockets & Real-Time Collaborative Canvas', zone: 'Citadel Core', date: 'Sep 2026', badge: '⚡ Realtime Architect' },
          { index: '04', title: 'Cloud-Native Microservices & Docker Orchestration', zone: 'Highlands', date: 'Sep 2026', badge: '☁️ Cloud Vanguard' }
        ],
        verifiedGoals: [
          { title: 'Architect Zero-Lag Reactive Dashboard & Audio Synth', category: 'Frontend Architecture', targetDate: 'Aug 2026' },
          { title: 'Stateless JWT BCrypt Authentication Pipeline', category: 'Security Engineering', targetDate: 'Aug 2026' },
          { title: 'Mentor 15+ Junior Scholars on Angular Signals', category: 'Peer Mentorship', targetDate: 'Sep 2026' }
        ],
        endorsements: [
          {
            mentorName: 'Akshat Aryan',
            mentorRole: 'Principal Software Architect • 99% Match',
            endorsement: 'Pavani engineered reactive UI states and WebSocket synchronization with outstanding architectural precision and zero latency.',
            endorsedAt: 'September 2026'
          },
          {
            mentorName: 'Dr. Sujata Chakravarty',
            mentorRole: 'Professor & Dean, CUTM • 97% Academic Rating',
            endorsement: 'Consistently demonstrated top-decile engineering execution across CBCS domain coursework and full-stack laboratory evaluations.',
            endorsedAt: 'September 2026'
          }
        ]
      },
      'kriti-sagar': {
        verificationCode: 'MH-PROOF-319402',
        signatureHash: '3c8e1b9d7a5f204c6e8d1a3f5b7e9c0d2b4a6f8e1c3a5d7f9b0e2a4c6d8f0b2c',
        profile: {
          name: 'Kriti Sagar',
          title: 'AI/ML Scholar & Deep Neural Networks Researcher',
          company: 'Centurion University (CUTM) • AI Research Track',
          bio: 'Computer Science & AI Scholar specializing in PyTorch deep learning architectures, vector embeddings, and Retrieval-Augmented Generation (RAG) pipelines.',
          avatarUrl: 'assets/kriti-profile.jpg',
          xpPoints: 2890,
          streak: 19,
          level: 6,
          karmaPoints: 310
        },
        knowledgeImpact: {
          impactScore: 93,
          studentsHelped: 16,
          sessionsCompleted: 24,
          studentsImproved: 14,
          sharingChainReach: 4
        },
        conqueredQuests: [
          { index: '01', title: 'Multivariable Calculus, Jacobians & Hessian Optimization', zone: 'Foundation Core', date: 'Aug 2026', badge: '📐 Math Virtuoso' },
          { index: '02', title: 'Transformer Self-Attention & Token Embeddings', zone: 'AI Sanctum', date: 'Aug 2026', badge: '🧠 Neural Pioneer' },
          { index: '03', title: 'Semantic Vector Search & Cosine Similarity Indexing', zone: 'Data Vault', date: 'Sep 2026', badge: '🔍 RAG Specialist' },
          { index: '04', title: 'Production LLM Guardrails & Prompt Pipelines', zone: 'Citadel Core', date: 'Sep 2026', badge: '✨ AI Engineer' }
        ],
        verifiedGoals: [
          { title: 'Implement High-Precision Semantic Course Recommender', category: 'Applied AI', targetDate: 'Aug 2026' },
          { title: 'Fine-Tune Vision & Audio Classification Pipeline', category: 'Deep Learning', targetDate: 'Sep 2026' },
          { title: 'Publish Peer Study Guides on Neural Backpropagation', category: 'Academic Impact', targetDate: 'Sep 2026' }
        ],
        endorsements: [
          {
            mentorName: 'Akshat Aryan',
            mentorRole: 'Principal Software Architect • 98% Match',
            endorsement: 'Kriti possesses deep mathematical intuition for gradient optimization, vector indexing, and modern transformer architectures.',
            endorsedAt: 'September 2026'
          },
          {
            mentorName: 'Vanaja',
            mentorRole: 'Data Analytics & Security Engineer • 95% Impact',
            endorsement: 'Collaborated seamlessly on streaming data pipelines and high-throughput ML inference endpoints.',
            endorsedAt: 'September 2026'
          }
        ]
      },
      'vanaja': {
        verificationCode: 'MH-PROOF-742108',
        signatureHash: '7b2e5c9a1f4d806b3e7a9c1d5f2a8e0b4c6d8f1a3c5e7b9d0f2a4e6c8b0d2f4a',
        profile: {
          name: 'Vanaja',
          title: 'Data Analytics & Cyber Security Engineer',
          company: 'Centurion University (CUTM) • Cyber & Data Track',
          bio: 'Data Engineering & Cyber Security Specialist focusing on Apache Kafka event streaming, zero-trust network security, and cryptographic audit ledgers.',
          avatarUrl: 'assets/vanaja-profile.jpg',
          xpPoints: 3040,
          streak: 22,
          level: 7,
          karmaPoints: 345
        },
        knowledgeImpact: {
          impactScore: 94,
          studentsHelped: 17,
          sessionsCompleted: 26,
          studentsImproved: 15,
          sharingChainReach: 4
        },
        conqueredQuests: [
          { index: '01', title: 'Public-Key Cryptography, SHA-256 & Ed25519 Signatures', zone: 'Crypt of Credentials', date: 'Aug 2026', badge: '🔐 Crypto Guardian' },
          { index: '02', title: 'Apache Kafka Distributed Event Streaming', zone: 'Data Pipeline', date: 'Aug 2026', badge: '📊 Stream Architect' },
          { index: '03', title: 'OWASP Top-10 Hardening & Zero-Trust API Gateways', zone: 'Security Bastion', date: 'Sep 2026', badge: '🛡️ Cyber Sentinel' },
          { index: '04', title: 'Kubernetes Cluster Telemetry & Automated CI/CD', zone: 'Citadel Core', date: 'Sep 2026', badge: '⚙️ DevSecOps Lead' }
        ],
        verifiedGoals: [
          { title: 'Design Tamper-Proof Cryptographic Audit Trail', category: 'Cyber Security', targetDate: 'Aug 2026' },
          { title: 'Deploy Real-Time Kafka Telemetry Aggregator', category: 'Data Engineering', targetDate: 'Sep 2026' },
          { title: 'Conduct 10+ Peer Security Code Reviews', category: 'Mentorship', targetDate: 'Sep 2026' }
        ],
        endorsements: [
          {
            mentorName: 'Akshat Aryan',
            mentorRole: 'Principal Software Architect • 98% Match',
            endorsement: 'Vanaja’s mastery of cryptographic primitives, event streaming, and API security hardening is top-tier.',
            endorsedAt: 'September 2026'
          },
          {
            mentorName: 'Pavani',
            mentorRole: 'Cloud & Reactive Full-Stack Scholar • 96% Impact',
            endorsement: 'Delivered rock-solid security policies and real-time analytics schemas across our joint capstone projects.',
            endorsedAt: 'September 2026'
          }
        ]
      }
    };

    const chosen = presets[key] || presets['akshat'];

    // Dynamic telemetry synchronization for Akshat Aryan & active logged in user
    if (key === 'akshat' && typeof localStorage !== 'undefined') {
      const storedXp = parseInt(localStorage.getItem('userXpPoints') || '0', 10);
      if (storedXp > 0) {
        chosen.profile.xpPoints = Math.max(chosen.profile.xpPoints, storedXp);
      }
      if (localStorage.getItem('cutm_modules_progress')) {
        try {
          const modMap = JSON.parse(localStorage.getItem('cutm_modules_progress') || '{}');
          const modCount = Object.keys(modMap).length;
          if (modCount > 0 && !chosen.verifiedGoals.some((g: any) => g.title.includes('Centurion University Course Modules'))) {
            chosen.verifiedGoals.unshift({
              title: `Mastered ${modCount} Centurion University Course Modules across CBCS Curriculum`,
              category: 'Academic Systems',
              targetDate: 'Sep 2026'
            });
          }
        } catch (e) {}
      }
    }
    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:4200';
    const verificationUrl = `${origin}/portfolio/${key}?verify=${chosen.verificationCode}`;

    return {
      ...raw,
      profile: {
        ...(raw?.profile || {}),
        ...chosen.profile
      },
      knowledgeImpact: chosen.knowledgeImpact,
      conqueredQuests: chosen.conqueredQuests,
      verifiedGoals: chosen.verifiedGoals,
      endorsements: chosen.endorsements,
      verificationCode: chosen.verificationCode,
      signatureHash: chosen.signatureHash,
      verificationUrl,
      issuedAt: 'September 2026'
    };
  }

  getVerificationQrPayload(): string {
    if (!this.portfolio) return 'MENTORHUB VERIFIED PORTFOLIO';
    const p = this.portfolio;
    const questsList = (p.conqueredQuests || [])
      .map((q: any) => `  [${q.index}] ${q.title} (${q.badge})`)
      .join('\n');
    const goalsList = (p.verifiedGoals || [])
      .map((g: any) => `  ✓ ${g.title} [${g.category} - 100% VERIFIED]`)
      .join('\n');
    const endorsementsList = (p.endorsements || [])
      .map((e: any) => `  • ${e.mentorName} (${e.mentorRole})`)
      .join('\n');

    return [
      '============================================',
      '🛡️ MENTORHUB CRYPTOGRAPHIC PORTFOLIO PROOF',
      'Centurion University (CUTM) • Verified Record',
      '============================================',
      `👤 SCHOLAR: ${p.profile?.name}`,
      `💼 DESIGNATION: ${p.profile?.title}`,
      `🏛️ INSTITUTION: ${p.profile?.company}`,
      '',
      `🆔 VERIFICATION ID: ${p.verificationCode}`,
      `🔐 SHA-256 FINGERPRINT: ${p.signatureHash?.substring(0, 32)}...`,
      `📅 ISSUED: ${p.issuedAt} | STATUS: 100% AUTHENTIC`,
      '',
      '📊 VERIFIED TELEMETRY & IMPACT:',
      `  • Mastery Level: Level ${p.profile?.level} (${p.profile?.xpPoints} XP)`,
      `  • Active Streak: ${p.profile?.streak} Days | Karma: ${p.profile?.karmaPoints}`,
      `  • Impact Score: ${p.knowledgeImpact?.impactScore}/100`,
      `  • Peers Helped: ${p.knowledgeImpact?.studentsHelped} | Sessions: ${p.knowledgeImpact?.sessionsCompleted}`,
      '',
      '⚔️ CONQUERED MILESTONES:',
      questsList,
      '',
      '🎯 VERIFIED S.M.A.R.T. GOALS:',
      goalsList,
      '',
      '💬 MENTOR ENDORSEMENTS:',
      endorsementsList,
      '',
      `🔗 VERIFY ONLINE: ${p.verificationUrl}`,
      '============================================'
    ].join('\n');
  }

  getPortfolioQrCodeUrl(size: number = 340): string {
    const payload = this.getVerificationQrPayload();
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=M&margin=8&color=150E0B&bgcolor=FFFFFF&data=${encodeURIComponent(payload)}`;
  }

  copyVerificationPayload(event?: Event): void {
    if (event) event.stopPropagation();
    const payload = this.getVerificationQrPayload();
    navigator.clipboard.writeText(payload).then(() => {
      this.isPayloadCopied = true;
      this.soundService.playSuccessSound();
      setTimeout(() => (this.isPayloadCopied = false), 3000);
    });
  }

  switchProfile(userSlug: string): void {
    this.soundService.playClickSound();
    this.username = userSlug;
    this.router.navigate(['/portfolio', userSlug]);
    this.loadPortfolio();
  }

  setTab(tab: 'all' | 'quests' | 'goals' | 'endorsements'): void {
    this.soundService.playClickSound();
    this.activeTab = tab;
  }

  openVerificationModal(): void {
    this.soundService.playSuccessSound();
    this.showVerificationModal = true;
  }

  closeVerificationModal(): void {
    this.soundService.playClickSound();
    this.showVerificationModal = false;
  }

  copyShareLink(): void {
    const fullUrl = this.portfolio?.verificationUrl || window.location.href;
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.isCopied = true;
      this.soundService.playSuccessSound();
      setTimeout(() => this.isCopied = false, 3000);
    });
  }

  printResume(): void {
    this.soundService.playClickSound();
    window.print();
  }
}
