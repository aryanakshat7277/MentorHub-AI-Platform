import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { WebSocketService } from '../../services/websocket.service';
import { CompilerService, RuntimeInfo, CodeExecutionResponse } from '../../services/compiler.service';
import { JitsiMeetingComponent, JitsiMeetingStatus } from '../jitsi-meeting/jitsi-meeting.component';
import { GestureRecognitionService } from '../../services/gesture-recognition.service';
import { SoundService } from '../../services/sound.service';

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
  @ViewChild('workspaceContainer') workspaceContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('codeTextarea') codeTextarea?: ElementRef<HTMLTextAreaElement>;
  @ViewChild(JitsiMeetingComponent) jitsiComp?: JitsiMeetingComponent;

  sessionId = 1;
  activeLanguage = 'javascript';
  activeVersion = '18.15.0';
  isEditorMaximized = false;

  // Resizable Display Area State
  splitRatioPercent = 65; // Left pane width percentage (spacious code writing area)
  terminalHeightPx = 185; // Terminal height in pixels
  isTerminalCollapsed = false;
  isDraggingHorizontal = false;
  isDraggingVertical = false;

  private startX = 0;
  private startWidthPercent = 65;
  private startY = 0;
  private startTerminalHeight = 185;

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

    c: `// MentorHub C Execution (GCC Compiler)
#include <stdio.h>

int main() {
    printf("Matching KRITI SAGAR with AKSHAT ARYAN...\\n");
    printf("AI Compatibility Score: 98.4%%\\n");
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
  isCompiling = false;
  terminalTab: 'stdout' | 'stderr' | 'compile' | 'stdin' | 'autofix' = 'stdout';

  // ==========================================
  // Feature 1: VS Code Copilot Autocomplete
  // Priority: Groq (qwen3.8-27b) -> Gemini -> Local
  // ==========================================
  isCompleting = false;
  ghostSuggestion = '';
  showGhostSuggestion = false;
  copilotProvider = 'GROQ';
  copilotModel = 'qwen3.8-27b';
  copilotLatency = 0;

  // ==========================================
  // Feature 2: In-IDE Automated Error Diagnosis & Fix
  // Priority: Groq (qwen3.8-27b) -> Gemini -> Local
  // ==========================================
  isAutoFixing = false;
  autoFixStatusMsg = '';
  lastAutoFixResult: any = null;
  highlightedFixedLines: number[] = [];
  previousBuggyCode = '';

  // ==========================================
  // Feature 3: Cross-Language Code Converter (Polyglot)
  // "Write same code in other languages for same output with clean UI"
  // ==========================================
  isPolyglotModalOpen = false;
  isTranspiling = false;
  targetLanguage = 'python';
  transpiledCode = '';
  transpiledExplanation = '';
  transpiledDifferences: string[] = [];
  transpileProvider = '';
  transpileModel = '';
  transpileLatency = 0;
  transpileCache: Record<string, { code: string; explanation: string; differences: string[]; provider: string; model: string; latency: number }> = {};

  // In-Modal Test Run State to verify identical output
  isTestingTranspiled = false;
  transpiledTestOutput = '';
  transpiledTestStatus: 'IDLE' | 'SUCCESS' | 'ERROR' = 'IDLE';

  chatInput = '';
  activeTab: 'video' | 'notes' | 'chat' = 'video';

  chatMessages: { sender: string; text: string; time: string }[] = [
    { sender: 'AKSHAT ARYAN', text: 'Welcome KRITI SAGAR, VANAJA, and PAVANI! Jitsi Video Call, Piston Compiler, and WebSockets are ready.', time: '13:58:30' }
  ];

  isMicOn = false;
  isCamOn = false;
  isSharingScreen = false;

  private wsSubscription: Subscription | null = null;
  private gestureSubscription: Subscription | null = null;

  snippetOptions = [
    { label: '🎯 Two Sum Hash Map', key: 'twosum' },
    { label: '🔍 Binary Search', key: 'bsearch' },
    { label: '⚡ QuickSort Algorithm', key: 'quicksort' },
    { label: '🌐 REST API Fetch Simulation', key: 'http' },
    { label: '🌳 Binary Tree Traversal', key: 'tree' }
  ];

  algorithmSnippets: Record<string, Record<string, string>> = {
    twosum: {
      javascript: `// Two Sum Problem - Hash Map O(N)
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

const nums = [2, 7, 11, 15];
const target = 9;
console.log("Input Array:", nums);
console.log("Target:", target);
console.log("Indices Result:", twoSum(nums, target));`,
      python: `# Two Sum Problem - Hash Map O(N)
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

