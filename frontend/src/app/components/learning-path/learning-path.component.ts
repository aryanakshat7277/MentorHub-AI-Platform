import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';

export interface QuestObjective {
  title: string;
  done: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface QuestNode {
  id: number;
  nodeIndex: number;
  title: string;
  subtitle: string;
  zone: string;
  icon: string;
  type: 'QUEST' | 'CHEST' | 'BOSS' | 'MILESTONE';
  status: 'COMPLETED' | 'ACTIVE_QUEST' | 'AVAILABLE' | 'LOCKED';
  xpReward: number;
  badgeReward?: string;
  lore: string;
  estimatedTime: string;
  difficulty: 'NOVICE' | 'INTERMEDIATE' | 'ADVANCED' | 'LEGENDARY';
  objectives: QuestObjective[];
  mapX: number; // percentage X on map canvas (0 - 100)
  mapY: number; // percentage Y on map canvas (0 - 100)
  claimed: boolean;
}

export interface Realm {
  id: 'fullstack' | 'ai' | 'cloud';
  name: string;
  icon: string;
  tagline: string;
  accentColor: string;
  secondaryColor: string;
  heroRank: string;
  nodes: QuestNode[];
}

@Component({
  selector: 'app-learning-path',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning-path.component.html',
  styleUrls: ['./learning-path.component.scss']
})
export class LearningPathComponent implements OnInit, OnDestroy {
  @ViewChild('confettiCanvas') confettiCanvasRef!: ElementRef<HTMLCanvasElement>;

  user: any = null;
  heroLevel = 1;
  heroClass = 'Apprentice Coder';
  currentXp = 0;
  nextLevelXp = 500;
  levelProgressPct = 0;
  streakMultiplier = 1.0;
  dailyBountyClaimed = false;
  dailyBountyXp = 150;

  activeView: 'quest_map' | 'curricula_matrix' = 'quest_map';
  activeRealmId: 'fullstack' | 'ai' | 'cloud' = 'fullstack';
  selectedNode: QuestNode | null = null;
  isModalOpen = false;

  // Sound and Filtering Settings
  isSoundMuted = false;
  filterMode: 'ALL' | 'ACTIVE' | 'CHESTS' = 'ALL';

  // Celebration overlay
  isCelebrationActive = false;
  celebrationTitle = 'QUEST MASTERED!';
  celebrationSubtitle = '+250 XP Added to Your Profile';
  celebrationBadge = '';

  // Avatar Pin Position on Quest Map
  activeAvatarX = 12;
  activeAvatarY = 72;

  // Particle Animation Loop
  private animFrameId: number | null = null;
  private particles: any[] = [];

  // Classic Curricula & Roadmap Tree Data (Preserved & Enhanced)
  circularProgressCards = [
    { title: 'Spring Boot 3 & Microservices', pct: 68, color: '#DE7048', icon: '🍃', status: 'IN PROGRESS' },
    { title: 'Angular 17 Standalone & Skeuomorphic UI', pct: 55, color: '#B35E17', icon: '🅰️', status: 'IN PROGRESS' },
    { title: 'Distributed Systems & WebSockets', pct: 85, color: '#2A5A3D', icon: '🌐', status: 'ADVANCED' },
    { title: 'AI Engineering & RAG Architecture', pct: 40, color: '#D4AF37', icon: '🤖', status: 'STARTING' }
  ];

  roadmapTree = [
    { node: 1, title: 'Java 21 Virtual Threads & Concurrency', status: 'COMPLETED', date: 'Aug 02, 2026' },
    { node: 2, title: 'Spring Boot 3 WebSockets & Real-Time Sync', status: 'IN_PROGRESS', date: 'Active Now' },
    { node: 3, title: 'Angular Standalone Component Architecture', status: 'IN_PROGRESS', date: 'Active Now' },
    { node: 4, title: 'H2 File Persistence & Spring Data JPA', status: 'COMPLETED', date: 'Aug 10, 2026' },
    { node: 5, title: 'Canvas PDF Certificate Generator', status: 'UPCOMING', date: 'Next Step' },
    { node: 6, title: 'Enterprise Peer Mentoring Masterclass', status: 'LOCKED', date: 'Final Milestone' }
  ];

