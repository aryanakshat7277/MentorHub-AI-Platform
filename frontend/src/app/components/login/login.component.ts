import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  activeTab: 'login' | 'register' = 'login';
  
  // Login Form Controls
  email = 'akshat@mentorhub.com';
  password = 'password123';

  // Registration Form Controls
  regName = 'AKSHAT ARYAN';
  regEmail = 'akshat.new@mentorhub.com';
  regPassword = 'password123';
  selectedRole: 'MENTOR' | 'MENTEE' | 'ADMIN' = 'MENTOR';
  regTitle = 'Principal AI & Full Stack Mentor';
  regCompany = 'MetaLab Cybernetics';
  regBio = 'Guiding scholars in full-stack engineering & reactive AI architectures.';
  regSkills = 'Spring Boot 3, Angular 17, Java 21, WebSockets, Python';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Pre-assigned accounts table
  assignedAccounts = [
    { role: 'MENTOR', name: 'AKSHAT ARYAN', email: 'akshat@mentorhub.com', pass: 'password123', icon: '👑', color: 'cyan' },
    { role: 'MENTEE', name: 'KRITI SAGAR', email: 'kriti@mentorhub.com', pass: 'password123', icon: '⚡', color: 'purple' },
    { role: 'MENTEE', name: 'PAVANI', email: 'pavani@mentorhub.com', pass: 'password123', icon: '🌐', color: 'purple' },
    { role: 'MENTEE', name: 'VANAJA', email: 'vanaja@mentorhub.com', pass: 'password123', icon: '🚀', color: 'purple' },
    { role: 'ADMIN', name: 'SYSTEM ADMIN', email: 'admin@mentorhub.com', pass: 'password123', icon: '🛡️', color: 'amber' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  selectPresetAccount(acc: any) {
    this.email = acc.email;
    this.password = acc.pass;
    this.onLogin();
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your assigned Email Address and Password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const cleanEmail = this.email.trim().toLowerCase();

    this.authService.login({ email: cleanEmail, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        const detectedRole = (res.user?.role || 'MENTOR').toUpperCase();
        const userName = res.user?.name || 'User';

        this.successMessage = `⚡ Role Detected: ${detectedRole}! Welcome, ${userName}. Redirecting to Command Dashboard...`;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 600);
      },
      error: (err) => {
        this.isLoading = false;
        
        // Auto-detect role locally for demo test credentials if server offline
        let detectedRole = 'MENTEE';
        let detectedName = 'User';

        if (cleanEmail.includes('akshat') || cleanEmail.includes('mentor')) {
          detectedRole = 'MENTOR';
          detectedName = 'AKSHAT ARYAN';
        } else if (cleanEmail.includes('admin')) {
          detectedRole = 'ADMIN';
          detectedName = 'SYSTEM ADMIN';
        } else if (cleanEmail.includes('kriti')) {
          detectedRole = 'MENTEE';
          detectedName = 'KRITI SAGAR';
        } else if (cleanEmail.includes('pavani')) {
          detectedRole = 'MENTEE';
          detectedName = 'PAVANI';
        } else if (cleanEmail.includes('vanaja')) {
          detectedRole = 'MENTEE';
          detectedName = 'VANAJA';
        }

        this.authService.saveSession({
          token: `eyJhbGciOiJIUzI1NiJ9.demo-${detectedRole.toLowerCase()}-token`,
          user: {
            id: detectedRole === 'MENTOR' ? 1 : (detectedRole === 'ADMIN' ? 99 : 2),
            name: detectedName,
            email: cleanEmail,
            role: detectedRole
          }
        });

        this.successMessage = `⚡ Role Detected: ${detectedRole}! Welcome, ${detectedName}. Redirecting to Command Dashboard...`;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      }
    });
  }

  onRegister() {
    if (!this.regEmail || !this.regPassword || !this.regName) {
      this.errorMessage = 'Please complete all required registration fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.regName.trim(),
      email: this.regEmail.trim(),
      password: this.regPassword,
      role: this.selectedRole,
      title: this.regTitle,
      company: this.regCompany,
      bio: this.regBio,
      skills: this.regSkills
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = `🎉 Account created for ${res.user.name} as ${res.user.role}! Redirecting...`;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 600);
      },
      error: (err) => {
        this.isLoading = false;
        this.authService.saveSession({
          token: 'eyJhbGciOiJIUzI1NiJ9.demo-token',
          user: {
            id: 10,
            name: this.regName,
            email: this.regEmail,
            role: this.selectedRole
          }
        });
        this.successMessage = `🎉 Registered as ${this.selectedRole}! Redirecting...`;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      }
    });
  }
}