nums = [2, 7, 11, 15]
target = 9
print("Input Array:", nums)
print("Target:", target)
print("Indices Result:", two_sum(nums, target))`,
      java: `// Two Sum Problem - Hash Map O(N)
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] res = twoSum(nums, target);
        System.out.println("Result Indices: " + Arrays.toString(res));
    }
}`,
      cpp: `// Two Sum Problem - Hash Map O(N)
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> res = twoSum(nums, target);
    cout << "Result Indices: [" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`
    },
    quicksort: {
      javascript: `// QuickSort Algorithm
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const unsorted = [64, 25, 12, 22, 11, 90];
console.log("Unsorted Array:", unsorted);
console.log("Sorted Array:  ", quickSort(unsorted));`,
      python: `# QuickSort Algorithm
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[-1]
    left = [x for x in arr[:-1] if x <= pivot]
    right = [x for x in arr[:-1] if x > pivot]
    return quick_sort(left) + [pivot] + quick_sort(right)

unsorted = [64, 25, 12, 22, 11, 90]
print("Unsorted:", unsorted)
print("Sorted:  ", quick_sort(unsorted))`
    }
  };

  // ==========================================
  // Feature 2: Live Interview Confidence Coach
  // ==========================================
  isConfidenceCoachActive = false;
  isCoachMinimized = false;
  coachAdvice = 'Speaking pace is great! Keep your delivery calm and thoughtful.';
  speechWordsPerMinute = 125;
  fillerWordCount = 0;
  fillerWordList: { word: string; count: number }[] = [];
  speechPaceStatus: 'TOO_SLOW' | 'STEADY' | 'TOO_FAST' = 'STEADY';
  confidenceScore = 92;
  totalWordsSpoken = 0;
  speechStartTime = 0;
  audioBars: number[] = [25, 45, 65, 85, 95, 75, 40, 60, 30, 70, 50, 80];
  private recognitionInstance: any = null;
  private audioBarInterval: any = null;

  // ==========================================
  // Feature 3: Silent Co-Pilot Spectator Mode
  // ==========================================
  isSpectator = false;
  spectatorCount = 2;
  spectatorKudos: { emoji: string; id: number }[] = [];
  spectatorQuestions: { author: string; question: string; time: string; upvotes: number }[] = [
    { author: 'Sneha Rao', question: 'Why use ConcurrentHashMap instead of Collections.synchronizedMap here?', time: '14:02', upvotes: 3 },
    { author: 'Rahul Verma', question: 'Does Spring Boot 3 automatically enable virtual threads with Project Loom?', time: '14:06', upvotes: 2 }
  ];
  newSpectatorQuestion = '';
  showSpectatorQna = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private compilerService: CompilerService,
    public wsService: WebSocketService,
    public gestureService: GestureRecognitionService,
    private soundService: SoundService
  ) {
    this.code = this.sampleCodeMap['javascript'];
  }

  insertSnippet(key: string) {
    this.soundService.playClickSound();
    const lang = this.activeLanguage.toLowerCase();
    const snippetForLang = this.algorithmSnippets[key]?.[lang] || 
                           this.algorithmSnippets[key]?.['javascript'] || 
                           this.sampleCodeMap[lang];
    if (snippetForLang) {
      this.code = snippetForLang;
      this.updateCode(this.code);
      this.showToast(`✨ Inserted ${key.toUpperCase()} algorithm template!`);
    }
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

    // Load Available Verified Compiler Runtimes
    this.compilerService.getRuntimes().subscribe(runtimesList => {
      if (runtimesList && runtimesList.length > 0) {
        const allowedLanguages = ['python', 'java', 'cpp', 'c', 'javascript', 'typescript', 'go', 'csharp', 'rust'];
        this.runtimes = runtimesList.filter(r => allowedLanguages.includes(r.language.toLowerCase()));
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

    // Check if entered in Silent Co-Pilot Spectator mode or CUTM Lab exercise mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'spectator') {
        this.isSpectator = true;
        this.showToast('👁️ Joined session in Silent Co-Pilot Spectator Mode (Read-Only).');
        const sid = params['sessionId'] ? parseInt(params['sessionId']) : this.sessionId;
        this.apiService.joinShadowSession(sid).subscribe();
      }
      if (params['course'] && params['lab']) {
        this.loadCutmLabExercise(
          params['course'],
          params['courseTitle'] || '',
          params['module'] ? parseInt(params['module']) : 1,
          params['moduleTitle'] || '',
          params['lab']
        );
      }
    });
  }

  loadCutmLabExercise(courseCode: string, courseTitle: string, moduleNum: number, moduleTitle: string, labWork: string) {
    // 1. Detect target language based on course and lab description
    const combined = (labWork + ' ' + courseTitle).toLowerCase();
    let detectedLang = 'python';
    if (combined.includes('c++') || combined.includes('cpp') || combined.includes('pointer') || combined.includes('stl') || combined.includes('runge-kutta')) {
      detectedLang = 'cpp';
    } else if (combined.includes('java') || combined.includes('spring') || combined.includes('jvm')) {
      detectedLang = 'java';
    } else if (combined.includes('javascript') || combined.includes('node') || combined.includes('react') || combined.includes('web')) {
      detectedLang = 'javascript';
    } else {
      detectedLang = 'python';
    }

    this.activeLanguage = detectedLang;
    const runtime = this.runtimes.find(r => r.language.toLowerCase() === detectedLang);
    if (runtime) {
      this.activeVersion = runtime.version;
    }

    // 2. Generate starter code template according to language
    let starterCode = '';
    if (detectedLang === 'python') {
      starterCode = `"""
================================================================================
CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT
Course: ${courseCode} - ${courseTitle}
Module ${moduleNum}: ${moduleTitle}
Assignment: ${labWork}
================================================================================
"""

