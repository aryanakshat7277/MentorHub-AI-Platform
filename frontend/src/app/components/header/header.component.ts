import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() isCollapsed = false;
  user: any = null;
  showDropdown = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.apiService.getCurrentUser().subscribe(data => {
      this.user = data;
      const isAkshat = (data?.name || '').toUpperCase().includes('AKSHAT');
      const isVanaja = (data?.name || '').toUpperCase().includes('VANAJA') || (data?.email || '').toLowerCase().includes('vanaja');
      const isPavani = (data?.name || '').toUpperCase().includes('PAVANI') || (data?.email || '').toLowerCase().includes('pavani');
      const isKriti = (data?.name || '').toUpperCase().includes('KRITI') || (data?.email || '').toLowerCase().includes('kriti');

      if (isAkshat) {
        this.user.avatarUrl = 'assets/akshat-profile.jpg';
      } else if (isVanaja) {
        this.user.avatarUrl = 'assets/vanaja-profile.jpg';
      } else if (isPavani) {
        this.user.avatarUrl = 'assets/pavani-profile.jpg';
      } else if (isKriti) {
        this.user.avatarUrl = 'assets/kriti-profile.jpg';
      } else if (typeof localStorage !== 'undefined') {
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
          this.user.avatarUrl = savedAvatar;
        }
      }
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showDropdown = false;
  }

  logout() {
    this.authService.logout();
    this.showDropdown = false;
    this.router.navigate(['/login']);
  }
}