  // RPG Realms Definition
  realms: Record<'fullstack' | 'ai' | 'cloud', Realm> = {
    fullstack: {
      id: 'fullstack',
      name: 'Full-Stack Arcane Citadel',
      icon: '🏰',
      tagline: 'Master the harmony of Spring Boot 3 & Angular 17 Reactive Architecture',
      accentColor: '#1A5276',
      secondaryColor: '#D4AF37',
      heroRank: 'Full-Stack Archmage',
      nodes: [
        {
          id: 101,
          nodeIndex: 1,
          title: 'Java 21 Concurrency & Virtual Threads',
          subtitle: 'Novice Foothills • Thread Pooling',
          zone: 'Novice Foothills',
          icon: '☕',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '☕ Java 21 Pioneer',
          lore: 'The realm of synchronous threads was plagued by bottlenecks. You mastered Java 21 Project Loom virtual threads to achieve near-infinite throughput.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 10,
          mapY: 72,
          objectives: [
            { title: 'Explore Loom Virtual Thread Executors', done: true },
            { title: 'Benchmark 10,000 Concurrent HTTP Requests', done: true },
            { title: 'Write structured concurrency tasks', done: true }
          ]
        },
        {
          id: 102,
          nodeIndex: 2,
          title: 'Spring Boot 3 Security & BCrypt Cryptography',
          subtitle: 'Crypt of Credentials • JWT Tokens',
          zone: 'Crypt of Credentials',
          icon: '🛡️',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 300,
          badgeReward: '🛡️ Security Paladin',
          lore: 'The platform perimeter requires impenetrable shielding. Secure the gateway using stateless JWT filters and BCrypt salt hashing.',
          estimatedTime: '3 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: true,
          mapX: 25,
          mapY: 48,
          objectives: [
            { title: 'Implement JwtAuthFilter with Spring Security 6', done: true },
            { title: 'Configure BCryptPasswordEncoder (Strength 12)', done: true },
            { title: 'Add RBAC Role Guards (MENTOR / MENTEE / ADMIN)', done: true }
          ]
        },
        {
          id: 103,
          nodeIndex: 3,
          title: 'Treasure of the H2 Database Vault',
          subtitle: 'Relational Vault • JPA Schema Cache',
          zone: 'Relational Vault',
          icon: '🎁',
          type: 'CHEST',
          status: 'COMPLETED',
          xpReward: 150,
          badgeReward: '💎 Vault Master',
          lore: 'You uncovered the ancient relational cache! Persistent schema with zero-data-loss table initializers and file-backed storage.',
          estimatedTime: 'Instant Loot',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 38,
          mapY: 62,
          objectives: [
            { title: 'Open H2 Persistent Storage Cache', done: true, actionUrl: '/resources', actionLabel: 'View Database Schema' }
          ]
        },
        {
          id: 104,
          nodeIndex: 4,
          title: 'Live WebSockets & Collaborative Monaco IDE',
          subtitle: 'Citadel of Synchronization • WebRTC & Code Editor',
          zone: 'Citadel of Synchronization',
          icon: '⚡',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 450,
          badgeReward: '⚡ Real-Time Architect',
          lore: 'Scholars need real-time pairing! Connect Angular Signal state to Spring WebSocket broker for instant dual-cursor code editing.',
          estimatedTime: '4 Hours',
          difficulty: 'ADVANCED',
          claimed: false,
          mapX: 52,
          mapY: 34,
          objectives: [
            { title: 'Test Monaco Editor Live Syntax Execution', done: true, actionUrl: '/workspace', actionLabel: 'Open Workspace' },
            { title: 'Broadcast real-time code diffs via WebSocket endpoint', done: false, actionUrl: '/workspace', actionLabel: 'Test WebSockets' },
            { title: 'Achieve < 50ms peer-to-peer sync latency', done: false }
          ]
        },
        {
          id: 105,
          nodeIndex: 5,
          title: 'SMART Goals Kanban Matrix Mastery',
          subtitle: 'Tower of Milestones • Drag & Drop Cards',
          zone: 'Tower of Milestones',
          icon: '📋',
          type: 'QUEST',
          status: 'AVAILABLE',
          xpReward: 350,
          badgeReward: '🎯 Focus Master',
          lore: 'Chaos thrives without structured goals. Organize learning milestones into Specific, Measurable, Achievable, Relevant, and Time-bound stages.',
          estimatedTime: '2.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 68,
          mapY: 58,
          objectives: [
            { title: 'Create 3 active SMART learning goals', done: true, actionUrl: '/goals', actionLabel: 'View Kanban Board' },
            { title: 'Move 1 goal card to ACHIEVED status', done: false, actionUrl: '/goals', actionLabel: 'Complete Goal' },
            { title: 'Link goal milestone to certificate issuance', done: false }
          ]
        },
        {
          id: 106,
          nodeIndex: 6,
          title: 'Boss Encounter: Sovereign Architecture Capstone',
          subtitle: 'Archmage Pinnacle • Full Microservice Deployment',
          zone: 'Archmage Pinnacle',
          icon: '👑',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 800,
          badgeReward: '👑 Grand Full-Stack Sovereign',
          lore: 'The supreme trial of the Full-Stack Realm! Defeat architectural fragility by orchestrating microservices, reactive UI, and instant certificate verification.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 86,
          mapY: 26,
          objectives: [
            { title: 'Complete all previous 5 Quest Nodes', done: false },
            { title: 'Pass 100% automated integration test suite', done: false },
            { title: 'Issue verified QR PDF Certificate of Completion', done: false, actionUrl: '/certificates', actionLabel: 'Certificates' }
          ]
        }
      ]
    },
    ai: {
      id: 'ai',
      name: 'Neural & AI Archmage Realm',
      icon: '🧠',
      tagline: 'Forge intelligent RAG pipelines, LLM fine-tuning & Vector Embeddings',
      accentColor: '#8E44AD',
      secondaryColor: '#D4AF37',
      heroRank: 'Neural Archmage',
      nodes: [
        {
          id: 201,
          nodeIndex: 1,
          title: 'Prompt Engineering & Chatbot Gateway',
          subtitle: 'Valley of Prompts • Context Windows',
          zone: 'Valley of Prompts',
          icon: '💬',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '🤖 Prompt Sage',
          lore: 'Learn the ancient dialect of system prompts, few-shot conditioning, and temperature tuning for reliable mentor assistance.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 12,
          mapY: 70,
          objectives: [
            { title: 'Configure AI Chatbot Service in Spring Boot', done: true },
            { title: 'Test streaming response tokens in Angular UI', done: true }
          ]
        },
        {
          id: 202,
          nodeIndex: 2,
          title: 'Vector Embeddings & Semantic Search',
          subtitle: 'The Vector Abyss • Cosine Distance',
          zone: 'The Vector Abyss',
          icon: '📐',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 400,
          badgeReward: '🔍 Vector Seeker',
          lore: 'Transform raw textual documents into 1536-dimensional dense vectors to calculate mentor-mentee compatibility scores.',
          estimatedTime: '3.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 32,
          mapY: 46,
          objectives: [
            { title: 'Generate vector embeddings for mentor skill tags', done: true },
            { title: 'Compute cosine similarity matching matrix', done: false },
            { title: 'Render Match Score pills on Mentors list', done: false }
          ]
        },
        {
          id: 203,
          nodeIndex: 3,
          title: 'AI Cache Chest of Wisdom',
          subtitle: 'Knowledge Hoard • RAG Document Chunks',
          zone: 'Knowledge Hoard',
          icon: '🎁',
          type: 'CHEST',
          status: 'AVAILABLE',
          xpReward: 150,
          badgeReward: '📜 RAG Scholar',
          lore: 'Open the chest containing pre-indexed computer science papers and curated architectural guides.',
          estimatedTime: 'Instant Loot',
          difficulty: 'NOVICE',
          claimed: false,
          mapX: 50,
          mapY: 66,
          objectives: [
            { title: 'Claim RAG Architecture Resource Pack', done: false, actionUrl: '/resources', actionLabel: 'Explore Library' }
          ]
        },
        {
          id: 204,
          nodeIndex: 4,
          title: 'Retrieval-Augmented Generation (RAG) Citadel',
          subtitle: 'Chamber of Knowledge • Context Ingestion',
          zone: 'Chamber of Knowledge',
          icon: '📚',
          type: 'QUEST',
          status: 'AVAILABLE',
          xpReward: 500,
          badgeReward: '🧠 Neural Librarian',
          lore: 'Empower the AI mentor with grounding documents so it answers domain-specific student queries with zero hallucinations.',
          estimatedTime: '4.5 Hours',
          difficulty: 'ADVANCED',
          claimed: false,
          mapX: 68,
          mapY: 38,
          objectives: [
            { title: 'Chunk and index knowledge base articles', done: false },
            { title: 'Inject dynamic retrieval context into prompt pipeline', done: false }
          ]
        },
        {
          id: 205,
          nodeIndex: 5,
          title: 'Boss Encounter: Autonomous AI Mentor Agent',
          subtitle: 'Apex Neural Core • Multi-Agent Collaboration',
          zone: 'Apex Neural Core',
          icon: '🐉',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 850,
          badgeReward: '👑 Grand AI Overlord',
          lore: 'Summon an autonomous coding companion capable of analyzing ASTs, fixing bugs, and conducting live voice mentoring sessions.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 88,
          mapY: 22,
          objectives: [
            { title: 'Complete all previous Neural Nodes', done: false },
            { title: 'Deploy real-time audio/voice coaching loop', done: false }
          ]
        }
      ]
    },
    cloud: {
      id: 'cloud',
      name: 'Cloud & DevOps Sky Fortress',
      icon: '☁️',
      tagline: 'Orchestrate Docker containers, Kubernetes clusters & resilient CI/CD pipelines',
      accentColor: '#117A65',
      secondaryColor: '#D4AF37',
      heroRank: 'Cloud Commander',
      nodes: [
        {
          id: 301,
          nodeIndex: 1,
          title: 'Docker Containerization & Multi-Stage Builds',
          subtitle: 'Port of Containers • Alpine Images',
          zone: 'Port of Containers',
          icon: '🐳',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '🐳 Container Captain',
          lore: 'Package Spring Boot backend and Angular SSR frontend into slim, production-grade container images with multi-stage caching.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 12,
          mapY: 72,
          objectives: [
            { title: 'Write optimized Dockerfile for Spring Boot 3', done: true },
            { title: 'Build NGINX static asset container for Angular', done: true }
          ]
        },
        {
          id: 302,
          nodeIndex: 2,
          title: 'Kubernetes Pods, Services & Ingress Mesh',
          subtitle: 'Cluster Highground • Rolling Updates',
          zone: 'Cluster Highground',
          icon: '☸️',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 400,
          badgeReward: '☸️ K8s Pilot',
          lore: 'Deploy pods across worker nodes with self-healing replica sets and zero-downtime rolling update rollouts.',
          estimatedTime: '3.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 35,
          mapY: 50,
          objectives: [
            { title: 'Write Deployment.yaml and Service manifests', done: true },
            { title: 'Configure Horizontal Pod Autoscaler (HPA)', done: false },
            { title: 'Set up Ingress TLS termination', done: false }
          ]
        },
        {
          id: 303,
          nodeIndex: 3,
          title: 'DevOps Armor Loot Chest',
          subtitle: 'Supply Airship • CI/CD Scripts',
          zone: 'Supply Airship',
          icon: '🎁',
          type: 'CHEST',
          status: 'AVAILABLE',
          xpReward: 150,
          badgeReward: '⚙️ Pipeline Engineer',
          lore: 'Unlock automated GitHub Actions workflow templates for automated linting, testing, and Docker push.',
          estimatedTime: 'Instant Loot',
          difficulty: 'NOVICE',
          claimed: false,
          mapX: 55,
          mapY: 65,
          objectives: [
            { title: 'Open CI/CD Automation Toolkit', done: false, actionUrl: '/resources', actionLabel: 'View Tools' }
          ]
        },
        {
          id: 304,
          nodeIndex: 4,
          title: 'Boss Encounter: Zero-Downtime Global Cloud Cluster',
          subtitle: 'Sky Fortress Throne • High Availability',
          zone: 'Sky Fortress Throne',
          icon: '⚡',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 900,
          badgeReward: '👑 Grand Cloud Sovereign',
          lore: 'Architect a 99.999% SLA resilient cloud topology with multi-region disaster recovery and live telemetry monitors.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 85,
          mapY: 25,
          objectives: [
            { title: 'Pass full load testing simulation with 10k users', done: false },
            { title: 'Implement automated rollback on health probe failure', done: false }
          ]
        }
      ]
    }
  };

