import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface TutorSessionRequest {
  courseCode: string;
  courseTitle: string;
  faculty?: string;
  moduleNumber: number;
  moduleTitle: string;
  topics: string;
  practicalLabWork?: string;
  vivaQuestions?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiTutorService {
  private tutorRequestSubject = new Subject<TutorSessionRequest>();
  public tutorRequest$ = this.tutorRequestSubject.asObservable();

  private isChatbotOpenSubject = new BehaviorSubject<boolean>(false);
  public isChatbotOpen$ = this.isChatbotOpenSubject.asObservable();

  /**
   * Programmatically opens the AI assistant drawer and seeds it with an official
   * Centurion University course module tutoring session.
   */
  launchTutorSession(request: TutorSessionRequest): void {
    this.openChatbot();
    // Allow animation frame / drawer mount before broadcasting request
    setTimeout(() => {
      this.tutorRequestSubject.next(request);
    }, 150);
  }

  openChatbot(): void {
    this.isChatbotOpenSubject.next(true);
  }

  closeChatbot(): void {
    this.isChatbotOpenSubject.next(false);
  }

  toggleChatbot(): void {
    this.isChatbotOpenSubject.next(!this.isChatbotOpenSubject.value);
  }

  get isChatbotOpen(): boolean {
    return this.isChatbotOpenSubject.value;
  }
}
