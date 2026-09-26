import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import html2canvas from 'html2canvas';

export interface ScreenCaptureResult {
  imageBase64: string; // Pure Base64 without data: prefix
  imageMimeType: string;
  dataUrl: string; // Full data:image/jpeg;base64,...
  route: string;
  semanticContext: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppScreenReaderService {
  public isScreenPerceptionEnabled$ = new BehaviorSubject<boolean>(true);
  public isCapturing$ = new BehaviorSubject<boolean>(false);
  public lastCapture$ = new BehaviorSubject<ScreenCaptureResult | null>(null);

  // Live Screen Capture API Stream (Reads Entire Screen / Any Window outside the project)
  public activeDisplayStream: MediaStream | null = null;
  public isExternalScreenActive$ = new BehaviorSubject<boolean>(false);
  private sharedVideoEl: HTMLVideoElement | null = null;

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {}

  public toggleScreenPerception(): boolean {
    const nextState = !this.isScreenPerceptionEnabled$.value;
    this.isScreenPerceptionEnabled$.next(nextState);
    return nextState;
  }

  public setScreenPerception(enabled: boolean): void {
    this.isScreenPerceptionEnabled$.next(enabled);
  }

  /**
   * Prompts user to share their Entire Screen, Window (e.g. VS Code, Terminal), or Browser Tab
   * Allows Gemini 3.1 Flash-Lite to read screens outside of this project.
   */
  public async startExternalScreenCapture(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      console.warn('Screen Capture API is not supported in this browser.');
      return false;
    }

    try {
      if (this.activeDisplayStream && this.activeDisplayStream.active) {
        return true;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          cursor: 'always'
        } as any,
        audio: false
      });

