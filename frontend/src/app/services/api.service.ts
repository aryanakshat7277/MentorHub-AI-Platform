import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<any> {
    if (typeof localStorage !== 'undefined') {
      const userObjStr = localStorage.getItem('userObject');
      if (userObjStr) {
        try {
          const userObj = JSON.parse(userObjStr);
          const roleUpper = (userObj.role || localStorage.getItem('userRole') || '').toUpperCase();
          const isMentor = roleUpper === 'MENTOR' || (userObj.name || '').toUpperCase().includes('AKSHAT');
          const isAkshat = (userObj.name || '').toUpperCase().includes('AKSHAT') || (userObj.email || '').toLowerCase().includes('akshat');
          const isVanaja = (userObj.name || '').toUpperCase().includes('VANAJA') || (userObj.email || '').toLowerCase().includes('vanaja');
          const isPavani = (userObj.name || '').toUpperCase().includes('PAVANI') || (userObj.email || '').toLowerCase().includes('pavani');
          const isKriti = (userObj.name || '').toUpperCase().includes('KRITI') || (userObj.email || '').toLowerCase().includes('kriti');

          let finalAvatar = 'assets/mentorhub-logo.png';
          if (isAkshat) finalAvatar = 'assets/akshat-profile.jpg';
          else if (isVanaja) finalAvatar = 'assets/vanaja-profile.jpg';
          else if (isPavani) finalAvatar = 'assets/pavani-profile.jpg';
          else if (isKriti) finalAvatar = 'assets/kriti-profile.jpg';
          else if (localStorage.getItem('userAvatar')) finalAvatar = localStorage.getItem('userAvatar')!;
          else if (userObj.avatarUrl) finalAvatar = userObj.avatarUrl;

          return of({
            id: userObj.id || (isMentor ? 1 : 2),
            name: userObj.name || (isMentor ? 'AKSHAT ARYAN' : 'KRITI SAGAR'),
            email: userObj.email || (isMentor ? 'akshat@mentorhub.com' : 'kriti@mentorhub.com'),
            role: isMentor ? 'MENTOR' : 'MENTEE',
            title: isMentor ? 'Principal AI & Full Stack Mentor' : 'Junior AI Engineer & Full Stack Mentee',
            company: isMentor ? 'MetaLab Cybernetics' : 'Quantum Dynamics',
            bio: isMentor ? 'Guiding scholars KRITI SAGAR, VANAJA, & PAVANI in distributed microservices and reactive AI architectures.' : 'Learning Spring Boot 3, Microservices, Angular 17 Standalone Architecture under AKSHAT ARYAN.',
            skills: isMentor ? 'Java 21, Spring Boot 3, Angular 17, WebSockets, Python, C++' : 'Java 21, Spring Boot 3, Angular 17, WebSockets, H2/PostgreSQL Data Pipelines',
            xpPoints: isMentor ? 4890 : 2450,
            currentStreak: isMentor ? 32 : 14,
            rating: isMentor ? 5.0 : 4.9,
            hoursMentored: isMentor ? 142 : 28,
            totalSessions: isMentor ? 94 : 18,
            badgesCount: isMentor ? 16 : 8,
            avatarUrl: finalAvatar
          });
        } catch (e) {}
      }

      const storedName = localStorage.getItem('userName') || '';
      const storedRole = localStorage.getItem('userRole') || '';
      const isAkshat = storedName.toUpperCase().includes('AKSHAT');
      const isVanaja = storedName.toUpperCase().includes('VANAJA') || (localStorage.getItem('userEmail') || '').toLowerCase().includes('vanaja');
      const isPavani = storedName.toUpperCase().includes('PAVANI') || (localStorage.getItem('userEmail') || '').toLowerCase().includes('pavani');
      const isKriti = storedName.toUpperCase().includes('KRITI') || (localStorage.getItem('userEmail') || '').toLowerCase().includes('kriti');

      if (storedName) {
        const roleUpper = (storedRole || '').toUpperCase();
        const isMentor = roleUpper === 'MENTOR' || isAkshat;
        
        let finalAvatar = 'assets/mentorhub-logo.png';
        if (isAkshat) finalAvatar = 'assets/akshat-profile.jpg';
        else if (isVanaja) finalAvatar = 'assets/vanaja-profile.jpg';
        else if (isPavani) finalAvatar = 'assets/pavani-profile.jpg';
        else if (isKriti) finalAvatar = 'assets/kriti-profile.jpg';
        else if (localStorage.getItem('userAvatar')) finalAvatar = localStorage.getItem('userAvatar')!;

        return of({
          id: parseInt(localStorage.getItem('userId') || (isMentor ? '1' : '2')),
          name: storedName,
          email: localStorage.getItem('userEmail') || (isMentor ? 'akshat@mentorhub.com' : 'kriti@mentorhub.com'),
          role: isMentor ? 'MENTOR' : 'MENTEE',
          title: isMentor ? 'Principal AI & Full Stack Mentor' : 'Junior AI Engineer & Full Stack Mentee',
          company: isMentor ? 'MetaLab Cybernetics' : 'Quantum Dynamics',
          bio: isMentor ? 'Guiding scholars KRITI SAGAR, VANAJA, & PAVANI in reactive AI architectures.' : 'Learning Spring Boot 3, Microservices, Angular 17 Standalone Architecture under AKSHAT ARYAN.',
          skills: isMentor ? 'Java 21, Spring Boot 3, Angular 17, WebSockets, Python, C++' : 'Java 21, Spring Boot 3, Angular 17, WebSockets',
          xpPoints: isMentor ? 4890 : 2450,
          currentStreak: isMentor ? 32 : 14,
          rating: isMentor ? 5.0 : 4.9,
          hoursMentored: isMentor ? 142 : 28,
          totalSessions: isMentor ? 94 : 18,
          badgesCount: isMentor ? 16 : 8,
          avatarUrl: finalAvatar
        });
      }
    }

    return this.http.get(`${this.baseUrl}/auth/me`).pipe(
      catchError(() => of({
        id: 1,
        name: 'AKSHAT ARYAN',
        email: 'akshat@mentorhub.com',
        role: 'MENTOR',
        title: 'Principal AI & Full Stack Mentor',
        company: 'MetaLab Cybernetics',
        avatarUrl: 'assets/mentorhub-logo.png'
      }))
    );
  }

  updateCurrentUser(userData: any): Observable<any> {
    if (typeof localStorage !== 'undefined' && userData) {
      if (userData.name) localStorage.setItem('userName', userData.name);
      if (userData.role) localStorage.setItem('userRole', userData.role);
      if (userData.email) localStorage.setItem('userEmail', userData.email);
      if (userData.avatarUrl) localStorage.setItem('userAvatar', userData.avatarUrl);
    }
    return this.http.put(`${this.baseUrl}/auth/me`, userData).pipe(
      catchError(() => of(userData))
    );
  }

  getSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sessions`).pipe(
      catchError(() => of([
        { id: 1, topic: 'Spring Boot 3 WebSocket Handlers', mentor: 'AKSHAT ARYAN', mentee: 'KRITI SAGAR', date: '2026-08-15', status: 'CONFIRMED', time: '14:00' },
        { id: 2, topic: 'Angular 17 Signal State Management', mentor: 'AKSHAT ARYAN', mentee: 'VANAJA', date: '2026-08-16', status: 'CONFIRMED', time: '16:30' },
        { id: 3, topic: 'Distributed AI Vector Search', mentor: 'AKSHAT ARYAN', mentee: 'PAVANI', date: '2026-08-18', status: 'PENDING', time: '11:00' }
      ]))
    );
  }

  getSessionStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sessions/stats`).pipe(
      catchError(() => of({ total: 94, pending: 2, completed: 90, confirmed: 2 }))
    );
  }

  bookSession(session: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/sessions/book`, session);
  }

  updateSessionStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/sessions/${id}/status`, { status });
  }

  getMatchedMentors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mentors/match`).pipe(
      catchError(() => of([
        { id: 1, name: 'AKSHAT ARYAN', title: 'Principal AI & Full Stack Mentor', rating: 5.0, matchScore: 98, avatarUrl: 'assets/mentorhub-logo.png', company: 'MetaLab Cybernetics' }
      ]))
    );
  }

  getGoals(userId: number = 1): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/goals/${userId}`).pipe(
      catchError(() => of([
        { id: 1, title: 'Master Spring Boot 3 Security', mentee: 'KRITI SAGAR', progress: 85, status: 'IN_PROGRESS' },
        { id: 2, title: 'Build Reactive Angular 17 UI', mentee: 'VANAJA', progress: 70, status: 'IN_PROGRESS' },
        { id: 3, title: 'Deploy Distributed Microservices', mentee: 'PAVANI', progress: 90, status: 'COMPLETED' }
      ]))
    );
  }

  createGoal(goal: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/goals`, goal);
  }

  updateGoal(id: number, goal: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/goals/${id}`, goal);
  }

  getLeaderboard(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/gamification/leaderboard`).pipe(
      catchError(() => of([
        { rank: 1, name: 'AKSHAT ARYAN', role: 'MENTOR', xp: 4890, badge: '👑 Master Mentor' },
        { rank: 2, name: 'KRITI SAGAR', role: 'MENTEE', xp: 2450, badge: '⚡ High Scholar' },
        { rank: 3, name: 'PAVANI', role: 'MENTEE', xp: 2120, badge: '🌐 Cloud Pioneer' },
        { rank: 4, name: 'VANAJA', role: 'MENTEE', xp: 1980, badge: '🚀 Data Specialist' }
      ]))
    );
  }

  getBadges(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/gamification/badges`).pipe(
      catchError(() => of([]))
    );
  }

  getAnalytics(userId: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/${userId}`).pipe(
      catchError(() => of({}))
    );
  }

  getWorkspace(sessionId: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/workspace/${sessionId}`).pipe(
      catchError(() => of({
        sessionId,
        activeLanguage: 'javascript',
        sharedCode: 'console.log("Compiler is ready to use");\nconsole.log("Start working on your skills");',
        sharedNotes: '# Live Mentoring Session Notes\n- Mentor: AKSHAT ARYAN\n- Mentees: KRITI SAGAR, VANAJA, PAVANI'
      }))
    );
  }

  updateWorkspaceCode(sessionId: number, code: string, language: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/workspace/${sessionId}/code`, { code, language });
  }

  updateWorkspaceNotes(sessionId: number, notes: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/workspace/${sessionId}/notes`, { notes });
  }

  getMeetingInfo(sessionId: number = 1): Observable<any> {
    return this.http.post(`${this.baseUrl}/meetings/${sessionId}`, {}).pipe(
      catchError(() => of({
        sessionId,
        roomName: `mentorhub-session-${sessionId}-98a7b4c2`,
        meetingDomain: 'meet.jit.si',
        mentorName: 'AKSHAT ARYAN',
        menteeName: 'KRITI SAGAR',
        topic: 'Spring Boot 3 & Angular 17 Mentorship',
        status: 'ACTIVE'
      }))
    );
  }

  endMeeting(sessionId: number = 1): Observable<any> {
    return this.http.delete(`${this.baseUrl}/meetings/${sessionId}`).pipe(
      catchError(() => of({ sessionId, ended: true }))
    );
  }

  executePistonCompiler(language: string, code: string, version?: string): Observable<any> {
    const fileNameMap: Record<string, string> = {
      java: 'Main.java',
      python: 'main.py',
      cpp: 'main.cpp',
      c: 'main.c',
      typescript: 'index.ts',
      javascript: 'index.js'
    };

    const payload = {
      language: language.toLowerCase(),
      version: version || '',
      files: [
        {
          name: fileNameMap[language.toLowerCase()] || 'index.js',
          content: code
        }
      ]
    };

    return this.http.post(`${this.baseUrl}/compiler/execute`, payload).pipe(
      catchError(() => of({
        run: {
          stdout: `Compiler is ready to use\nStart working on your skills`,
          stderr: '',
          output: `Compiler is ready to use\nStart working on your skills`
        }
      }))
    );
  }

  runWorkspaceCode(code: string, language: string): Observable<any> {
    return this.executePistonCompiler(language, code);
  }

  getResources(type?: string): Observable<any[]> {
    const url = type ? `${this.baseUrl}/resources?type=${type}` : `${this.baseUrl}/resources`;
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  uploadResource(resourceData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/resources/upload`, resourceData);
  }

  deleteResource(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/resources/${id}`);
  }

  toggleBookmark(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/resources/${id}/bookmark`, {});
  }

  getCertificates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/certificates`).pipe(
      catchError(() => of([]))
    );
  }

  requestCertificate(certData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/certificates/request`, certData);
  }

  approveCertificate(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/certificates/${id}/approve`, {});
  }

  rejectCertificate(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/certificates/${id}/reject`, {});
  }

  generateCertificate(certData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/certificates/generate`, certData);
  }

  verifyCertificate(certNo: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/certificates/verify/${certNo}`).pipe(
      catchError(() => of(null))
    );
  }
}
