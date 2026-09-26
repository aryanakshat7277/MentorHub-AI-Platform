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
      name: 'Full-Stack Systems Architecture',
      icon: '🏛️',
      tagline: 'Enterprise Java 21, Spring Boot 3, Angular 17 Reactive State & Microservices',
      accentColor: '#1A5276',
      secondaryColor: '#D4AF37',
      heroRank: 'Principal Systems Architect',
      nodes: [
        {
          id: 101,
          nodeIndex: 1,
          title: 'Java 21 Concurrency & Virtual Threads',
          subtitle: 'Project Loom • High-Throughput Executors',
          zone: 'STAGE 01 • CORE RUNTIME',
          icon: '☕',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '☕ Java 21 Specialist',
          lore: 'Master Java 21 Project Loom virtual threads and structured concurrency to handle tens of thousands of non-blocking I/O operations.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 11,
          mapY: 58,
          objectives: [
            { title: 'Explore Loom Virtual Thread Executors', done: true },
            { title: 'Benchmark 10,000 Concurrent HTTP Requests', done: true },
            { title: 'Write structured concurrency tasks', done: true }
          ]
        },
        {
          id: 102,
          nodeIndex: 2,
          title: 'Spring Security 6 & JWT Cryptography',
          subtitle: 'Stateless Auth Filters • RBAC Guards',
          zone: 'STAGE 02 • IAM & SECURITY',
          icon: '🛡️',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 300,
          badgeReward: '🛡️ Security Architect',
          lore: 'Architect zero-trust API gateways using stateless JWT bearer authentication, BCrypt password hashing, and role-based access control.',
          estimatedTime: '3 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: true,
          mapX: 26,
          mapY: 34,
          objectives: [
            { title: 'Implement JwtAuthFilter with Spring Security 6', done: true },
            { title: 'Configure BCryptPasswordEncoder (Strength 12)', done: true },
            { title: 'Add RBAC Role Guards (MENTOR / MENTEE / ADMIN)', done: true }
          ]
        },
        {
          id: 103,
          nodeIndex: 3,
          title: 'JPA Persistence & Relational Schema',
          subtitle: 'Hibernate ORM • Query Optimization',
          zone: 'STAGE 03 • DATA LAYER',
          icon: '🗄️',
          type: 'CHEST',
          status: 'COMPLETED',
          xpReward: 150,
          badgeReward: '💎 Data Engineer',
          lore: 'Design normalized relational schemas with Spring Data JPA, entity graphs, and high-performance connection pooling.',
          estimatedTime: '1.5 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 42,
          mapY: 58,
          objectives: [
            { title: 'Inspect Persistent Relational Schema & Indexes', done: true, actionUrl: '/resources', actionLabel: 'View Database Schema' }
          ]
        },
        {
          id: 104,
          nodeIndex: 4,
          title: 'Live WebSockets & Collaborative IDE',
          subtitle: 'STOMP Broker • WebRTC & Monaco Sync',
          zone: 'STAGE 04 • REAL-TIME SYNC',
          icon: '⚡',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 450,
          badgeReward: '⚡ Real-Time Architect',
          lore: 'Connect Angular 17 reactive state to Spring Boot STOMP WebSockets for sub-50ms bidirectional code synchronization and live mentoring.',
          estimatedTime: '4 Hours',
          difficulty: 'ADVANCED',
          claimed: false,
          mapX: 58,
          mapY: 30,
          objectives: [
            { title: 'Test Monaco Editor Live Syntax Execution', done: true, actionUrl: '/workspace', actionLabel: 'Open Workspace' },
            { title: 'Broadcast real-time code diffs via WebSocket endpoint', done: false, actionUrl: '/workspace', actionLabel: 'Test WebSockets' },
            { title: 'Achieve < 50ms peer-to-peer sync latency', done: false }
          ]
        },
        {
          id: 105,
          nodeIndex: 5,
          title: 'Agile Engineering & SMART Delivery',
          subtitle: 'Kanban Execution • OKR Telemetry',
          zone: 'STAGE 05 • AGILE DELIVERY',
          icon: '📋',
          type: 'QUEST',
          status: 'AVAILABLE',
          xpReward: 350,
          badgeReward: '🎯 Delivery Lead',
          lore: 'Structure engineering deliverables into Specific, Measurable, Achievable, Relevant, and Time-bound sprint milestones.',
          estimatedTime: '2.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 74,
          mapY: 56,
          objectives: [
            { title: 'Create 3 active SMART learning goals', done: true, actionUrl: '/goals', actionLabel: 'View Kanban Board' },
            { title: 'Move 1 goal card to ACHIEVED status', done: false, actionUrl: '/goals', actionLabel: 'Complete Goal' },
            { title: 'Link goal milestone to certificate issuance', done: false }
          ]
        },
        {
          id: 106,
          nodeIndex: 6,
          title: 'Enterprise Microservices Capstone',
          subtitle: 'Full System Deployment & Audit',
          zone: 'STAGE 06 • CAPSTONE DEFENSE',
          icon: '🎓',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 800,
          badgeReward: '👑 Distinguished Architect',
          lore: 'Complete the final architectural defense by orchestrating end-to-end services, automated integration suites, and cryptographic certification.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 89,
          mapY: 28,
          objectives: [
            { title: 'Complete all previous 5 Engineering Stages', done: false },
            { title: 'Pass 100% automated integration test suite', done: false },
            { title: 'Issue verified QR PDF Certificate of Completion', done: false, actionUrl: '/certificates', actionLabel: 'Certificates' }
          ]
        }
      ]
    },
    ai: {
      id: 'ai',
      name: 'AI & Neural Systems Engineering',
      icon: '🧠',
      tagline: 'Production RAG Pipelines, Multimodal LLMs & Vector Embeddings',
      accentColor: '#8E44AD',
      secondaryColor: '#D4AF37',
      heroRank: 'Principal AI Engineer',
      nodes: [
        {
          id: 201,
          nodeIndex: 1,
          title: 'Prompt Engineering & LLM Gateway',
          subtitle: 'System Conditioning • Context Windows',
          zone: 'STAGE 01 • LLM ORCHESTRATION',
          icon: '💬',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '🤖 Prompt Specialist',
          lore: 'Design deterministic system prompts, few-shot conditioning templates, and streaming token handlers.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 12,
          mapY: 58,
          objectives: [
            { title: 'Configure AI Chatbot Service in Spring Boot', done: true },
            { title: 'Test streaming response tokens in Angular UI', done: true }
          ]
        },
        {
          id: 202,
          nodeIndex: 2,
          title: 'Vector Embeddings & Semantic Search',
          subtitle: 'Dense Vectors • Cosine Similarity',
          zone: 'STAGE 02 • VECTOR EMBEDDINGS',
          icon: '📐',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 400,
          badgeReward: '🔍 Vector Architect',
          lore: 'Transform raw textual documents into high-dimensional vector embeddings to compute semantic compatibility.',
          estimatedTime: '3.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 32,
          mapY: 34,
          objectives: [
            { title: 'Generate vector embeddings for mentor skill tags', done: true },
            { title: 'Compute cosine similarity matching matrix', done: false },
            { title: 'Render Match Score pills on Mentors list', done: false }
          ]
        },
        {
          id: 203,
          nodeIndex: 3,
          title: 'Document Chunking & Corpus Indexing',
          subtitle: 'Semantic Splitting • Vector Store',
          zone: 'STAGE 03 • KNOWLEDGE INDEXING',
          icon: '🗂️',
          type: 'CHEST',
          status: 'AVAILABLE',
          xpReward: 150,
          badgeReward: '📜 Corpus Engineer',
          lore: 'Index technical whitepapers and curriculum specifications for low-latency semantic retrieval.',
          estimatedTime: '1.5 Hours',
          difficulty: 'NOVICE',
          claimed: false,
          mapX: 50,
          mapY: 58,
          objectives: [
            { title: 'Explore RAG Architecture Resource Pack', done: false, actionUrl: '/resources', actionLabel: 'Explore Library' }
          ]
        },
        {
          id: 204,
          nodeIndex: 4,
          title: 'Retrieval-Augmented Generation (RAG)',
          subtitle: 'Grounded Inference • Hallucination Guard',
          zone: 'STAGE 04 • PRODUCTION RAG',
          icon: '📚',
          type: 'QUEST',
          status: 'AVAILABLE',
          xpReward: 500,
          badgeReward: '🧠 RAG Specialist',
          lore: 'Ground LLM responses with real-time retrieved context chunks for verifiable academic accuracy.',
          estimatedTime: '4.5 Hours',
          difficulty: 'ADVANCED',
          claimed: false,
          mapX: 68,
          mapY: 34,
          objectives: [
            { title: 'Chunk and index knowledge base articles', done: false },
            { title: 'Inject dynamic retrieval context into prompt pipeline', done: false }
          ]
        },
        {
          id: 205,
          nodeIndex: 5,
          title: 'Autonomous Multimodal Voice Agent',
          subtitle: 'Gemini Live Bidi PCM • Real-Time Vision',
          zone: 'STAGE 05 • CAPSTONE DEFENSE',
          icon: '🎙️',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 850,
          badgeReward: '👑 Chief AI Architect',
          lore: 'Deploy an autonomous multimodal AI mentor capable of analyzing code ASTs, inspecting screens, and conversing in real time.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 88,
          mapY: 28,
          objectives: [
            { title: 'Complete all previous Neural Stages', done: false },
            { title: 'Deploy real-time audio/voice coaching loop', done: false }
          ]
        }
      ]
    },
    cloud: {
      id: 'cloud',
      name: 'Cloud-Native & DevOps Infrastructure',
      icon: '☁️',
      tagline: 'Docker Containers, Kubernetes Orchestration & Automated CI/CD Pipelines',
      accentColor: '#117A65',
      secondaryColor: '#D4AF37',
      heroRank: 'Principal Cloud Architect',
      nodes: [
        {
          id: 301,
          nodeIndex: 1,
          title: 'Docker Containerization & Multi-Stage Builds',
          subtitle: 'Alpine Runtime • Layer Caching',
          zone: 'STAGE 01 • CONTAINERIZATION',
          icon: '🐳',
          type: 'QUEST',
          status: 'COMPLETED',
          xpReward: 200,
          badgeReward: '🐳 Container Specialist',
          lore: 'Package Spring Boot backend and Angular frontend into hardened, minimal container images.',
          estimatedTime: '2 Hours',
          difficulty: 'NOVICE',
          claimed: true,
          mapX: 14,
          mapY: 58,
          objectives: [
            { title: 'Write optimized Dockerfile for Spring Boot 3', done: true },
            { title: 'Build NGINX static asset container for Angular', done: true }
          ]
        },
        {
          id: 302,
          nodeIndex: 2,
          title: 'Kubernetes Workloads & Service Mesh',
          subtitle: 'ReplicaSets • Ingress & Autoscaling',
          zone: 'STAGE 02 • KUBERNETES MESH',
          icon: '☸️',
          type: 'QUEST',
          status: 'ACTIVE_QUEST',
          xpReward: 400,
          badgeReward: '☸️ K8s Engineer',
          lore: 'Orchestrate self-healing pods across worker nodes with Horizontal Pod Autoscalers and zero-downtime rollouts.',
          estimatedTime: '3.5 Hours',
          difficulty: 'INTERMEDIATE',
          claimed: false,
          mapX: 38,
          mapY: 34,
          objectives: [
            { title: 'Write Deployment.yaml and Service manifests', done: true },
            { title: 'Configure Horizontal Pod Autoscaler (HPA)', done: false },
            { title: 'Set up Ingress TLS termination', done: false }
          ]
        },
        {
          id: 303,
          nodeIndex: 3,
          title: 'CI/CD Pipeline & Security Scanning',
          subtitle: 'GitHub Actions • Automated Quality Gates',
          zone: 'STAGE 03 • CI/CD AUTOMATION',
          icon: '⚙️',
          type: 'CHEST',
          status: 'AVAILABLE',
          xpReward: 150,
          badgeReward: '⚙️ Pipeline Engineer',
          lore: 'Automate build, unit testing, container vulnerability scanning, and registry deployment workflows.',
          estimatedTime: '1.5 Hours',
          difficulty: 'NOVICE',
          claimed: false,
          mapX: 62,
          mapY: 56,
          objectives: [
            { title: 'Open CI/CD Automation Toolkit', done: false, actionUrl: '/resources', actionLabel: 'View Tools' }
          ]
        },
        {
          id: 304,
          nodeIndex: 4,
          title: 'Multi-Region High-Availability Cluster',
          subtitle: '99.99% SLA • Disaster Recovery & Observability',
          zone: 'STAGE 04 • CAPSTONE DEFENSE',
          icon: '🌐',
          type: 'BOSS',
          status: 'LOCKED',
          xpReward: 900,
          badgeReward: '👑 Cloud Infrastructure Fellow',
          lore: 'Architect a fault-tolerant multi-region topology with Prometheus/Grafana telemetry and automated failover.',
          estimatedTime: '6 Hours',
          difficulty: 'LEGENDARY',
          claimed: false,
          mapX: 86,
          mapY: 28,
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

  isNodeMatchingFilter(node: QuestNode): boolean {
    if (this.filterMode === 'ALL') return true;
    if (this.filterMode === 'ACTIVE') {
      return node.status === 'ACTIVE_QUEST' || node.status === 'AVAILABLE';
    }
    if (this.filterMode === 'CHESTS') {
      return node.type === 'CHEST' || node.type === 'BOSS';
    }
    return true;
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
