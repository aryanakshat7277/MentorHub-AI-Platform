import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  provider?: string;
  model?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private baseUrl = 'http://localhost:8080/api/v1/ai/chat';

  constructor(private http: HttpClient) {}

  sendMessage(
    message: string,
    provider: string,
    model: string,
    systemPrompt?: string,
    language?: string,
    history?: { role: string; content: string }[]
  ): Observable<any> {
    const payload = { message, provider, model, systemPrompt, language, history };
    return this.http.post(`${this.baseUrl}/send`, payload).pipe(
      catchError((err) => {
        console.warn('Backend API unreachable:', err);
        return of({
          response: 'I\'m unable to reach the AI server right now. Please ensure the backend is running on port 8080 and try again.',
          provider: 'OFFLINE',
          model: 'none',
          timestamp: new Date().toISOString()
        });
      })
    );
  }

  streamMessage(
    message: string,
    provider: string,
    model: string,
    systemPrompt?: string,
    language?: string,
    history?: { role: string; content: string }[]
  ): Observable<any> {
    return new Observable((observer) => {
      const payload = { message, provider, model, systemPrompt, language, history };
      const controller = new AbortController();

      fetch(`${this.baseUrl}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).then(async response => {
        if (!response.body) throw new Error('No readable stream');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const dataStr = line.replace('data:', '').trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                observer.next(parsed);
              } catch (e) {
                // Ignore incomplete JSON chunks or simple text messages
                if (dataStr.startsWith('Error')) {
                    observer.next({ text: dataStr });
                }
              }
            }
          }
        }
        observer.complete();
      }).catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Backend API unreachable for stream:', err);
          observer.next({
            text: 'I\'m unable to reach the AI server right now. Please ensure the backend is running on port 8080 and try again.',
            provider: 'OFFLINE',
            model: 'none'
          });
          observer.complete();
        }
      });

      return () => controller.abort();
    });
  }

  getProvidersAndModels(): Observable<any> {
    return this.http.get(`${this.baseUrl}/providers`).pipe(
      catchError(() => of({
        GEMINI: ['gemini-2.0-flash', 'gemini-3.6-flash'],
        GROQ: ['llama-3.1-8b-instant', 'whisper-large-v3-turbo'],
        DEEPSEEK: ['deepseek-chat']
      }))
    );
  }
}