      this.activeDisplayStream = stream;
      this.isExternalScreenActive$.next(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopExternalScreenCapture();
        };
      }

      if (!this.sharedVideoEl && typeof document !== 'undefined') {
        this.sharedVideoEl = document.createElement('video');
        this.sharedVideoEl.muted = true;
        this.sharedVideoEl.playsInline = true;
      }
      if (this.sharedVideoEl) {
        this.sharedVideoEl.srcObject = stream;
        await this.sharedVideoEl.play().catch(e => console.warn('Display video play warning:', e));
      }

      return true;
    } catch (e) {
      console.warn('Screen Capture permission cancelled or denied:', e);
      this.isExternalScreenActive$.next(false);
      return false;
    }
  }

  public stopExternalScreenCapture(): void {
    if (this.activeDisplayStream) {
      this.activeDisplayStream.getTracks().forEach(t => t.stop());
      this.activeDisplayStream = null;
    }
    if (this.sharedVideoEl) {
      this.sharedVideoEl.srcObject = null;
    }
    this.isExternalScreenActive$.next(false);
  }

  public toggleExternalScreenCapture(): Promise<boolean> {
    if (this.activeDisplayStream && this.activeDisplayStream.active) {
      this.stopExternalScreenCapture();
      return Promise.resolve(false);
    } else {
      return this.startExternalScreenCapture();
    }
  }

  /**
   * Grabs a high-definition frame from the active external Screen Capture stream
   */
  private async captureExternalStreamFrame(): Promise<ScreenCaptureResult | null> {
    if (!this.activeDisplayStream || !this.activeDisplayStream.active) {
      return null;
    }

    if (!this.sharedVideoEl && typeof document !== 'undefined') {
      this.sharedVideoEl = document.createElement('video');
      this.sharedVideoEl.muted = true;
      this.sharedVideoEl.playsInline = true;
    }

    if (this.sharedVideoEl) {
      if (this.sharedVideoEl.srcObject !== this.activeDisplayStream) {
        this.sharedVideoEl.srcObject = this.activeDisplayStream;
        await this.sharedVideoEl.play().catch(e => console.warn(e));
      }

      const video = this.sharedVideoEl;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;

      const canvas = document.createElement('canvas');
      let targetWidth = width;
      let targetHeight = height;
      const maxWidth = 1280;
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        targetWidth = maxWidth;
        targetHeight = Math.round(height * ratio);
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const pureBase64 = dataUrl.startsWith('data:image/jpeg;base64,') ? dataUrl.substring('data:image/jpeg;base64,'.length) : '';

      return {
        imageBase64: pureBase64,
        imageMimeType: 'image/jpeg',
        dataUrl,
        route: 'External OS Screen / Any Window',
        semanticContext: 'EXTERNAL ACTIVE SCREEN VIEW (OUTSIDE PROJECT): Real-time visual screen capture of user desktop, external IDE (e.g. VS Code), terminal, browser, or document outside this project.',
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Captures the visible application viewport or live external desktop screen
   * Reads visual snapshot and semantic DOM context.
   */
  public async captureScreen(): Promise<ScreenCaptureResult | null> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }

    this.isCapturing$.next(true);

    // 1. If external screen capture is active, grab live external desktop/window frame directly!
    if (this.activeDisplayStream && this.activeDisplayStream.active) {
      try {
        const externalResult = await this.captureExternalStreamFrame();
        if (externalResult && externalResult.imageBase64 && externalResult.imageBase64.length > 50) {
          this.isCapturing$.next(false);
          this.lastCapture$.next(externalResult);
          return externalResult;
        }
      } catch (err) {
        console.warn('Failed capturing external frame, falling back to in-app capture:', err);
      }
    }

    // 1. Temporarily hide chat drawer overlay elements so snapshot captures the underlying screen
    const chatDrawer = document.querySelector('.chatbot-drawer') as HTMLElement | null;
    const chatOverlay = document.querySelector('.chatbot-overlay') as HTMLElement | null;
    const prevDrawerDisplay = chatDrawer ? chatDrawer.style.visibility : '';
    const prevOverlayDisplay = chatOverlay ? chatOverlay.style.visibility : '';

    if (chatDrawer) chatDrawer.style.visibility = 'hidden';
    if (chatOverlay) chatOverlay.style.visibility = 'hidden';

    try {
      // Find the primary viewport element
      const targetElement =
        (document.querySelector('.page-content') as HTMLElement) ||
        (document.querySelector('.main-wrapper') as HTMLElement) ||
        (document.querySelector('main') as HTMLElement) ||
        document.body;

      // Render high-performance lightweight canvas
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 1.25),
        backgroundColor: '#FAF4EE',
        ignoreElements: (el) => {
          return (
            el.classList.contains('chatbot-drawer') ||
            el.classList.contains('chatbot-overlay') ||
            el.classList.contains('floating-sparkle-btn') ||
            el.classList.contains('cursor-laser')
          );
        }
      });

      // Scale down to max 1280px width to keep payload ultralight
      let finalCanvas = canvas;
      const maxWidth = 1280;
      if (canvas.width > maxWidth) {
        const ratio = maxWidth / canvas.width;
        const resized = document.createElement('canvas');
        resized.width = maxWidth;
        resized.height = Math.round(canvas.height * ratio);
        const ctx = resized.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
          finalCanvas = resized;
        }
      }

      let pureBase64 = '';
      let dataUrl = '';

      if (finalCanvas && finalCanvas.width > 20 && finalCanvas.height > 20) {
        try {
          const quality = 0.82;
          const rawUrl = finalCanvas.toDataURL('image/jpeg', quality);
          if (rawUrl && rawUrl.startsWith('data:image/jpeg;base64,') && rawUrl.length > 100) {
            dataUrl = rawUrl;
            pureBase64 = rawUrl.substring('data:image/jpeg;base64,'.length);
          }
        } catch (e) {
          console.warn('AppScreenReaderService: Canvas toDataURL failed:', e);
        }
      }

      // 2. Extract structured DOM semantic context
      const route = this.router.url || '/';
      const semanticContext = this.extractSemanticContext(route);

      const result: ScreenCaptureResult = {
        imageBase64: pureBase64,
        imageMimeType: 'image/jpeg',
        dataUrl,
        route,
        semanticContext,
        timestamp: Date.now()
      };

      this.lastCapture$.next(result);
      return result;
    } catch (err) {
      console.warn('AppScreenReaderService capture error:', err);
      // Fallback: return semantic DOM context even if canvas capture has an issue
      const route = this.router.url || '/';
      const semanticContext = this.extractSemanticContext(route);
      return {
        imageBase64: '',
        imageMimeType: 'image/jpeg',
        dataUrl: '',
        route,
        semanticContext,
        timestamp: Date.now()
      };
    } finally {
      // Restore drawer visibility
      if (chatDrawer) chatDrawer.style.visibility = prevDrawerDisplay;
      if (chatOverlay) chatOverlay.style.visibility = prevOverlayDisplay;
      this.isCapturing$.next(false);
    }
  }

  /**
   * Scrapes structured semantic metadata directly from the active DOM.
   * This provides the AI with 100% exact text knowledge of what is displayed.
   */
  public extractSemanticContext(route: string): string {
    if (typeof document === 'undefined') return `[Active Route: ${route}]`;

    const lines: string[] = [];
    lines.push(`[ACTIVE SCREEN VIEW: ${route}]`);

    // 1. CUTM Courses Page Context
    if (route.includes('cutm-courses')) {
      lines.push('--- PAGE: Centurion University (CUTM) Courseware Repository ---');
      const activeCategory = document.querySelector('.category-pill.active, .cat-btn.active')?.textContent?.trim();
      if (activeCategory) lines.push(`Selected Category: ${activeCategory}`);

      const searchInput = (document.querySelector('.search-input, input[type="text"]') as HTMLInputElement)?.value;
      if (searchInput) lines.push(`Active Search Filter: "${searchInput}"`);

      // Read visible course cards on screen
      const courseCards = Array.from(document.querySelectorAll('.course-card, .catalog-card')).slice(0, 8);
      if (courseCards.length > 0) {
        lines.push(`Visible Courses on Screen (${courseCards.length}):`);
        courseCards.forEach((card, idx) => {
          const code = card.querySelector('.course-code, .code-badge')?.textContent?.trim() || '';
          const title = card.querySelector('.course-title, h3, h4')?.textContent?.trim() || '';
          const category = card.querySelector('.category-badge, .cat-tag')?.textContent?.trim() || '';
          const faculty = card.querySelector('.faculty-name, .instructor-name, .faculty-badge')?.textContent?.trim() || '';
          const credits = card.querySelector('.credits-badge, .credit-tag')?.textContent?.trim() || '';
          lines.push(`  ${idx + 1}. [${code}] ${title} | ${category} | ${credits} | Faculty: ${faculty}`);
        });
      }

      // Check if Course Details Modal is open
      const courseModal = document.querySelector('.course-detail-modal, .course-modal-window');
      if (courseModal) {
        const modalTitle = courseModal.querySelector('h2, h3')?.textContent?.trim();
        const modalDesc = courseModal.querySelector('.modal-course-title, .course-statement-box p')?.textContent?.trim();
        lines.push(`[OPEN COURSE DETAILS MODAL] Viewing Details for: ${modalTitle}`);
        if (modalDesc) lines.push(`Description: ${modalDesc.slice(0, 300)}...`);
      }
    }

    // 2. Collaborative Code Workspace Context
    else if (route.includes('workspace')) {
      lines.push('--- PAGE: Real-Time Collaborative Code Workspace ---');
      const activeTab = document.querySelector('.file-tab.active, .tab-active')?.textContent?.trim();
      if (activeTab) lines.push(`Active File: ${activeTab}`);

      const langSelect = (document.querySelector('.lang-select, select[name="language"]') as HTMLSelectElement)?.value;
      if (langSelect) lines.push(`Programming Language: ${langSelect}`);

      // Read code content from active editor
      const codeEditor = (document.querySelector('.code-textarea, textarea.editor-area, .monaco-editor') as HTMLTextAreaElement);
      if (codeEditor && codeEditor.value) {
        const codeSnippet = codeEditor.value.slice(0, 1500);
        lines.push(`Active Code in Editor:\n\`\`\`\n${codeSnippet}\n\`\`\``);
      }

      // Read terminal / compiler output
      const termOutput = document.querySelector('.terminal-output, .output-terminal pre')?.textContent?.trim();
      if (termOutput) {
        lines.push(`Compiler Output:\n${termOutput.slice(0, 500)}`);
      }
    }

    // 3. AI Mock Viva Defense Context
    else if (route.includes('mock-viva')) {
      lines.push('--- PAGE: AI Mock Viva Defense Arena ---');
      const step = document.querySelector('.viva-step-badge, .arena-status-pill')?.textContent?.trim();
      if (step) lines.push(`Exam Stage: ${step}`);

      const track = document.querySelector('.selected-track-name, .track-header h2')?.textContent?.trim();
      if (track) lines.push(`Selected Track: ${track}`);

      const questionText = document.querySelector('.current-question-text, .question-card h3, .viva-q-text')?.textContent?.trim();
      if (questionText) lines.push(`Active Viva Question: "${questionText}"`);

      const examiner = document.querySelector('.examiner-name, .persona-card.active .name')?.textContent?.trim();
      if (examiner) lines.push(`Active Examiner Panel: ${examiner}`);

      const scoreText = document.querySelector('.overall-score-pill, .score-value')?.textContent?.trim();
      if (scoreText) lines.push(`Current Defense Score: ${scoreText}`);
    }

    // 4. SMART Goals Tracker Context
    else if (route.includes('goals')) {
      lines.push('--- PAGE: SMART Goal Tracker ---');
      const goalCards = Array.from(document.querySelectorAll('.goal-card, .goal-item')).slice(0, 6);
      if (goalCards.length > 0) {
        lines.push(`Active Goals Displayed (${goalCards.length}):`);
        goalCards.forEach((g, idx) => {
          const title = g.querySelector('.goal-title, h4')?.textContent?.trim();
          const progress = g.querySelector('.progress-pct, .percent-text')?.textContent?.trim();
          const status = g.querySelector('.status-badge')?.textContent?.trim();
          lines.push(`  ${idx + 1}. ${title} (Progress: ${progress}, Status: ${status})`);
        });
      }
    }

    // 5. Certificates & Verification Context
    else if (route.includes('certificate')) {
      lines.push('--- PAGE: Verified Credentials & Certification ---');
      const certCards = Array.from(document.querySelectorAll('.cert-card, .certificate-wrapper')).slice(0, 4);
      if (certCards.length > 0) {
        certCards.forEach((c, idx) => {
          const certCode = c.querySelector('.cert-id, .verification-code, .cert-code')?.textContent?.trim();
          const recipient = c.querySelector('.student-name, .cert-recipient')?.textContent?.trim();
          const track = c.querySelector('.cert-track, .course-name')?.textContent?.trim();
          lines.push(`  ${idx + 1}. [${certCode}] ${track} awarded to ${recipient}`);
        });
      }
    }

    // 6. Dashboard Context
    else if (route.includes('dashboard')) {
      lines.push('--- PAGE: Executive Command Dashboard ---');
      const metricCards = Array.from(document.querySelectorAll('.metric-card, .stat-tile')).slice(0, 6);
      if (metricCards.length > 0) {
        lines.push('Key Metrics:');
        metricCards.forEach(m => {
          const label = m.querySelector('.metric-label, .stat-title')?.textContent?.trim();
          const val = m.querySelector('.metric-value, .stat-number')?.textContent?.trim();
          if (label && val) lines.push(`  • ${label}: ${val}`);
        });
      }
    }

    // General fallback: gather primary headings and cards
    const mainHeadings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent?.trim())
      .filter(t => t && t.length > 3 && !t.includes('MENTORHUB AI'))
      .slice(0, 6);

    if (mainHeadings.length > 0 && lines.length <= 2) {
      lines.push(`Key Headings Visible: ${mainHeadings.join(' | ')}`);
    }

    return lines.join('\n');
  }
}
