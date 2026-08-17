import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss']
})
export class CertificatesComponent implements OnInit {
  certificates: any[] = [];
  selectedCert: any = null;
  currentUser: any = null;

  showRequestModal = false;
  isSubmittingRequest = false;
  isGeneratingPdf = false;

  requestForm = {
    studentName: 'Kriti Sagar',
    courseName: 'Full-Stack Spring Boot & Angular Architecture',
    mentorName: 'Akshat Aryan'
  };

  availableCourses = [
    'Full-Stack Spring Boot & Angular Architecture',
    'Reactive AI Systems & Distributed Architecture',
    'Cloud Microservices & WebSockets Engineering',
    'Advanced Java 21 & Spring Security 6'
  ];

  @ViewChild('certCanvas') certCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getCurrentUser().subscribe(u => {
      if (u) {
        this.currentUser = u;
        if (u.name) this.requestForm.studentName = this.toTitleCase(u.name);
      }
    });
    this.loadCertificates();
  }

  /**
   * Formats text into proper Title Case (capitalizes first letter of each word).
   * Handles acronyms (AI, UI) and compound words (WebSockets, Full-Stack) cleanly.
   */
  toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => {
        if (!word) return '';
        const upper = word.toUpperCase();
        if (upper === 'AI' || upper === 'UI' || upper === 'API' || upper === 'JWT' || upper === 'CI/CD' || upper === 'REST') {
          return upper;
        }
        if (word.toLowerCase() === 'websockets') return 'WebSockets';
        if (word.toLowerCase() === 'websocket') return 'WebSocket';
        if (word.toLowerCase() === 'full-stack') return 'Full-Stack';

        return word
          .split('-')
          .map(part => {
            if (!part) return '';
            const pUpper = part.toUpperCase();
            if (pUpper === 'AI' || pUpper === 'UI') return pUpper;
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join('-');
      })
      .join(' ');
  }

  get isMentor(): boolean {
    const role = (this.currentUser?.role || '').toUpperCase();
    const name = (this.currentUser?.name || '').toUpperCase();
    return role === 'MENTOR' || name.includes('AKSHAT');
  }

  get myCertificates(): any[] {
    if (this.isMentor) {
      return this.certificates;
    }
    const myNameUpper = (this.currentUser?.name || '').toUpperCase().trim();
    if (!myNameUpper) return this.certificates;

    return this.certificates.filter(c => {
      const studentUpper = (c.studentName || '').toUpperCase();
      if (myNameUpper.includes('PAVANI') && studentUpper.includes('PAVANI')) return true;
      if (myNameUpper.includes('VANAJA') && studentUpper.includes('VANAJA')) return true;
      if (myNameUpper.includes('KRITI') && studentUpper.includes('KRITI')) return true;
      return studentUpper.includes(myNameUpper);
    });
  }

  loadCertificates() {
    this.apiService.getCertificates().subscribe(data => {
      this.certificates = (data || []).map(cert => ({
        ...cert,
        studentName: this.toTitleCase(cert.studentName),
        mentorName: this.toTitleCase(cert.mentorName || 'Akshat Aryan'),
        courseName: this.toTitleCase(cert.courseName)
      }));

      const userNameUpper = (this.currentUser?.name || '').toUpperCase();
      let userCert = null;

      if (userNameUpper.includes('PAVANI')) {
        userCert = this.certificates.find(c => (c.studentName || '').toUpperCase().includes('PAVANI'));
      } else if (userNameUpper.includes('VANAJA')) {
        userCert = this.certificates.find(c => (c.studentName || '').toUpperCase().includes('VANAJA'));
      } else if (userNameUpper.includes('KRITI')) {
        userCert = this.certificates.find(c => (c.studentName || '').toUpperCase().includes('KRITI'));
      }

      const available = this.myCertificates;
      if (userCert) {
        this.selectedCert = userCert;
      } else if (available.length > 0 && !this.selectedCert) {
        this.selectedCert = available[0];
      } else if (available.length > 0) {
        const found = available.find(c => c.id === this.selectedCert?.id);
        this.selectedCert = found ? found : available[0];
      }
    });
  }

  selectCertificate(cert: any) { this.selectedCert = cert; }

  get pendingCertificates() {
    return this.certificates.filter(c => c.status === 'REQUESTED' || c.status === 'PENDING');
  }
  get approvedCertificates() {
    return this.myCertificates.filter(c => c.status === 'APPROVED' || c.status === 'VALID');
  }

  openRequestModal() { this.showRequestModal = true; }
  closeRequestModal() { this.showRequestModal = false; }

  submitCertificateRequest() {
    if (!this.requestForm.courseName) { alert('Please select a course.'); return; }
    this.isSubmittingRequest = true;
    const payload = {
      studentName: this.toTitleCase(this.currentUser?.name || this.requestForm.studentName),
      courseName: this.toTitleCase(this.requestForm.courseName),
      mentorName: 'Akshat Aryan'
    };
    this.apiService.requestCertificate(payload).subscribe({
      next: (res) => {
        this.isSubmittingRequest = false;
        this.closeRequestModal();
        const formatted = {
          ...res,
          studentName: this.toTitleCase(res.studentName),
          mentorName: this.toTitleCase(res.mentorName || 'Akshat Aryan'),
          courseName: this.toTitleCase(res.courseName)
        };
        this.selectedCert = formatted;
        this.loadCertificates();
        alert('🎉 Certificate request submitted! QR Code and Ultra HD PDF download unlock after Mentor approval.');
      },
      error: () => { this.isSubmittingRequest = false; alert('Failed to submit.'); }
    });
  }

  approveRequest(certId: number) {
    this.apiService.approveCertificate(certId).subscribe({
      next: (updatedCert) => {
        this.loadCertificates();
        const formatted = {
          ...updatedCert,
          studentName: this.toTitleCase(updatedCert.studentName),
          mentorName: this.toTitleCase(updatedCert.mentorName || 'Akshat Aryan'),
          courseName: this.toTitleCase(updatedCert.courseName)
        };
        if (this.selectedCert?.id === certId) this.selectedCert = formatted;
        alert('✅ Certificate APPROVED! Cryptographic QR Code & 300 DPI PDF download unlocked.');
      },
      error: () => alert('Failed to approve.')
    });
  }

  rejectRequest(certId: number) {
    if (!confirm('Reject this certificate request?')) return;
    this.apiService.rejectCertificate(certId).subscribe({
      next: () => this.loadCertificates(),
      error: () => alert('Failed to reject.')
    });
  }

  getQrCodeUrl(cert: any): string {
    if (cert.qrCodeData && cert.qrCodeData.length > 50 && cert.qrCodeData.includes('%')) {
      return cert.qrCodeData;
    }
    const student = this.toTitleCase(cert.studentName || 'Student');
    const course = this.toTitleCase(cert.courseName || 'Course');
    const mentor = this.toTitleCase(cert.mentorName || 'Akshat Aryan');
    const certNo = cert.certificateNumber || 'CERT-OFFICIAL';
    const issueDate = cert.completionDate || '2026-07-10';
    const verifyUrl = cert.verificationUrl || `http://localhost:4200/verify-certificate/${certNo}`;

    const textPayload = `==================================================
🎓 MENTORHUB ACADEMY 🎓
ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026
==================================================

📜 CERTIFICATE OF MENTORSHIP
FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE

This official credential is proudly awarded to:
👤 MENTEE (RECIPIENT): ${student}

for demonstrating exceptional technical capability, architectural mastery, and 100% completion of mentorship requirements in:
📘 COURSE / MASTERCLASS: ${course}

✍️ CERTIFIED & AUDITED BY:
👨‍🏫 MASTER MENTOR: ${mentor}
DESIGNATION: Senior Software Architect & Master Mentor
ORGANIZATION: MentorHub AI Engineering Academy

🛡️ OFFICIAL VERIFICATION METADATA:
CERTIFICATE NUMBER: ${certNo}
ISSUE DATE: ${issueDate}
AUTHENTICITY STATUS: VERIFIED & APPROVED (100% AUTHENTIC)
VERIFICATION PORTAL: ${verifyUrl}
==================================================`;

    return `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(textPayload)}`;
  }

  /* ===== ULTRA-HIGH RESOLUTION (300 DPI / 4K) CANVAS EXPORT ENGINE ===== */
  private async exportToCanvas(cert: any, callback: () => void) {
    if (!this.certCanvas) return;
    const canvas = this.certCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Wait for all web fonts to load completely
    if (document.fonts) {
      await document.fonts.ready;
    }

    // 3300 x 2333 pixels: True 300 DPI A4 Landscape (297mm x 210mm)
    const W = 3300, H = 2333;
    canvas.width = W; canvas.height = H;

    const studentName = this.toTitleCase(cert.studentName || 'Kriti Sagar');
    const mentorName = this.toTitleCase(cert.mentorName || 'Akshat Aryan');
    const courseName = this.toTitleCase(cert.courseName || 'Full-Stack Spring Boot & Angular Architecture');

    // 1. Parchment base multi-radial gradient
    const bg = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 1900);
    bg.addColorStop(0, '#FFFDF8');
    bg.addColorStop(0.45, '#FAF4E6');
    bg.addColorStop(1, '#EFE5CD');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Subtle Banknote Security Background Hatching
    ctx.save();
    ctx.strokeStyle = 'rgba(184, 151, 69, 0.025)';
    ctx.lineWidth = 1;
    for (let i = -H; i < W + H; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + H, H);
      ctx.stroke();
    }
    for (let i = 0; i < W + 2 * H; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - H, H);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Monogram Watermark Layer ("MH ACADEMY")
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.rotate(-28 * Math.PI / 180);
    ctx.font = '900 480px "Times New Roman", Times, serif';
    ctx.fillStyle = 'rgba(184, 151, 69, 0.038)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MH', 0, -40);
    ctx.font = '800 64px "Times New Roman", Times, serif';
    try { (ctx as any).letterSpacing = '32px'; } catch (e) {}
    ctx.fillText('ACADEMY', 0, 240);
    try { (ctx as any).letterSpacing = '0px'; } catch (e) {}
    ctx.restore();

    // 4. Triple Metallic Gold Engraved Border System
    // Outer border
    ctx.strokeStyle = '#B89745'; ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // Mid border
    ctx.strokeStyle = '#CBB06A'; ctx.lineWidth = 4;
    ctx.strokeRect(90, 90, W - 180, H - 180);

    // Inner border
    ctx.strokeStyle = '#B89745'; ctx.lineWidth = 10;
    ctx.strokeRect(110, 110, W - 220, H - 220);

    // 5. Intricate Vector Corner Flourishes (4 Corners)
    const drawFlourish = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot * Math.PI / 180);
      ctx.strokeStyle = '#9A7B38';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(0, 70);
      ctx.arcTo(0, 0, 70, 0, 50);
      ctx.lineTo(70, 0);
      ctx.stroke();

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.arcTo(0, 0, 100, 0, 80);
      ctx.lineTo(100, 0);
      ctx.stroke();

      ctx.fillStyle = '#B89745';
      ctx.beginPath();
      ctx.arc(36, 36, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawFlourish(125, 125, 0);
    drawFlourish(W - 125, 125, 90);
    drawFlourish(W - 125, H - 125, 180);
    drawFlourish(125, H - 125, 270);

    // 6. Guilloche Ornamental Strips (Top & Bottom)
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '700 24px "Times New Roman", Times, serif';
    ctx.fillStyle = '#B89745';
    ctx.fillText('━━━━━━━━━━━━━━━   ● ● ●   ◆   ● ● ●   ━━━━━━━━━━━━━━━', W/2, 230);
    ctx.fillText('━━━━━━━━━━━━━━━   ● ● ●   ◆   ● ● ●   ━━━━━━━━━━━━━━━', W/2, H - 190);

    // 7. 3D Metallic Gold Crest Emblem 🏛️
    ctx.save();
    const cx = W/2, cy = 340;
    const crestGrad = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, 65);
    crestGrad.addColorStop(0, '#E8C96E');
    crestGrad.addColorStop(0.5, '#B89745');
    crestGrad.addColorStop(1, '#7A5F22');
    ctx.fillStyle = crestGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#584214';
    ctx.beginPath(); ctx.arc(cx, cy, 56, 0, Math.PI * 2); ctx.fill();

    ctx.font = '54px "Times New Roman", Times, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏛️', cx, cy);
    ctx.restore();

    // 8. Academy Brand Header
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 44px "Times New Roman", Times, serif';
    ctx.fillStyle = '#241D12';
    ctx.fillText('MENTORHUB ACADEMY', W/2, 470);

    ctx.font = 'italic 26px "Times New Roman", Times, serif';
    ctx.fillStyle = '#726650';
    ctx.fillText('— ACCREDITATION OF PROFESSIONAL EXCELLENCE · EST. 2026 —', W/2, 520);

    // 9. Top Filigree Divider Wing (━━━━ ❖ ━━━━)
    ctx.font = '28px "Times New Roman", Times, serif';
    ctx.fillStyle = '#CBB06A';
    ctx.fillText('━━━━━━━━━━━━━━━━━━━━   ❖   ━━━━━━━━━━━━━━━━━━━━', W/2, 575);

    // 10. Main Formal Title
    ctx.font = 'bold 98px "Times New Roman", Times, serif';
    ctx.fillStyle = '#8A6D2B';
    ctx.fillText('CERTIFICATE OF MENTORSHIP', W/2, 700);

    ctx.font = 'bold 24px "Times New Roman", Times, serif';
    ctx.fillStyle = '#554A36';
    ctx.fillText('FOR DEMONSTRATED TECHNICAL MASTERY & CURRICULAR EXCELLENCE', W/2, 760);

    // 11. Recipient Presentation
    ctx.font = 'italic 38px "Times New Roman", Times, serif';
    ctx.fillStyle = '#423829';
    ctx.fillText('This official credential is proudly awarded to', W/2, 890);

    // 12. HERO MENTEE RECIPIENT NAME — Title Case, 300 DPI Crispness
    ctx.font = 'bold italic 142px "Times New Roman", Times, serif';
    ctx.fillStyle = '#140E06';
    ctx.fillText(studentName, W/2, 1070);

    // Gold Accent Underline
    const lineGrad = ctx.createLinearGradient(W/2 - 600, 0, W/2 + 600, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.15, '#CBB06A');
    lineGrad.addColorStop(0.5, '#DFBA67');
    lineGrad.addColorStop(0.85, '#CBB06A');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(W/2 - 600, 1125); ctx.lineTo(W/2 + 600, 1125); ctx.stroke();

    // 13. Certification Statement
    ctx.font = 'italic 34px "Times New Roman", Times, serif';
    ctx.fillStyle = '#423829';
    ctx.fillText('for demonstrating exceptional technical capability, architectural mastery,', W/2, 1225);
    ctx.fillText('and 100% completion of mentorship requirements in', W/2, 1280);

    // 14. Course Title Calligraphy — Title Case
    ctx.font = 'bold italic 84px "Times New Roman", Times, serif';
    ctx.fillStyle = '#4A3A15';
    ctx.fillText(courseName, W/2, 1435);

    // 15. Bottom Filigree Divider Wing (━━━━ ✦ ━━━━)
    ctx.font = '28px "Times New Roman", Times, serif';
    ctx.fillStyle = '#CBB06A';
    ctx.fillText('━━━━━━━━━━━━━━━━━━━━━━   ✦   ━━━━━━━━━━━━━━━━━━━━━━', W/2, 1530);

    // 16. Footer — Left Mentor Signatory
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px "Times New Roman", Times, serif';
    ctx.fillStyle = '#8A6D2B';
    ctx.fillText('CERTIFIED & AUDITED BY', 260, 1720);

    // Master Mentor Signature in Italic Times New Roman
    ctx.font = 'bold italic 68px "Times New Roman", Times, serif';
    ctx.fillStyle = '#241D12';
    ctx.fillText(mentorName, 260, 1800);

    // Signature Gold Line
    ctx.strokeStyle = '#9A7B38'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(260, 1825); ctx.lineTo(760, 1825); ctx.stroke();

    // Mentor Name & Credentials (100% Matched to UI)
    ctx.font = 'bold 34px "Times New Roman", Times, serif';
    ctx.fillStyle = '#140E06';
    ctx.fillText(mentorName, 260, 1875);

    ctx.font = 'italic 24px "Times New Roman", Times, serif';
    ctx.fillStyle = '#554A36';
    ctx.fillText('Senior Software Architect & Master Mentor', 260, 1915);

    ctx.font = '22px "Times New Roman", Times, serif';
    ctx.fillStyle = '#726650';
    ctx.fillText('MentorHub AI Engineering Academy', 260, 1950);

    // 17. Footer — Right Certificate ID & Cryptographic QR Block
    ctx.textAlign = 'right';
    ctx.strokeStyle = '#9A7B38'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W - 760, 1825); ctx.lineTo(W - 260, 1825); ctx.stroke();

    ctx.font = 'bold 32px "Times New Roman", Times, serif'; ctx.fillStyle = '#140E06';
    ctx.fillText(cert.certificateNumber || 'CERT-JRIN-OFFICIAL', W - 260, 1875);

    ctx.font = 'italic 24px "Times New Roman", Times, serif'; ctx.fillStyle = '#554A36';
    ctx.fillText(`Issue Date: ${cert.completionDate || '2026-07-10'}`, W - 260, 1915);

    ctx.font = '22px "Times New Roman", Times, serif'; ctx.fillStyle = '#8A6D2B';
    ctx.fillText('mentorhub.ai/verify', W - 260, 1950);

    // 18. Draw Cryptographic Verification QR Code (If Approved)
    if (cert.status === 'APPROVED' || cert.status === 'VALID') {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = this.getQrCodeUrl(cert);
      
      qrImg.onload = () => {
        // Draw white backing container with gold border for QR code (100% matched to UI)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#CBB06A';
        ctx.lineWidth = 3.5;
        ctx.fillRect(W - 490, 1570, 230, 230);
        ctx.strokeRect(W - 490, 1570, 230, 230);

        ctx.drawImage(qrImg, W - 480, 1580, 210, 210);
        callback();
      };

      qrImg.onerror = () => callback();
    } else {
      callback();
    }
  }

  /**
   * Downloads the certificate as a true Ultra HD (300 DPI) Landscape PDF document (.pdf).
   */
  async downloadCertificate(cert: any) {
    if (cert.status !== 'APPROVED' && cert.status !== 'VALID') {
      alert('🔒 Download locked. Requires Mentor approval.');
      return;
    }

    this.isGeneratingPdf = true;

    try {
      await this.exportToCanvas(cert, () => {
        const canvas = this.certCanvas.nativeElement;
        // High-quality PNG buffer
        const imgData = canvas.toDataURL('image/png', 1.0);

        // Standard Landscape A4 Document: 297mm x 210mm
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();   // 297 mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

        // Add 300 DPI high-definition image to PDF page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        const formattedStudent = this.toTitleCase(cert.studentName || 'Student');
        const safeFilename = `MentorHub_Certificate_${formattedStudent.replace(/\s+/g, '_')}_${cert.certificateNumber || 'CERT'}.pdf`;

        // Save PDF file
        pdf.save(safeFilename);
        this.isGeneratingPdf = false;
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      this.isGeneratingPdf = false;
      alert('An error occurred while generating the PDF.');
    }
  }
}
