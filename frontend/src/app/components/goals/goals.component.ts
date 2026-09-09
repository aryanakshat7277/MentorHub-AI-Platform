import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { SoundService } from '../../services/sound.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  goals: any[] = [];
  overallProgress = 65;
  showCreateModal = false;
  selectedCategory = 'ALL';
  searchQuery = '';
  celebrationToast: { title: string; message: string; xp: number } | null = null;
  toastTimer: any = null;

  newGoal = {
    title: '',
    description: '',
    category: 'S',
    categoryName: 'Specific',
    progressPercentage: 0,
    targetDate: '2026-09-30',
    status: 'TO_DO'
  };

  smartBlocks = [
    { letter: 'S', name: 'Specific', color: '#DE7048', icon: '🎯', desc: 'Concrete engineering target' },
    { letter: 'M', name: 'Measurable', color: '#2563EB', icon: '📊', desc: 'Quantifiable outcome metrics' },
    { letter: 'A', name: 'Achievable', color: '#2A5A3D', icon: '🚀', desc: 'Realistic capability stretch' },
    { letter: 'R', name: 'Relevant', color: '#B35E17', icon: '💡', desc: 'Aligned with engineering track' },
    { letter: 'T', name: 'Time-bound', color: '#D4AF37', icon: '⏱️', desc: 'Target deadline bound' }
  ];

  constructor(
    private apiService: ApiService,
    private soundService: SoundService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    const userId = Number(localStorage.getItem('userId') || '1');
    this.apiService.getGoals(userId).subscribe({
      next: (data) => {
        this.goals = data || [];
        this.calculateOverallProgress();
      },
      error: () => {
        this.calculateOverallProgress();
      }
    });
  }

  calculateOverallProgress() {
    if (!this.goals || this.goals.length === 0) {
      this.overallProgress = 65;
      return;
    }
    const sum = this.goals.reduce((acc, g) => acc + (g.progressPercentage || 0), 0);
    this.overallProgress = Math.round(sum / this.goals.length);
  }

  get filteredGoals() {
    return this.goals.filter(g => {
      const matchCat = this.selectedCategory === 'ALL' || (g.category && g.category.toUpperCase() === this.selectedCategory);
      const matchSearch = !this.searchQuery || 
        (g.title && g.title.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (g.description && g.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }

  getGoalsByStatus(status: string) {
    return this.filteredGoals.filter(g => g.status === status);
  }

  setCategoryFilter(cat: string) {
    this.soundService.playClickSound();
    this.selectedCategory = cat;
  }

  createGoal() {
    const matchedBlock = this.smartBlocks.find(b => b.letter === this.newGoal.category);
    if (matchedBlock) {
      this.newGoal.categoryName = matchedBlock.name;
    }

    const userId = Number(localStorage.getItem('userId') || '1');
    const goalPayload = { ...this.newGoal, userId };

    this.apiService.createGoal(goalPayload).subscribe({
      next: () => {
        this.soundService.playSuccessSound();
        this.showCreateModal = false;
        this.triggerToast('SMART Goal Created!', `Added "${this.newGoal.title}" to matrix`, 15);
        this.newGoal = {
          title: '',
          description: '',
          category: 'S',
          categoryName: 'Specific',
          progressPercentage: 0,
          targetDate: '2026-09-30',
          status: 'TO_DO'
        };
        this.loadGoals();
      },
      error: () => {
        this.showCreateModal = false;
        this.loadGoals();
      }
    });
  }

  advanceGoal(goal: any) {
    if (goal.status === 'TO_DO') {
      this.updateGoalStatus(goal, 'IN_PROGRESS', 50);
    } else if (goal.status === 'IN_PROGRESS') {
      this.updateGoalStatus(goal, 'ACHIEVED', 100);
    }
  }

  updateGoalStatus(goal: any, newStatus: string, pct?: number) {
    goal.status = newStatus;
    if (pct !== undefined) {
      goal.progressPercentage = pct;
    } else if (newStatus === 'ACHIEVED') {
      goal.progressPercentage = 100;
    } else if (newStatus === 'IN_PROGRESS' && goal.progressPercentage === 0) {
      goal.progressPercentage = 50;
    }

    if (newStatus === 'ACHIEVED') {
      this.soundService.playFanfareSound();
      this.triggerToast('Milestone Achieved! 🏆', `Mastered "${goal.title}"`, 50);
    } else {
      this.soundService.playSuccessSound();
    }

    this.apiService.updateGoal(goal.id, goal).subscribe({
      next: () => {
        this.loadGoals();
      },
      error: () => {
        this.loadGoals();
      }
    });
  }

  deleteGoal(goalId: number, e: Event) {
    e.stopPropagation();
    this.soundService.playClickSound();
    if (confirm('Are you sure you want to delete this SMART milestone?')) {
      this.apiService.deleteGoal(goalId).subscribe({
        next: () => {
          this.triggerToast('Goal Removed', 'Milestone removed from tracking matrix', 0);
          this.loadGoals();
        }
      });
    }
  }

  triggerToast(title: string, message: string, xp: number) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.celebrationToast = { title, message, xp };
    this.toastTimer = setTimeout(() => {
      this.celebrationToast = null;
    }, 4500);
  }
}
