import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AgentAction {
  id: string;
  type: 'NAVIGATE_URL' | 'SEARCH_WEB' | 'OPEN_APP' | 'OPEN_FILE' | 'CREATE_FILE' | 'RUN_COMMAND' | 'READ_WEB';
  target: string;
  params?: Record<string, any>;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: string;
}

export interface ActionPlan {
  planId: string;
  userPrompt: string;
  taskSummary: string;
  requiresPermission: boolean;
  riskLevel: 'LOW' | 'NORMAL' | 'ELEVATED';
  assignedModel: string;
  assignedModelTier: number;
  modelRole: string;
  permissionPrompt: string;
  actions: AgentAction[];
  naturalResponse?: string;
}

export interface ExecutionResult {
  planId: string;
  success: boolean;
  executingModel: string;
  executingModelTier: number;
  executingModelRole: string;
  executedActions: AgentAction[];
  completionMessage: string;
  spokenSummary: string;
}

export interface PrioritizedModel {
  priority: number;
  name: string;
  agentCapability: string;
  toolCalling: string;
  speed: string;
  coding: string;
  multistepExecution: string;
  bestRole: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SystemAgentService {
  private apiUrl = 'http://localhost:8080/api/agent';

  constructor(private http: HttpClient) {}

  getPrioritizedModels(): Observable<PrioritizedModel[]> {
    return this.http.get<PrioritizedModel[]>(`${this.apiUrl}/models`);
  }

  planTask(prompt: string, screenContext?: string): Observable<ActionPlan> {
    return this.http.post<ActionPlan>(`${this.apiUrl}/plan`, {
      prompt,
      screenContext: screenContext || ''
    });
  }

  executePlan(planId: string, actions: AgentAction[], authorized: boolean): Observable<ExecutionResult> {
    return this.http.post<ExecutionResult>(`${this.apiUrl}/execute`, {
      planId,
      authorized,
      actions
    });
  }

  isControlIntent(prompt: string): boolean {
    if (!prompt || typeof prompt !== 'string') return false;
    const p = prompt.toLowerCase().trim();
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('www.')) return true;
    if (/\b(open|launch|start|run|execute|bring up|show|switch to|navigate to|go to|search for|google search|open website)\b/i.test(p)) return true;
    if (/\b(youtube|github|stackoverflow|wikipedia|google|reddit)\b/i.test(p) && /\b(open|go to|browse|launch|visit)\b/i.test(p)) return true;
    if (/\b(open|launch|start|run)\b.*\b(calc|calculator|notepad|explorer|terminal|cmd|powershell|chrome|edge|vscode|vs code|code|visual studio|paint|task manager|taskmgr|settings|spotify|discord)\b/i.test(p)) return true;
    if (/\b(calc|calculator|notepad|explorer|cmd|powershell|vscode|vs code|code)\b/i.test(p) && /\b(open|launch|start|run)\b/i.test(p)) return true;
    if (/\b(experiment|test|script|workspace)\b/i.test(p) && /\b(vs code|vscode|code|launch|open|perform|run)\b/i.test(p)) return true;
    if (/\b(run command|execute command|run shell|run powershell|list files|check files|open folder|open directory|create file|write file)\b/i.test(p)) return true;
    if (/\b(take control|operate my system|control my system|system control|operate system|system navigation|take over)\b/i.test(p)) return true;
    return false;
  }
}