  constructor(
    private apiService: ApiService,
    private soundService: SoundService,
    private router: Router
  ) {}

  ngOnInit() {
    if (typeof localStorage !== 'undefined') {
      this.isSoundMuted = localStorage.getItem('mentorhub_sound_muted') === 'true';
    }
    this.loadUserData();
    this.checkDailyBountyStatus();
    this.updateAvatarPosition();
  }

  ngOnDestroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  toggleSoundMute() {
    this.isSoundMuted = !this.isSoundMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mentorhub_sound_muted', this.isSoundMuted ? 'true' : 'false');
    }
    if (!this.isSoundMuted) {
      this.soundService.playClick();
    }
  }

  setFilterMode(mode: 'ALL' | 'ACTIVE' | 'CHESTS') {
    this.playSafeSound('click');
    this.filterMode = mode;
  }

  getFilteredNodes(): QuestNode[] {
    const nodes = this.activeRealm.nodes;
    if (this.filterMode === 'ACTIVE') {
      return nodes.filter(n => n.status === 'ACTIVE_QUEST' || n.status === 'AVAILABLE');
    } else if (this.filterMode === 'CHESTS') {
      return nodes.filter(n => n.type === 'CHEST' || n.type === 'BOSS');
    }
    return nodes;
  }

  getCompletedObjectivesCount(node: QuestNode): number {
    if (!node || !node.objectives) return 0;
    return node.objectives.filter(o => o.done).length;
  }

