import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { WebSocketService } from '../../services/websocket.service';
import { CompilerService, RuntimeInfo, CodeExecutionResponse } from '../../services/compiler.service';
import { JitsiMeetingComponent, JitsiMeetingStatus } from '../jitsi-meeting/jitsi-meeting.component';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, JitsiMeetingComponent],
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild('gutterCol') gutterCol!: ElementRef<HTMLDivElement>;
  @ViewChild('highlightLayer') highlightLayer!: ElementRef<HTMLDivElement>;
  @ViewChild(JitsiMeetingComponent) jitsiComp?: JitsiMeetingComponent;

  sessionId = 1;
  activeLanguage = 'javascript';
  activeVersion = '18.15.0';
  isEditorMaximized = false;

  // Jitsi Live Video Call State
  roomName = 'mentorhub-session-1-98a7b4c2';
  currentUser: any = {
    name: 'AKSHAT ARYAN',
    email: 'akshat@mentorhub.com',
    role: 'MENTOR'
  };

  isVideoConnected = false;
  jitsiStatus: JitsiMeetingStatus = 'IDLE';

  runtimes: RuntimeInfo[] = [];

  sampleCodeMap: Record<string, string> = {
    javascript: `// MentorHub JavaScript Execution (Piston API Sandbox)
function calculateCompatibilityScore(menteeName, mentorName) {
  console.log(\`Matching \${menteeName} with \${mentorName}...\`);
  return 98.4;
}

const score = calculateCompatibilityScore("KRITI SAGAR", "AKSHAT ARYAN");
console.log(\`AI Compatibility Score: \${score}%\`);`,

    python: `# MentorHub Python Execution (Piston API Sandbox)
def calculate_compatibility_score(mentee_name, mentor_name):
    print(f"Matching {mentee_name} with {mentor_name}...")
    return 98.4

score = calculate_compatibility_score("KRITI SAGAR", "AKSHAT ARYAN")
print(f"AI Compatibility Score: {score}%")`,

    java: `// MentorHub Java Execution (Piston API Sandbox)
public class Main {
    public static void main(String[] args) {
        System.out.println("Matching KRITI SAGAR with AKSHAT ARYAN...");
        System.out.println("AI Compatibility Score: 98.4%");
    }
}`,

    cpp: `// MentorHub C++ Execution (Piston API Sandbox)
#include <iostream>
using namespace std;

int main() {
    cout << "Matching KRITI SAGAR with AKSHAT ARYAN..." << endl;
    cout << "AI Compatibility Score: 98.4%" << endl;
    return 0;
}`,

    typescript: `// MentorHub TypeScript Execution (Piston API Sandbox)
console.log("Compiler is ready to use");
console.log("Start working on your skills");`,

    csharp: `// MentorHub C# Execution (Piston API Sandbox)
using System;

class Program {
    static void Main() {
        Console.WriteLine("Matching KRITI SAGAR with AKSHAT ARYAN...");
        Console.WriteLine("AI Compatibility Score: 98.4%");
    }
}`,

    go: `// MentorHub Go Execution (Piston API Sandbox)
package main
import "fmt"

func main() {
    fmt.Println("Matching KRITI SAGAR with AKSHAT ARYAN...")
    fmt.Println("AI Compatibility Score: 98.4%")
}`,

    rust: `// MentorHub Rust Execution (Piston API Sandbox)
fn main() {
    println!("Matching KRITI SAGAR with AKSHAT ARYAN...");
    println!("AI Compatibility Score: 98.4%");
}`
  };

  code = '';
  stdin = '';
  notes = `# Live Mentoring Workspace Session Notes

- Mentor: AKSHAT ARYAN
- Mentees: KRITI SAGAR, VANAJA, PAVANI
- Reviewing Spring Boot 3 WebSocket Handlers ('TextWebSocketHandler').
- Angular 17 Standalone Component & Monaco Code Editor integration.
- Piston API Code Compilation Engine active.
- Real-time CHAT, NOTES, and CODE payload sync across peers.`;

  // Normalized Terminal State
  outputLogs: string[] = [
    'Compiler is ready to use',
    'Start working on your skills'
  ];
  stderrLogs: string[] = [];
  compileOutputLogs: string[] = [];

  executionStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'RATE_LIMIT_EXCEEDED' | 'NETWORK_ERROR' = 'IDLE';
  executionTime: number | null = null;

  terminalTab: 'stdout' | 'stderr' | 'compile' | 'stdin' = 'stdout';

  isCompiling = false;
  chatInput = '';
  activeTab: 'video' | 'notes' | 'chat' = 'video';

  chatMessages: { sender: string; text: string; time: string }[] = [
    { sender: 'AKSHAT ARYAN', text: 'Welcome KRITI SAGAR, VANAJA, and PAVANI! Jitsi Video Call, Piston Compiler, and WebSockets are ready.', time: '13:58:30' }
  ];

  isMicOn = false;
  isCamOn = false;
  isSharingScreen = false;

  private wsSubscription: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private compilerService: CompilerService,
    public wsService: WebSocketService
  ) {
    this.code = this.sampleCodeMap['javascript'];
  }

  getAvatarByName(name: string): string {
    if (!name) return 'assets/mentorhub-logo.png';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return 'assets/mentorhub-logo.png';
  }

  ngOnInit() {
    // Load Current User Details
    this.apiService.getCurrentUser().subscribe(u => {
      if (u) {
        this.currentUser = {
          name: u.name || 'AKSHAT ARYAN',
          email: u.email || 'akshat@mentorhub.com',
          role: u.role || 'MENTOR'
        };
      }
    });

    // Fetch or Generate Session Meeting Room Info
    this.apiService.getMeetingInfo(this.sessionId).subscribe(m => {
      if (m && m.roomName) {
        this.roomName = m.roomName;
      }
    });

    // Load Available Piston Runtimes
    this.compilerService.getRuntimes().subscribe(runtimesList => {
      if (runtimesList && runtimesList.length > 0) {
        this.runtimes = runtimesList;
        const currentRuntime = this.runtimes.find(r => r.language.toLowerCase() === this.activeLanguage.toLowerCase());
        if (currentRuntime) {
          this.activeVersion = currentRuntime.version;
        }
      }
    });

    this.apiService.getWorkspace(this.sessionId).subscribe(data => {
      if (data) {
        if (data.activeLanguage) this.activeLanguage = data.activeLanguage;
        if (data.sharedCode && data.sharedCode.trim().length > 0) {
          this.code = data.sharedCode;
        } else {
          this.code = this.sampleCodeMap[this.activeLanguage] || this.sampleCodeMap['javascript'];
        }
        if (data.sharedNotes) this.notes = data.sharedNotes;
      }
    });

    // Connect WebSocket
    this.wsService.connect('ws://localhost:8080/ws-workspace');
    this.wsSubscription = this.wsService.messages$.subscribe(msg => {
      if (msg.type === 'CHAT') {
        const payload = msg.payload || msg;
        if (payload.text) {
          this.chatMessages.push(payload);
        }
      } else if (msg.type === 'CODE' || msg.type === 'CODE_SYNC') {
        const content = msg.content || (msg.payload ? msg.payload.code : null);
        if (content && content !== this.code) {
          this.code = content;
        }
      } else if (msg.type === 'NOTES' || msg.type === 'NOTES_SYNC') {
        const content = msg.content || (msg.payload ? msg.payload.notes : null);
        if (content && content !== this.notes) {
          this.notes = content;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  toggleEditorMaximize() {
    this.isEditorMaximized = !this.isEditorMaximized;
  }

  onEditorScroll(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    if (this.gutterCol && this.gutterCol.nativeElement) {
      this.gutterCol.nativeElement.scrollTop = textarea.scrollTop;
    }
    if (this.highlightLayer && this.highlightLayer.nativeElement) {
      this.highlightLayer.nativeElement.scrollTop = textarea.scrollTop;
      this.highlightLayer.nativeElement.scrollLeft = textarea.scrollLeft;
    }
  }

  get lineNumbers(): number[] {
    const lineCount = (this.code || '').split('\n').length;
    return Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);
  }

  getHighlightedCode(): string {
    if (!this.code) return '&nbsp;';

    let html = this.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (html.endsWith('\n')) {
      html += ' ';
    }

    // 1. Comments
    const comments: string[] = [];
    html = html.replace(/(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/g, (match) => {
      comments.push(match);
      return `___CMT_${comments.length - 1}___`;
    });

    // 2. Strings
    const strings: string[] = [];
    html = html.replace(/("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/g, (match) => {
      strings.push(match);
      return `___STR_${strings.length - 1}___`;
    });

    // 3. Keywords Map
    const keywordsMap: Record<string, string[]> = {
      java: ['public', 'class', 'static', 'void', 'String', 'double', 'int', 'boolean', 'new', 'return', 'import', 'package', 'if', 'else'],
      cpp: ['#include', 'using', 'namespace', 'std', 'int', 'double', 'return', 'class', 'void', 'const', 'auto'],
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'import', 'export', 'class', 'new'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'string', 'number', 'boolean', 'interface', 'type', 'export', 'import'],
      python: ['def', 'return', 'import', 'from', 'as', 'if', 'else', 'elif', 'for', 'in', 'while', 'class', 'True', 'False', 'None'],
      csharp: ['using', 'namespace', 'class', 'static', 'void', 'string', 'int', 'double', 'bool', 'return', 'public'],
      go: ['package', 'import', 'func', 'main', 'var', 'const', 'type', 'struct', 'return', 'if', 'else'],
      rust: ['fn', 'let', 'mut', 'pub', 'struct', 'enum', 'impl', 'use', 'mod', 'return', 'if', 'else']
    };

    const currentKeywords = keywordsMap[this.activeLanguage] || keywordsMap['javascript'];
    const keywordRegex = new RegExp(`\\b(${currentKeywords.join('|')})\\b`, 'g');
    html = html.replace(keywordRegex, '<span class="token-keyword">$1</span>');

    // 4. Methods / Functions
    html = html.replace(/\b(println|log|cout|print|main|Println|Console)\b/g, '<span class="token-function">$1</span>');

    // 5. Classes / Built-ins
    html = html.replace(/\b(System|Console|Math|out|std|fmt)\b/g, '<span class="token-class">$1</span>');

    // 6. Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>');

    // Restore Strings
    strings.forEach((str, i) => {
      html = html.replace(`___STR_${i}___`, `<span class="token-string">${str}</span>`);
    });

    // Restore Comments
    comments.forEach((cm, i) => {
      html = html.replace(`___CMT_${i}___`, `<span class="token-comment">${cm}</span>`);
    });

    return html;
  }

  onLanguageChange() {
    const selected = this.runtimes.find(r => r.language.toLowerCase() === this.activeLanguage.toLowerCase());
    if (selected) {
      this.activeVersion = selected.version;
    }

    if (this.sampleCodeMap[this.activeLanguage]) {
      this.code = this.sampleCodeMap[this.activeLanguage];
      this.updateCode(this.code);
    }
  }

  resetCodeToTemplate() {
    if (this.sampleCodeMap[this.activeLanguage]) {
      this.code = this.sampleCodeMap[this.activeLanguage];
      this.updateCode(this.code);
    }
  }

  updateCode(content: string) {
    this.code = content;
    this.wsService.sendMessage({
      type: 'CODE',
      sessionId: this.sessionId,
      content: this.code,
      language: this.activeLanguage
    });
    this.apiService.updateWorkspaceCode(this.sessionId, this.code, this.activeLanguage).subscribe();
  }

  updateNotes(content: string) {
    this.notes = content;
    this.wsService.sendMessage({
      type: 'NOTES',
      sessionId: this.sessionId,
      content: this.notes
    });
    this.apiService.updateWorkspaceNotes(this.sessionId, this.notes).subscribe();
  }

  runCode() {
    if (this.isCompiling) return;
    this.isCompiling = true;
    this.executionStatus = 'RUNNING';
    this.outputLogs = [];
    this.stderrLogs = [];
    this.compileOutputLogs = [];

    this.compilerService.executeCode({
      language: this.activeLanguage,
      version: this.activeVersion,
      code: this.code,
      stdin: this.stdin
    }).subscribe({
      next: (res: CodeExecutionResponse) => {
        this.isCompiling = false;
        this.executionTime = res.executionTime || null;
        this.executionStatus = (res.status as any) || (res.success ? 'SUCCESS' : 'RUNTIME_ERROR');

        if (res.stdout && res.stdout.trim().length > 0) {
          this.outputLogs = res.stdout.split('\n').filter(l => l.length > 0);
        } else if (res.success) {
          this.outputLogs = ['Program executed cleanly with no output.'];
        }

        if (res.stderr && res.stderr.trim().length > 0) {
          this.stderrLogs = res.stderr.split('\n').filter(l => l.length > 0);
          if (res.status === 'RUNTIME_ERROR' || res.status === 'COMPILATION_ERROR') {
            this.terminalTab = 'stderr';
          }
        }

        if (res.compileOutput && res.compileOutput.trim().length > 0) {
          this.compileOutputLogs = res.compileOutput.split('\n').filter(l => l.length > 0);
          if (res.status === 'COMPILATION_ERROR') {
            this.terminalTab = 'compile';
          }
        }

        if (!res.stderr && !res.compileOutput && res.stdout) {
          this.terminalTab = 'stdout';
        }
      },
      error: (err) => {
        this.isCompiling = false;
        this.executionStatus = 'NETWORK_ERROR';
        this.stderrLogs = [err.message || 'Compiler request error.'];
        this.terminalTab = 'stderr';
      }
    });
  }

  sendChatMessage() {
    if (!this.chatInput.trim()) return;

    const payload = {
      sender: this.currentUser.name || 'AKSHAT ARYAN',
      text: this.chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.chatMessages.push(payload);
    this.wsService.sendMessage({
      type: 'CHAT',
      sessionId: this.sessionId,
      payload
    });
    this.chatInput = '';
  }

  clearTerminal() {
    this.outputLogs = [];
    this.stderrLogs = [];
    this.compileOutputLogs = [];
    this.executionStatus = 'IDLE';
  }

  // Jitsi Video Conference Control Bindings
  toggleMic() {
    if (this.jitsiComp) {
      this.jitsiComp.toggleAudio();
    } else {
      this.isMicOn = !this.isMicOn;
    }
  }

  toggleCam() {
    if (this.jitsiComp) {
      this.jitsiComp.toggleVideo();
    } else {
      this.isCamOn = !this.isCamOn;
    }
  }

  toggleScreen() {
    if (this.jitsiComp) {
      this.jitsiComp.toggleShareScreen();
    } else {
      this.isSharingScreen = !this.isSharingScreen;
    }
  }

  leaveCall() {
    if (this.jitsiComp) {
      this.jitsiComp.hangup();
    }
  }

  endSession() {
    this.leaveCall();
    this.apiService.endMeeting(this.sessionId).subscribe(() => {
      console.log('Mentoring session ended cleanly.');
    });
  }

  // Jitsi Event Callbacks
  onMeetingJoined() {
    this.isVideoConnected = true;
  }

  onMeetingEnded() {
    this.isVideoConnected = false;
  }

  onAudioMuteChanged(muted: boolean) {
    this.isMicOn = !muted;
  }

  onVideoMuteChanged(muted: boolean) {
    this.isCamOn = !muted;
  }

  onScreenShareChanged(on: boolean) {
    this.isSharingScreen = on;
  }

  toastMessage: string | null = null;

  copyInviteLink() {
    const directMeetingUrl = `https://meet.jit.si/${this.roomName}`;
    const appWorkspaceUrl = `http://localhost:4200/workspace?sessionId=${this.sessionId}`;
    const fullText = `🎯 Join AKSHAT ARYAN's Live Mentoring Session on MentorHub!\n\n💻 Workspace App: ${appWorkspaceUrl}\n📹 Direct Video Room: ${directMeetingUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        this.showToast('📋 Session Invite Link copied! Send to KRITI SAGAR, VANAJA, or PAVANI.');
      }).catch(() => {
        prompt('Copy meeting invite link for mentees:', directMeetingUrl);
      });
    } else {
      prompt('Copy meeting invite link for mentees:', directMeetingUrl);
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
      }
    }, 4500);
  }

  onJitsiStatusChanged(status: JitsiMeetingStatus) {
    this.jitsiStatus = status;
    this.isVideoConnected = status === 'CONNECTED';
  }
}
