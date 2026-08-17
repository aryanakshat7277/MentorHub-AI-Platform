import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

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
    { letter: 'S', name: 'Specific', color: '#EF4444', icon: '🎯' },
    { letter: 'M', name: 'Measurable', color: '#3B82F6', icon: '🖥️' },
    { letter: 'A', name: 'Achievable', color: '#10B981', icon: '🚀' },
    { letter: 'R', name: 'Relevant', color: '#A855F7', icon: '💡' },
    { letter: 'T', name: 'Time-bound', color: '#F59E0B', icon: '⏱️' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.apiService.getGoals(1).subscribe(data => {
      this.goals = data;
      this.calculateOverallProgress();
    });
  }

  calculateOverallProgress() {
    if (this.goals.length === 0) {
      this.overallProgress = 65;
      return;
    }
    const sum = this.goals.reduce((acc, g) => acc + (g.progressPercentage || 0), 0);
    this.overallProgress = Math.round(sum / this.goals.length);
  }

  getGoalsByStatus(status: string) {
    return this.goals.filter(g => g.status === status);
  }

  createGoal() {
    this.apiService.createGoal(this.newGoal).subscribe(() => {
      this.showCreateModal = false;
      this.loadGoals();
    });
  }

  updateGoalStatus(goal: any, newStatus: string) {
    goal.status = newStatus;
    if (newStatus === 'ACHIEVED') {
      goal.progressPercentage = 100;
    }
    this.apiService.updateGoal(goal.id, goal).subscribe(() => {
      this.loadGoals();
    });
  }
}