  getObjectiveProgressPct(node: QuestNode): number {
    if (!node || !node.objectives || node.objectives.length === 0) return 100;
    const completed = this.getCompletedObjectivesCount(node);
    return Math.round((completed / node.objectives.length) * 100);
  }

  playSafeSound(type: 'click' | 'chest' | 'quest' | 'fanfare') {
    if (this.isSoundMuted) return;
    if (type === 'click') this.soundService.playClick();
    else if (type === 'chest') this.soundService.playChestOpenSound();
    else if (type === 'quest') this.soundService.playQuestCompleteSound();
    else if (type === 'fanfare') this.soundService.playFanfareSound();
  }

  loadUserData() {
    this.apiService.getCurrentUser().subscribe(user => {
      if (user) {
        this.user = user;
        this.currentXp = user.xpPoints || 2450;
        const streak = user.currentStreak || 14;
        
        // Calculate RPG hero stats
        this.heroLevel = Math.floor(this.currentXp / 500) + 1;
        this.nextLevelXp = this.heroLevel * 500;
        const currentLevelBase = (this.heroLevel - 1) * 500;
        const xpInCurrentLevel = this.currentXp - currentLevelBase;
        this.levelProgressPct = Math.min(100, Math.round((xpInCurrentLevel / 500) * 100));

        // Hero Class Title based on level
        if (this.heroLevel <= 1) this.heroClass = 'Novice Apprentice';
        else if (this.heroLevel === 2) this.heroClass = 'Code Knight';
        else if (this.heroLevel === 3) this.heroClass = 'Microservices Paladin';
        else if (this.heroLevel === 4) this.heroClass = 'Reactive Sorcerer';
        else if (this.heroLevel === 5) this.heroClass = 'Full-Stack Archmage';
        else this.heroClass = 'Grand System Oracle';

        // Streak Multiplier
        this.streakMultiplier = 1.0 + Math.min(0.5, streak * 0.05);

        this.updateAvatarPosition();
      }
    });
  }

