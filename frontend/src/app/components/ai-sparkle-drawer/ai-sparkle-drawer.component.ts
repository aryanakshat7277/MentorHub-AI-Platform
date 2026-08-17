import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-sparkle-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-sparkle-drawer.component.html',
  styleUrls: ['./ai-sparkle-drawer.component.scss']
})
export class AiSparkleDrawerComponent {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  userPrompt = '';
  isGenerating = false;

  messages: { sender: 'user' | 'ai'; text: string; time: string }[] = [
    {
      sender: 'ai',
      text: 'Greetings AKSHAT ARYAN! I am your MentorHub Neural AI Assistant. How can I optimize your mentoring journey today?',
      time: '13:58:40'
    }
  ];

  suggestedPrompts = [
    '🎯 Check session schedule with KRITI SAGAR, PAVANI, & VANAJA',
    '📜 Generate certificate for Angular 17 Architecture',
    '📊 Analyze weekly mentoring streak & XP velocity',
    '💻 Open real-time workspace with mentor AKSHAT ARYAN'
  ];

  selectPrompt(promptText: string) {
    this.userPrompt = promptText;
    this.sendPrompt();
  }

  sendPrompt() {
    if (!this.userPrompt.trim()) return;

    const userText = this.userPrompt;
    this.messages.push({
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    this.userPrompt = '';
    this.isGenerating = true;

    setTimeout(() => {
      this.isGenerating = false;
      let reply = 'I have analyzed your query across your mentor network and skill matrix.';

      if (userText.includes('Match') || userText.includes('mentor') || userText.includes('session')) {
        reply = 'AKSHAT ARYAN (99.8% Compatibility) is available for instant 1-on-1 sessions in Spring Boot 3 and Angular 17 for scholars KRITI SAGAR, PAVANI, and VANAJA.';
      } else if (userText.includes('certificate') || userText.includes('Certificate')) {
        reply = 'Your verified AI Architecture Certificate (MH-CERT-9921-X) issued by AKSHAT ARYAN to KRITI SAGAR is valid! You can view and download the PDF from the Certificates section.';
      } else if (userText.includes('streak') || userText.includes('XP')) {
        reply = 'You are currently on a 32-day streak 🔥 with 4,890 XP Points! Master Mentor Level 8 active!';
      } else if (userText.includes('workspace')) {
        reply = 'Redirecting to Live Workspace session #1 with active WebSocket code compiler...';
      }

      this.messages.push({
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }, 900);
  }

  close() {
    this.closeDrawer.emit();
  }
}
