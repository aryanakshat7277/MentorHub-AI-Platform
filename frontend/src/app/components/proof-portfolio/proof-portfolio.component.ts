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
  username: string = 'pavani';
  portfolio: any = null;
  isLoading: boolean = true;
  isCopied: boolean = false;
  activeTab: 'all' | 'quests' | 'goals' | 'endorsements' = 'all';
  showVerificationModal: boolean = false;

  profiles = [
    { username: 'pavani', label: 'Pavani (Scholar)' },
    { username: 'akshat', label: 'Akshat Aryan (Lead Mentor)' },
    { username: 'kriti-sagar', label: 'Kriti Sagar (Mentee)' },
    { username: 'vanaja', label: 'Vanaja (AI Engineer)' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.username = params['username'] || 'pavani';
      this.loadPortfolio();
    });
  }

  loadPortfolio(): void {
    this.isLoading = true;
    this.apiService.getPublicPortfolio(this.username).subscribe({
      next: (data) => {
        this.portfolio = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  switchProfile(userSlug: string): void {
    this.soundService.playClickSound();
    this.router.navigate(['/portfolio', userSlug]);
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
    const fullUrl = window.location.href;
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