  checkDailyBountyStatus() {
    if (typeof localStorage !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      const lastClaimed = localStorage.getItem('mentorhub_daily_bounty_date');
      this.dailyBountyClaimed = lastClaimed === today;
    }
  }

  get activeRealm(): Realm {
    return this.realms[this.activeRealmId];
  }

  get completedNodesCount(): number {
    return this.activeRealm.nodes.filter(n => n.status === 'COMPLETED').length;
  }

  get totalNodesCount(): number {
    return this.activeRealm.nodes.length;
  }

  get realmProgressPercentage(): number {
    return Math.round((this.completedNodesCount / this.totalNodesCount) * 100);
  }

  switchRealm(realmId: 'fullstack' | 'ai' | 'cloud') {
    this.playSafeSound('click');
    this.activeRealmId = realmId;
    this.selectedNode = null;
    this.updateAvatarPosition();
  }

  switchView(view: 'quest_map' | 'curricula_matrix') {
    this.playSafeSound('click');
    this.activeView = view;
  }

  updateAvatarPosition() {
    const activeNode = this.activeRealm.nodes.find(n => n.status === 'ACTIVE_QUEST') ||
                       this.activeRealm.nodes.find(n => n.status === 'AVAILABLE') ||
                       this.activeRealm.nodes[0];
    if (activeNode) {
      this.activeAvatarX = activeNode.mapX;
      this.activeAvatarY = activeNode.mapY;
    }
  }

  openNodeModal(node: QuestNode) {
    this.playSafeSound('click');
    this.selectedNode = node;
    this.isModalOpen = true;
  }

  closeModal() {
    this.playSafeSound('click');
    this.isModalOpen = false;
  }

