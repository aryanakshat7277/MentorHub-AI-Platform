import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface RuntimeInfo {
  language: string;
  version: string;
  aliases: string[];
}

export interface CodeExecutionRequest {
  language: string;
  version?: string;
  code: string;
  stdin?: string;
}

export interface CodeExecutionResponse {
  success: boolean;
  status: string; // SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, RATE_LIMIT_EXCEEDED, NETWORK_ERROR, SERVICE_UNAVAILABLE
  language: string;
  version: string;
  stdout: string;
  stderr: string;
  compileOutput?: string;
  exitCode: number;
  executionTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CompilerService {
  private baseUrl = 'http://localhost:8080/api/v1/compiler';

  constructor(private http: HttpClient) {}

  getRuntimes(): Observable<RuntimeInfo[]> {
    return this.http.get<RuntimeInfo[]>(`${this.baseUrl}/runtimes`).pipe(
      catchError(() => of([
        { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
        { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
        { language: 'typescript', version: '5.0.3', aliases: ['ts'] },
        { language: 'java', version: '17.0.0', aliases: ['java'] },
        { language: 'cpp', version: '10.2.0', aliases: ['c++', 'cpp'] },
        { language: 'csharp', version: '6.12.0', aliases: ['cs'] },
        { language: 'go', version: '1.16.2', aliases: ['golang'] },
        { language: 'rust', version: '1.68.2', aliases: ['rs'] }
      ]))
    );
  }

  executeCode(req: CodeExecutionRequest): Observable<CodeExecutionResponse> {
    return this.http.post<CodeExecutionResponse>(`${this.baseUrl}/execute`, req).pipe(
      catchError((err) => {
        const errorMsg = err.error?.stderr || err.error?.message || err.message || 'Execution request failed.';
        return of({
          success: false,
          status: err.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'NETWORK_ERROR',
          language: req.language,
          version: req.version || '*',
          stdout: '',
          stderr: errorMsg,
          compileOutput: '',
          exitCode: 1
        });
      })
    );
  }

  checkHealth(): Observable<{ available: boolean; service: string }> {
    return this.http.get<{ available: boolean; service: string }>(`${this.baseUrl}/health`).pipe(
      catchError(() => of({ available: false, service: 'piston' }))
    );
  }

  completeCode(req: { language: string; code: string; prefix?: string; suffix?: string }): Observable<{
    success: boolean;
    completion: string;
    provider: string;
    model: string;
    latencyMs: number;
  }> {
    return this.http.post<any>(`${this.baseUrl}/autocomplete`, req).pipe(
      catchError(() => of({
        success: false,
        completion: '',
        provider: 'NONE',
        model: 'none',
        latencyMs: 0
      }))
    );
  }

  autoFixCode(req: { language: string; code: string; error: string; status?: string }): Observable<{
    success: boolean;
    explanation: string;
    fixSummary: string;
    fixedCode: string;
    errorSnippet: string;
    fixedSnippet: string;
    diffLines: number[];
    provider: string;
    model: string;
    latencyMs: number;
  }> {
    return this.http.post<any>(`${this.baseUrl}/autofix`, req).pipe(
      catchError((err) => of({
        success: false,
        explanation: 'AI diagnosis failed to reach server: ' + (err.message || 'Network error'),
        fixSummary: 'Unable to auto-apply fix.',
        fixedCode: req.code,
        errorSnippet: '',
        fixedSnippet: '',
        diffLines: [],
        provider: 'NONE',
        model: 'none',
        latencyMs: 0
      }))
    );
  }
}
