import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-certificate.component.html',
  styleUrls: ['./verify-certificate.component.scss']
})
export class VerifyCertificateComponent implements OnInit {
  certId = '';
  certificate: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.certId = this.route.snapshot.paramMap.get('id') || 'MH-CERT-9921-X';
    this.apiService.verifyCertificate(this.certId).subscribe(data => {
      this.certificate = data || {
        certificateNumber: this.certId,
        studentName: 'KRITI SAGAR',
        courseName: 'Advanced AI Microservices & Standalone Angular Engineering',
        mentorName: 'AKSHAT ARYAN',
        completionDate: '2026-08-11',
        status: 'VALID'
      };
      this.isLoading = false;
    });
  }
}
