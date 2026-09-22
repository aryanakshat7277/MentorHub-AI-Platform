import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiChatService } from './ai-chat.service';
import { GeminiLiveService } from './gemini-live.service';

export interface ModelRoutingConfig {
  textModel: string;
  nvidiaModel: string;
  liveModel: string;
  fallbackSttModel: string;
  fallbackTtsModel: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiModelRouterService {
  public readonly config: ModelRoutingConfig = {
    textModel: 'gemini-3.6-flash',
    nvidiaModel: 'nvidia/nemotron-3-super-120b-a12b',
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

  public sendTextMessage(
    message: string,
    history?: { role: string; content: string }[],
    screenImage?: string,
    screenContext?: string,
    provider: string = 'GEMINI',
    model?: string
  ): Observable<any> {
    const chosenModel = model || (provider === 'NVIDIA' ? this.config.nvidiaModel : this.config.textModel);
    return this.chatService.sendMessage(
      message,
      provider,
      chosenModel,
      undefined,
      'en-US',
      history,
      screenImage,
      screenContext
    );
  }

  public streamTextMessage(
    message: string,
    history?: { role: string; content: string }[],
    screenImage?: string,
    screenContext?: string,
    provider: string = 'GEMINI',
    model?: string
  ): Observable<any> {
    const chosenModel = model || (provider === 'NVIDIA' ? this.config.nvidiaModel : this.config.textModel);
    return this.chatService.streamMessage(
      message,
      provider,
      chosenModel,
      undefined,
      'en-US',
      history,
      screenImage,
      screenContext
    );
  }

  public sendNvidiaMessage(
    message: string,
    history?: { role: string; content: string }[],
    screenImage?: string,
    screenContext?: string
  ): Observable<any> {
    return this.sendTextMessage(message, history, screenImage, screenContext, 'NVIDIA', this.config.nvidiaModel);
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