  toggleObjective(obj: QuestObjective) {
    this.playSafeSound('click');
    obj.done = !obj.done;
  }

  navigateToObjective(url?: string) {
    if (url) {
      this.playSafeSound('click');
      this.closeModal();
      this.router.navigateByUrl(url);
    }
  }

  claimNodeReward(node: QuestNode) {
    if (node.claimed) return;

    // Play fanfare / quest completion audio
    if (node.type === 'CHEST') {
      this.playSafeSound('chest');
    } else if (node.type === 'BOSS') {
      this.playSafeSound('fanfare');
    } else {
      this.playSafeSound('quest');
    }

    const earnedXp = Math.round(node.xpReward * this.streakMultiplier);
    this.currentXp += earnedXp;
    node.claimed = true;
    node.status = 'COMPLETED';

    // Unlock next node if present
    const currentIndex = this.activeRealm.nodes.indexOf(node);
    if (currentIndex >= 0 && currentIndex + 1 < this.activeRealm.nodes.length) {
      const nextNode = this.activeRealm.nodes[currentIndex + 1];
      if (nextNode.status === 'LOCKED' || nextNode.status === 'AVAILABLE') {
        nextNode.status = 'ACTIVE_QUEST';
      }
    }

    // Update user stats in localStorage and service
    if (this.user) {
      this.user.xpPoints = this.currentXp;
      if (node.badgeReward) {
        this.user.badgesCount = (this.user.badgesCount || 0) + 1;
      }
      this.apiService.updateCurrentUser(this.user).subscribe();
    }

    // Trigger celebratory confetti and victory overlay
    this.celebrationTitle = node.type === 'BOSS' ? '👑 BOSS TRIAL DEFEATED!' : (node.type === 'CHEST' ? '🎁 LOOT UNLOCKED!' : '⚔️ QUEST ACCOMPLISHED!');
    this.celebrationSubtitle = `+${earnedXp} XP (${(this.streakMultiplier).toFixed(1)}x Streak Multiplier)`;
    this.celebrationBadge = node.badgeReward || '⭐ Mastered Milestone';
    this.isCelebrationActive = true;
    this.isModalOpen = false;

    this.triggerConfetti();

    setTimeout(() => {
      this.loadUserData();
    }, 100);
  }

  closeCelebration() {
    this.soundService.playClick();
    this.isCelebrationActive = false;
  }

  rollDailyBounty() {
    if (this.dailyBountyClaimed) return;

    this.soundService.playChestOpenSound();
    const bonusXp = 100 + Math.floor(Math.random() * 150); // 100 - 250 XP
    this.currentXp += bonusXp;
    this.dailyBountyClaimed = true;

    if (typeof localStorage !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('mentorhub_daily_bounty_date', today);
    }

    if (this.user) {
      this.user.xpPoints = this.currentXp;
      this.apiService.updateCurrentUser(this.user).subscribe();
    }

    this.celebrationTitle = '🎲 DAILY QUEST BOUNTY!';
    this.celebrationSubtitle = `+${bonusXp} Daily XP Claimed! Keep your streak burning!`;
    this.celebrationBadge = '🔥 Daily Devotee';
    this.isCelebrationActive = true;
    this.triggerConfetti();
  }

  // Procedural SVG Path Generator for Map Connections
  generateMapSvgPath(): string {
    const nodes = this.activeRealm.nodes;
    if (!nodes || nodes.length < 2) return '';
    
    // Convert percentage to viewBox coordinates (viewBox: 0 0 1000 500)
    const points = nodes.map(n => ({
      x: (n.mapX / 100) * 1000,
      y: (n.mapY / 100) * 500
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      // Smooth cubic bezier curve between quest nodes
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  // Particle Confetti Engine
  triggerConfetti() {
    setTimeout(() => {
      if (!this.confettiCanvasRef) return;
      const canvas = this.confettiCanvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#D4AF37', '#1A5276', '#117A65', '#C0392B', '#E67E22', '#8E44AD', '#FFFFFF'];
      this.particles = [];

      for (let i = 0; i < 150; i++) {
        this.particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 200,
          y: canvas.height / 2 + (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 1.2) * 14,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.35,
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.008
        });
      }

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeCount = 0;

        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.rotation += p.rotSpeed;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            activeCount++;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
          }
        }

        if (activeCount > 0) {
          this.animFrameId = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };

      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this.animFrameId = requestAnimationFrame(animate);
    }, 50);
  }
}
