import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  public messages$: Observable<any> = this.messageSubject.asObservable();
  public isConnected = false;

  connect(url: string = 'ws://localhost:8080/ws-workspace'): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[WebSocket] Connected to MentorHub Workspace WebSocket');
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (e) {
          this.messageSubject.next({ type: 'RAW', content: event.data });
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('[WebSocket] Connection closed');
      };

      this.socket.onerror = (error) => {
        this.isConnected = false;
        console.warn('[WebSocket] Connection error:', error);
      };
    } catch (e) {
      console.warn('[WebSocket] Handshake exception:', e);
    }
  }

  sendMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
