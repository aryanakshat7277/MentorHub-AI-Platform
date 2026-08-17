import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiChatService } from './ai-chat.service';
import { GeminiLiveService } from './gemini-live.service';

export interface ModelRoutingConfig {
  textModel: string;
  liveModel: string;
  fallbackSttModel: string;
  fallbackTtsModel: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiModelRouterService {
  public readonly config: ModelRoutingConfig = {
    textModel: 'gemini-3.1-flash',
    liveModel: 'gemini-3.1-flash-live-preview',
    fallbackSttModel: 'whisper-large-v3-turbo',
    fallbackTtsModel: 'canopylabs/orpheus-v1-english'
  };

  private baseUrl = 'http://localhost:8080/api/v1/ai';

  constructor(
    private http: HttpClient,
    private chatService: AiChatService,
    private liveService: GeminiLiveService
  ) {}

  public sendTextMessage(message: string, history?: { role: string; content: string }[]): Observable<any> {
    return this.chatService.sendMessage(
      message,
      'GEMINI',
      this.config.textModel,
      'You are MentorHub AI Copilot for AKSHAT ARYAN, KRITI SAGAR, VANAJA, & PAVANI.',
      'en-US',
      history
    );
  }

  public synthesizeGroqFallbackSpeech(text: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/voice/tts`, {
      text,
      model: this.config.fallbackTtsModel,
      voice: 'orpheus-en-standard'
    });
  }

  public transcribeGroqFallbackAudio(audioFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', audioFile);
    return this.http.post(`${this.baseUrl}/voice/stt`, formData);
  }
}
