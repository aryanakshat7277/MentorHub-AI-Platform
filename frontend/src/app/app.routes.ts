import { Routes } from '@angular/router';
import { RoleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'admin-dashboard', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [RoleGuard(['ADMIN'])]
  },
  { 
    path: 'workspace', 
    loadComponent: () => import('./components/workspace/workspace.component').then(m => m.WorkspaceComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'mentor-matching', 
    loadComponent: () => import('./components/mentor-matching/mentor-matching.component').then(m => m.MentorMatchingComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'sessions', 
    loadComponent: () => import('./components/sessions/sessions.component').then(m => m.SessionsComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'goals', 
    loadComponent: () => import('./components/goals/goals.component').then(m => m.GoalsComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'learning-path', 
    loadComponent: () => import('./components/learning-path/learning-path.component').then(m => m.LearningPathComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'certificates', 
    loadComponent: () => import('./components/certificates/certificates.component').then(m => m.CertificatesComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'resource-hub', 
    loadComponent: () => import('./components/resource-hub/resource-hub.component').then(m => m.ResourceHubComponent) 
  },
  { 
    path: 'gamification', 
    loadComponent: () => import('./components/gamification/gamification.component').then(m => m.GamificationComponent) 
  },
  { 
    path: 'analytics', 
    loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent) 
  },
  { 
    path: 'verify-certificate/:id', 
    loadComponent: () => import('./components/verify-certificate/verify-certificate.component').then(m => m.VerifyCertificateComponent) 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) 
  },
  { 
    path: 'portfolio/:username', 
    loadComponent: () => import('./components/proof-portfolio/proof-portfolio.component').then(m => m.ProofPortfolioComponent) 
  },
  { 
    path: 'mock-viva', 
    loadComponent: () => import('./components/mock-viva/mock-viva.component').then(m => m.MockVivaComponent),
    canActivate: [RoleGuard(['MENTOR', 'MENTEE', 'ADMIN'])]
  },
  { 
    path: 'cutm-courses', 
    loadComponent: () => import('./components/cutm-courses/cutm-courses.component').then(m => m.CutmCoursesComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