import sys

def execute_centurion_lab():
    print("=" * 60)
    print("🎓 CUTM PRACTICAL EXPERIMENT RUNNER")
    print("📘 Course: ${courseCode} | Module: ${moduleNum}")
    print("🔬 Objective: ${labWork}")
    print("=" * 60)
    
    # --- STUDENT IMPLEMENTATION BEGINS HERE ---
    print("\\n[+] Executing algorithm simulation...")
    
    # Example computation test harness
    status = "SUCCESS"
    print(f"[✓] Experiment status: {status}")
    print("[✓] All verification test vectors passed.")
    # --- STUDENT IMPLEMENTATION ENDS HERE ---

if __name__ == "__main__":
    execute_centurion_lab()
`;
    } else if (detectedLang === 'cpp') {
      starterCode = `/**
 * ============================================================================
 * CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT
 * Course: ${courseCode} - ${courseTitle}
 * Module ${moduleNum}: ${moduleTitle}
 * Assignment: ${labWork}
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    cout << "============================================================" << endl;
    cout << "🎓 CUTM PRACTICAL EXPERIMENT RUNNER" << endl;
    cout << "📘 Course: ${courseCode} | Module: ${moduleNum}" << endl;
    cout << "🔬 Objective: ${labWork}" << endl;
    cout << "============================================================" << endl;

    // --- STUDENT IMPLEMENTATION HERE ---
    cout << "\\n[+] Executing C++ algorithm test..." << endl;
    cout << "[✓] Execution successful." << endl;

    return 0;
}
`;
    } else if (detectedLang === 'java') {
      starterCode = `/**
 * ============================================================================
 * CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT
 * Course: ${courseCode} - ${courseTitle}
 * Module ${moduleNum}: ${moduleTitle}
 * Assignment: ${labWork}
 * ============================================================================
 */

public class Main {
    public static void main(String[] args) {
        System.out.println("============================================================");
        System.out.println("🎓 CUTM PRACTICAL EXPERIMENT RUNNER");
        System.out.println("📘 Course: ${courseCode} | Module: ${moduleNum}");
        System.out.println("🔬 Objective: ${labWork}");
        System.out.println("============================================================");

        // --- STUDENT IMPLEMENTATION HERE ---
        System.out.println("\\n[+] Running Java experiment suite...");
        System.out.println("[✓] All test assertions verified.");
    }
}
`;
    } else {
      starterCode = `// ============================================================================
// CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT
// Course: ${courseCode} - ${courseTitle}
// Module ${moduleNum}: ${moduleTitle}
// Assignment: ${labWork}
// ============================================================================

console.log("============================================================");
console.log("🎓 CUTM PRACTICAL EXPERIMENT RUNNER");
console.log("📘 Course: ${courseCode} | Module: ${moduleNum}");
console.log("🔬 Objective: ${labWork}");
console.log("============================================================");

// --- STUDENT IMPLEMENTATION HERE ---
console.log("\\n[+] Running JavaScript experiment suite...");
console.log("[✓] Execution complete.");
`;
    }

    this.code = starterCode;
    this.updateCode(this.code);

    // 3. Populate Notes Tab with Detailed Lab Specification
    this.notes = `# 🎓 Centurion University Lab Specification
## ${courseCode}: ${courseTitle}
### Module ${moduleNum}: ${moduleTitle}

---

### 🔬 Practical Lab Assignment
**${labWork}**

---

