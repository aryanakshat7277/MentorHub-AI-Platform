import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('profileFileInput') profileFileInput!: ElementRef<HTMLInputElement>;

  user: any = null;
  skillsList: string[] = [];
  isEditing = false;
  isSaving = false;

  editForm: any = {
    name: '',
    title: '',
    company: '',
    email: '',
    bio: '',
    skills: '',
    avatarUrl: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadProfile();
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

  loadProfile() {
    this.apiService.getCurrentUser().subscribe(data => {
      this.user = data;
      if (this.user) {
        this.user.avatarUrl = this.getAvatarByName(this.user.name);
      }
      this.parseSkills();
    });
  }

  parseSkills() {
    if (this.user && this.user.skills) {
      this.skillsList = this.user.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    } else {
      this.skillsList = ['Java 21', 'Spring Boot 3', 'Angular 17', 'WebSockets', 'Reactive AI Systems', 'H2/PostgreSQL'];
    }
  }

  openEditModal() {
    if (!this.user) return;
    this.editForm = {
      name: this.user.name || '',
      title: this.user.title || '',
      company: this.user.company || '',
      email: this.user.email || '',
      bio: this.user.bio || '',
      skills: this.user.skills || this.skillsList.join(', '),
      avatarUrl: this.user.avatarUrl || ''
    };
    this.isEditing = true;
  }

  triggerProfileFileInput() {
    if (this.profileFileInput && this.profileFileInput.nativeElement) {
      this.profileFileInput.nativeElement.click();
    }
  }

  onProfileFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64Image = e.target.result;
        this.editForm.avatarUrl = base64Image;
        if (this.user) {
          this.user.avatarUrl = base64Image;
        }
        this.apiService.updateCurrentUser({ avatarUrl: base64Image }).subscribe();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('userAvatar', base64Image);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveProfile() {
    if (!this.editForm.name.trim()) return;

    this.isSaving = true;

    this.apiService.updateCurrentUser(this.editForm).subscribe(updatedUser => {
      this.isSaving = false;
      this.user = { ...this.user, ...updatedUser };
      if (typeof localStorage !== 'undefined' && this.editForm.avatarUrl) {
        localStorage.setItem('userAvatar', this.editForm.avatarUrl);
      }
      this.parseSkills();
      this.isEditing = false;
    });
  }
}
