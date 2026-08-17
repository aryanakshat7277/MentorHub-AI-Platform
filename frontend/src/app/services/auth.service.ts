import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string; // MENTOR, MENTEE
    title?: string;
    company?: string;
    avatarUrl?: string;
  };
}

export interface LoginEvent {
  role: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/v1/auth';
  public loginSuccess$ = new Subject<LoginEvent>();

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/authenticate`, credentials).pipe(
      tap(res => this.saveSession(res))
    );
  }

  saveSession(res: AuthResponse) {
    if (typeof localStorage !== 'undefined' && res && res.token && res.user) {
      const isMentor = (res.user.role || '').toUpperCase() === 'MENTOR' || (res.user.name || '').toUpperCase().includes('AKSHAT');
      const roleStr = isMentor ? 'MENTOR' : 'MENTEE';

      const userNameUpper = (res.user.name || '').toUpperCase();
      const userEmailLower = (res.user.email || '').toLowerCase();
      let avatarUrl = res.user.avatarUrl || 'assets/mentorhub-logo.png';

      if (userNameUpper.includes('AKSHAT') || userEmailLower.includes('akshat')) {
        avatarUrl = 'assets/akshat-profile.jpg';
      } else if (userNameUpper.includes('VANAJA') || userEmailLower.includes('vanaja')) {
        avatarUrl = 'assets/vanaja-profile.jpg';
      } else if (userNameUpper.includes('PAVANI') || userEmailLower.includes('pavani')) {
        avatarUrl = 'assets/pavani-profile.jpg';
      } else if (userNameUpper.includes('KRITI') || userEmailLower.includes('kriti')) {
        avatarUrl = 'assets/kriti-profile.jpg';
      }

      localStorage.setItem('jwt_token', res.token);
      localStorage.setItem('userId', res.user.id ? res.user.id.toString() : (isMentor ? '1' : '2'));
      localStorage.setItem('userName', res.user.name || (isMentor ? 'AKSHAT ARYAN' : 'KRITI SAGAR'));
      localStorage.setItem('userRole', roleStr);
      localStorage.setItem('userEmail', res.user.email || (isMentor ? 'akshat@mentorhub.com' : 'kriti@mentorhub.com'));
      localStorage.setItem('userAvatar', avatarUrl);
      localStorage.setItem('userObject', JSON.stringify({
        ...res.user,
        role: roleStr,
        avatarUrl: avatarUrl
      }));
      this.loginSuccess$.next({ role: roleStr, name: res.user.name || '' });
    }
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('jwt_token');
    }
    return null;
  }

  getUserRole(): string {
    if (typeof localStorage !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName') || '';
      if (role) return role.toUpperCase();
      if (name.toUpperCase().includes('AKSHAT')) return 'MENTOR';
      return 'MENTEE';
    }
    return 'MENTOR';
  }

  getUserName(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userName') || 'AKSHAT ARYAN';
    }
    return 'AKSHAT ARYAN';
  }

  isLoggedIn(): boolean {
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem('jwt_token');
    }
    return true;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userObject');
    }
  }
}