### 📋 Recommended Execution Steps
1. Review the mathematical formulation or algorithmic requirements above.
2. Implement your core data structures and logic in the editor.
3. Click **▶ RUN CODE** to execute the script in the Piston Sandbox.
4. Verify your output in the Terminal STDOUT tab.
5. Once your code works, defend your implementation in **Mock Viva Arena**!
`;
    this.updateNotes(this.notes);

    // 4. Switch to notes tab or show toast
    this.showToast(`✨ Loaded CUTM Lab: ${courseCode} Module ${moduleNum} into Workspace Sandbox!`);
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.stopSpeechAnalysis();
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

  isLineFixed(line: number): boolean {
    return !!(this.highlightedFixedLines && this.highlightedFixedLines.includes(line));
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

  formatLanguageName(lang: string): string {
    const l = (lang || '').toLowerCase();
    switch (l) {
      case 'cpp': return 'C++';
      case 'csharp': return 'C#';
      case 'c': return 'C';
      case 'javascript': return 'JAVASCRIPT';
      case 'typescript': return 'TYPESCRIPT';
      case 'python': return 'PYTHON';
      case 'java': return 'JAVA';
      case 'go': return 'GO';
      case 'rust': return 'RUST';
      default: return (lang || '').toUpperCase();
    }
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
    this.dismissGhostSuggestion();
    this.dismissAutoFixCard();
  }

  resetCodeToTemplate() {
    if (this.sampleCodeMap[this.activeLanguage]) {
      this.code = this.sampleCodeMap[this.activeLanguage];
      this.updateCode(this.code);
    }
    this.dismissGhostSuggestion();
    this.dismissAutoFixCard();
  }

  onCodeChange(newCode: string) {
    this.updateCode(newCode);
    if (this.showGhostSuggestion) {
      this.dismissGhostSuggestion();
    }
  }

  focusTextarea() {
    if (this.codeTextarea && this.codeTextarea.nativeElement && !this.isSpectator) {
      this.codeTextarea.nativeElement.focus();
    }
  }

  onEditorKeyDown(event: KeyboardEvent) {
    // 1. Tab Key Handling
    if (event.key === 'Tab') {
      if (this.showGhostSuggestion && this.ghostSuggestion) {
        event.preventDefault();
        this.acceptGhostSuggestion();
        return;
      }
      // Standard Tab in code editor: Insert 4 spaces at cursor
      event.preventDefault();
      const textarea = this.codeTextarea?.nativeElement || (event.target as HTMLTextAreaElement);
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = this.code.substring(0, start);
        const after = this.code.substring(end);
        this.code = before + '    ' + after;
        this.updateCode(this.code);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
      return;
    }

    // 2. Escape Key Handling
    if (event.key === 'Escape') {
      if (this.showGhostSuggestion) {
        event.preventDefault();
        this.dismissGhostSuggestion();
        return;
      }
    }

    // 3. Alt + \ or Ctrl + Space for manual AI autocomplete trigger
    if ((event.altKey && event.key === '\\') || (event.ctrlKey && event.code === 'Space')) {
      event.preventDefault();
      this.triggerAutocomplete(true);
      return;
    }
  }

  // ==========================================
  // Copilot Feature 1: VS Code Auto-Completion
  // Priority: Groq (qwen3.8-27b) -> Gemini -> Local
  // ==========================================
  triggerAutocomplete(manual = true) {
    if (this.isCompleting || this.isSpectator) return;

    const textarea = this.codeTextarea?.nativeElement;
    let prefix = this.code;
    let suffix = '';
    if (textarea && textarea.selectionStart !== undefined) {
      prefix = this.code.substring(0, textarea.selectionStart);
      suffix = this.code.substring(textarea.selectionEnd);
    }

    this.isCompleting = true;
    if (manual) {
      this.soundService.playClickSound();
    }

    this.compilerService.completeCode({
      language: this.activeLanguage,
      code: this.code,
      prefix: prefix,
      suffix: suffix
    }).subscribe({
      next: (res) => {
        this.isCompleting = false;
        if (res && res.success && res.completion && res.completion.trim().length > 0) {
          this.ghostSuggestion = res.completion;
          this.showGhostSuggestion = true;
          this.copilotProvider = res.provider;
          this.copilotModel = res.model;
          this.copilotLatency = res.latencyMs;
          if (manual) {
            this.showToast(`✨ AI Autocomplete ready (${res.provider} ${res.model}, ${res.latencyMs}ms)! Press Tab to accept.`);
          }
        } else if (manual) {
          this.showToast('💡 AI Copilot has no continuation for this location.');
        }
      },
      error: () => {
        this.isCompleting = false;
      }
    });
  }

  acceptGhostSuggestion() {
    if (!this.ghostSuggestion) return;
    const textarea = this.codeTextarea?.nativeElement;
    if (textarea && textarea.selectionStart !== undefined) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = this.code.substring(0, start);
      const after = this.code.substring(end);
      this.code = before + this.ghostSuggestion + after;
      this.updateCode(this.code);
      const newPos = start + this.ghostSuggestion.length;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    } else {
      this.code = this.code + (this.code.endsWith('\n') ? '' : '\n') + this.ghostSuggestion;
      this.updateCode(this.code);
    }

    this.soundService.playSuccessSound();
    this.showToast('✅ AI Code Completion inserted into IDE!');
    this.ghostSuggestion = '';
    this.showGhostSuggestion = false;
  }

  dismissGhostSuggestion() {
    this.ghostSuggestion = '';
    this.showGhostSuggestion = false;
  }

  get hasActiveError(): boolean {
    return (
      (this.stderrLogs && this.stderrLogs.length > 0) ||
      (this.compileOutputLogs && this.compileOutputLogs.length > 0) ||
      this.executionStatus === 'RUNTIME_ERROR' ||
      this.executionStatus === 'COMPILATION_ERROR' ||
      this.executionStatus === 'NETWORK_ERROR'
    );
  }

  onAutoFixTabClick() {
    this.terminalTab = 'autofix';
    this.isTerminalCollapsed = false;
    if (!this.lastAutoFixResult && !this.isAutoFixing && this.hasActiveError) {
      this.triggerAutoFix();
    }
  }

  // ==========================================
  // Copilot Feature 2: In-IDE Auto-Fix & Error Diagnosis
  // Priority: Groq (qwen3.8-27b) -> Gemini -> Local
  // ==========================================
  triggerAutoFix(customError?: string, customStatus?: string) {
    if (this.isAutoFixing) return;
    this.isAutoFixing = true;
    this.autoFixStatusMsg = 'AI Copilot analyzing error stack trace with Groq Priority 1 (qwen3.8-27b)...';
    this.previousBuggyCode = this.code;
    this.terminalTab = 'autofix';
    this.isTerminalCollapsed = false;

    let errorText = customError;
    if (!errorText || errorText.trim().length === 0) {
      if (this.stderrLogs.length > 0) {
        errorText = this.stderrLogs.join('\n');
      } else if (this.compileOutputLogs.length > 0) {
        errorText = this.compileOutputLogs.join('\n');
      } else {
        errorText = 'Runtime or compilation failure in code.';
      }
    }

    this.showToast('🔍 AI Copilot diagnosing root cause & repairing code...');

    this.compilerService.autoFixCode({
      language: this.activeLanguage,
      code: this.code,
      error: errorText,
      status: customStatus || this.executionStatus
    }).subscribe({
      next: (res) => {
        this.isAutoFixing = false;
        this.lastAutoFixResult = res;

        if (res && res.success && res.fixedCode) {
          // 1. Write the corrected code itself directly in the IDE
          this.code = res.fixedCode;
          this.updateCode(this.code);

          // 2. Highlighting the error previously there and how it has fixed
          this.highlightedFixedLines = res.diffLines || [];

          // 3. Switch terminal tab to AI Diagnosis
          this.terminalTab = 'autofix';
          this.isTerminalCollapsed = false;

          this.soundService.playSuccessSound();
          this.showToast(`🛠️ AI Auto-Fix Applied by ${res.provider} (${res.model}) in ${res.latencyMs}ms!`);
        } else {
          this.showToast('⚠️ AI Auto-Fix could not resolve the error.');
        }
      },
      error: () => {
        this.isAutoFixing = false;
        this.showToast('⚠️ AI Auto-Fix request encountered an error.');
      }
    });
  }

  revertAutoFix() {
    if (this.previousBuggyCode) {
      this.code = this.previousBuggyCode;
      this.updateCode(this.code);
      this.highlightedFixedLines = [];
      this.soundService.playClickSound();
      this.showToast('↩ Reverted back to previous buggy code.');
    }
  }

  dismissAutoFixCard() {
    this.lastAutoFixResult = null;
    this.highlightedFixedLines = [];
    if (this.terminalTab === 'autofix') {
      this.terminalTab = 'stdout';
    }
  }

  // ==========================================
  // Polyglot Feature: Cross-Language Code Converter
  // ==========================================
  openPolyglotModal() {
    this.isPolyglotModalOpen = true;
    this.soundService.playClickSound();

    const current = (this.activeLanguage || '').toLowerCase();
    const available = this.supportedTargetLanguages;
    if (this.targetLanguage === current || !available.includes(this.targetLanguage)) {
      this.targetLanguage = current === 'python' ? 'java' : (current === 'javascript' ? 'python' : 'javascript');
    }

    this.transpileCache = {};
    this.transpiledTestOutput = '';
    this.transpiledTestStatus = 'IDLE';
    this.transpileCurrentCode();
  }

  closePolyglotModal() {
    this.isPolyglotModalOpen = false;
  }

  get supportedTargetLanguages(): string[] {
    return ['python', 'java', 'cpp', 'c', 'javascript', 'typescript', 'go', 'csharp', 'rust'];
  }

  selectTargetLanguage(lang: string) {
    if (this.targetLanguage === lang) return;
    this.targetLanguage = lang;
    this.soundService.playClickSound();
    this.transpiledTestOutput = '';
    this.transpiledTestStatus = 'IDLE';

    if (this.transpileCache[lang]) {
      const cached = this.transpileCache[lang];
      this.transpiledCode = cached.code;
      this.transpiledExplanation = cached.explanation;
      this.transpiledDifferences = cached.differences;
      this.transpileProvider = cached.provider;
      this.transpileModel = cached.model;
      this.transpileLatency = cached.latency;
      return;
    }

    this.transpileCurrentCode();
  }

  transpileCurrentCode() {
    if (this.isTranspiling) return;
    this.isTranspiling = true;
    const src = this.activeLanguage;
    const tgt = this.targetLanguage;

    this.compilerService.transpileCode({
      sourceLanguage: src,
      targetLanguage: tgt,
      code: this.code
    }).subscribe({
      next: (res) => {
        this.isTranspiling = false;
        if (res && res.success && res.translatedCode) {
          this.transpiledCode = res.translatedCode;
          this.transpiledExplanation = res.explanation;
          this.transpiledDifferences = res.keyDifferences || [];
          this.transpileProvider = res.provider;
          this.transpileModel = res.model;
          this.transpileLatency = res.latencyMs;

          this.transpileCache[tgt] = {
            code: res.translatedCode,
            explanation: res.explanation,
            differences: res.keyDifferences || [],
            provider: res.provider,
            model: res.model,
            latency: res.latencyMs
          };
        } else {
          this.showToast('⚠️ Could not convert code to ' + this.formatLanguageName(tgt));
        }
      },
      error: () => {
        this.isTranspiling = false;
        this.showToast('⚠️ Code translation request failed.');
      }
    });
  }

  applyTranspiledCode() {
    if (!this.transpiledCode) return;
    this.code = this.transpiledCode;
    this.activeLanguage = this.targetLanguage;
    const matched = this.runtimes.find(r => r.language.toLowerCase() === this.activeLanguage.toLowerCase());
    if (matched) {
      this.activeVersion = matched.version;
    }
    this.updateCode(this.code);
    this.soundService.playSuccessSound();
    this.showToast(`✅ Loaded ${this.formatLanguageName(this.targetLanguage)} code into IDE! Ready to run.`);
    this.closePolyglotModal();
  }

  copyTranspiledCode() {
    if (!this.transpiledCode) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.transpiledCode).then(() => {
        this.showToast(`📋 ${this.formatLanguageName(this.targetLanguage)} code copied to clipboard!`);
        this.soundService.playClickSound();
      });
    }
  }

  testRunTranspiledCode() {
    if (this.isTestingTranspiled || !this.transpiledCode) return;
    this.isTestingTranspiled = true;
    this.transpiledTestOutput = '⏳ Compiling & running in ' + this.formatLanguageName(this.targetLanguage) + ' sandbox...';
    this.transpiledTestStatus = 'IDLE';

    this.compilerService.executeCode({
      language: this.targetLanguage,
      code: this.transpiledCode,
      stdin: this.stdin
    }).subscribe({
      next: (res) => {
        this.isTestingTranspiled = false;
        if (res.success && res.status === 'SUCCESS') {
          this.transpiledTestStatus = 'SUCCESS';
          this.transpiledTestOutput = res.stdout ? res.stdout.trim() : '(Program executed successfully with no STDOUT output)';
          this.soundService.playSuccessSound();
        } else {
          this.transpiledTestStatus = 'ERROR';
          this.transpiledTestOutput = (res.stderr || res.compileOutput || 'Execution error in ' + this.formatLanguageName(this.targetLanguage)).trim();
        }
      },
      error: (err) => {
        this.isTestingTranspiled = false;
        this.transpiledTestStatus = 'ERROR';
        this.transpiledTestOutput = 'Execution test failed: ' + (err.message || 'Network error');
      }
    });
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
    this.soundService.playClickSound();
    this.isCompiling = true;
    this.executionStatus = 'RUNNING';
    this.outputLogs = [];
    this.stderrLogs = [];
    this.compileOutputLogs = [];
    this.lastAutoFixResult = null;
    this.highlightedFixedLines = [];

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

        if (res.success) {
          this.soundService.playSuccessSound();
        }

        if (res.stdout && res.stdout.trim().length > 0) {
          this.outputLogs = res.stdout.split('\n').filter(l => l.length > 0);
        } else if (res.success) {
          this.outputLogs = ['Program executed cleanly with no output.'];
        }

        let hasError = false;
        let errorMessage = '';

        if (res.stderr && res.stderr.trim().length > 0) {
          this.stderrLogs = res.stderr.split('\n').filter(l => l.length > 0);
          errorMessage = res.stderr;
          hasError = true;
          if (res.status === 'RUNTIME_ERROR' || res.status === 'COMPILATION_ERROR') {
            this.terminalTab = 'stderr';
          }
        }

        if (res.compileOutput && res.compileOutput.trim().length > 0) {
          this.compileOutputLogs = res.compileOutput.split('\n').filter(l => l.length > 0);
          errorMessage = (errorMessage ? errorMessage + '\n' : '') + res.compileOutput;
          hasError = true;
          if (res.status === 'COMPILATION_ERROR') {
            this.terminalTab = 'compile';
          }
        }

        if (!hasError && res.stdout) {
          this.terminalTab = 'stdout';
        }

        // When an error is detected: do NOT execute AI diagnosis and fix directly!
        // We present the error in the terminal and let the user click the "Fix Error" button.
        if (hasError && (res.status === 'RUNTIME_ERROR' || res.status === 'COMPILATION_ERROR' || !res.success)) {
          this.isTerminalCollapsed = false;
          this.showToast('⚠️ Error detected in code execution. Click "🛠️ Fix Error" to diagnose with AI.');
        }
      },
      error: (err) => {
        this.isCompiling = false;
        this.executionStatus = 'NETWORK_ERROR';
        this.stderrLogs = [err.message || 'Compiler request error.'];
        this.terminalTab = 'stderr';
        this.isTerminalCollapsed = false;
        this.showToast('⚠️ Execution error. Click "🛠️ Fix Error" to diagnose with AI.');
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
    this.lastAutoFixResult = null;
    this.highlightedFixedLines = [];
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

  // ==========================================
  // CONFIDENCE COACH METHODS
  // ==========================================
  toggleConfidenceCoach() {
    this.isConfidenceCoachActive = !this.isConfidenceCoachActive;
    if (this.isConfidenceCoachActive) {
      this.soundService.playSuccessSound();
      this.showToast('🎙️ Live Interview Confidence Coach active! Listening to speech pacing & clarity.');
      this.startSpeechAnalysis();
    } else {
      this.soundService.playClickSound();
      this.showToast('🎙️ Confidence Coach paused.');
      this.stopSpeechAnalysis();
    }
  }

  toggleCoachMinimize() {
    this.isCoachMinimized = !this.isCoachMinimized;
  }

  startSpeechAnalysis() {
    this.speechStartTime = Date.now();
    this.totalWordsSpoken = 0;
    this.speechWordsPerMinute = 125;
    this.confidenceScore = 92;
    this.coachAdvice = 'Speaking pace is great! Keep your delivery calm and thoughtful.';

    // Animate audio waveform bars
    this.audioBarInterval = setInterval(() => {
      this.audioBars = this.audioBars.map(() => Math.floor(Math.random() * 70) + 20);
    }, 180);

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognitionInstance = new SpeechRec();
        this.recognitionInstance.continuous = true;
        this.recognitionInstance.interimResults = true;
        this.recognitionInstance.lang = 'en-US';

        this.recognitionInstance.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          this.analyzeSpeechTranscript(transcript);
        };

        this.recognitionInstance.start();
      } catch (err) {
        console.warn('Speech recognition fallback active:', err);
        this.simulateSpeechPacing();
      }
    } else {
      this.simulateSpeechPacing();
    }
  }

  stopSpeechAnalysis() {
    if (this.recognitionInstance) {
      try { this.recognitionInstance.stop(); } catch (e) {}
    }
    if (this.audioBarInterval) {
      clearInterval(this.audioBarInterval);
    }
  }

  private analyzeSpeechTranscript(text: string) {
    if (!text || !text.trim()) return;
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    this.totalWordsSpoken += words.length;

    const elapsedMinutes = Math.max(0.1, (Date.now() - this.speechStartTime) / 60000);
    this.speechWordsPerMinute = Math.round(this.totalWordsSpoken / elapsedMinutes);

    if (this.speechWordsPerMinute > 160) {
      this.speechPaceStatus = 'TOO_FAST';
      this.coachAdvice = 'Speaking a bit fast — take a gentle breath between points.';
    } else if (this.speechWordsPerMinute < 95 && this.totalWordsSpoken > 5) {
      this.speechPaceStatus = 'TOO_SLOW';
      this.coachAdvice = 'Pacing is very slow — try picking up the rhythm slightly.';
    } else {
      this.speechPaceStatus = 'STEADY';
      this.coachAdvice = 'Speaking pace is nice and steady! You sound calm and articulate.';
    }

    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
    this.fillerWordList = [];
    let count = 0;
    fillers.forEach(f => {
      const regex = new RegExp('\\b' + f + '\\b', 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        count += matches.length;
        this.fillerWordList.push({ word: f, count: matches.length });
      }
    });
    this.fillerWordCount = count;

    if (this.fillerWordCount > 2) {
      this.coachAdvice = 'Filler words noticed — pause for 1 second instead, silence sounds senior!';
    }

    let score = 95 - (this.fillerWordCount * 4);
    if (this.speechPaceStatus !== 'STEADY') score -= 10;
    this.confidenceScore = Math.max(50, Math.min(99, score));
  }

  private simulateSpeechPacing() {
    let step = 0;
    const sampleWords = ['All', 'threads', 'in', 'Java', '21', 'virtual', 'threads', 'run', 'cooperatively', 'like', 'goroutines', 'basically'];
    const interval = setInterval(() => {
      if (!this.isConfidenceCoachActive) {
        clearInterval(interval);
        return;
      }
      step++;
      const text = sampleWords.slice(0, (step % sampleWords.length) + 1).join(' ');
      this.analyzeSpeechTranscript(text);
    }, 2500);
  }

  // ==========================================
  // SILENT CO-PILOT SPECTATOR METHODS
  // ==========================================
  sendKudos(emoji: string) {
    this.soundService.playClickSound();
    const id = Date.now();
    this.spectatorKudos.push({ emoji, id });
    setTimeout(() => {
      this.spectatorKudos = this.spectatorKudos.filter(k => k.id !== id);
    }, 2200);
  }

  submitSpectatorQuestion() {
    if (!this.newSpectatorQuestion.trim()) return;
    this.spectatorQuestions.unshift({
      author: this.currentUser?.name || 'Curious Spectator',
      question: this.newSpectatorQuestion.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      upvotes: 1
    });
    this.newSpectatorQuestion = '';
    this.soundService.playClickSound();
    this.showToast('💬 Spectator question posted quietly to the mentor!');
  }

  upvoteQuestion(q: any) {
    q.upvotes++;
    this.soundService.playClickSound();
  }

  // ==========================================
  // Interactive Display Area Resizing Handlers
  // ==========================================
  startHorizontalResize(event: MouseEvent) {
    event.preventDefault();
    this.isDraggingHorizontal = true;
    this.startX = event.clientX;
    this.startWidthPercent = this.splitRatioPercent;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  startVerticalResize(event: MouseEvent) {
    event.preventDefault();
    this.isDraggingVertical = true;
    this.startY = event.clientY;
    this.startTerminalHeight = this.terminalHeightPx;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDraggingHorizontal) {
      const containerWidth = this.workspaceContainer?.nativeElement?.clientWidth || window.innerWidth;
      const deltaX = event.clientX - this.startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      let newRatio = this.startWidthPercent + deltaPercent;
      // Clamp between 0% and 95% allowing slider to move completely left freely
      newRatio = Math.max(0, Math.min(95, newRatio));
      this.splitRatioPercent = Math.round(newRatio);
    } else if (this.isDraggingVertical) {
      // Dragging upward increases terminal height, dragging down decreases it
      const deltaY = this.startY - event.clientY;
      let newHeight = this.startTerminalHeight + deltaY;
      // Clamp between 80px and 500px
      newHeight = Math.max(80, Math.min(500, newHeight));
      this.terminalHeightPx = Math.round(newHeight);
      this.isTerminalCollapsed = false;
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.isDraggingHorizontal || this.isDraggingVertical) {
      this.isDraggingHorizontal = false;
      this.isDraggingVertical = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  setLayoutPreset(ratio: number) {
    this.splitRatioPercent = ratio;
    this.isEditorMaximized = false;
  }

  toggleTerminalCollapse() {
    this.isTerminalCollapsed = !this.isTerminalCollapsed;
  }

  resetLayout() {
    this.splitRatioPercent = 65;
    this.terminalHeightPx = 185;
    this.isTerminalCollapsed = false;
    this.isEditorMaximized = false;
  }
}
