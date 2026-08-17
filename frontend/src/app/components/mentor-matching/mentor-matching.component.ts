import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-mentor-matching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mentor-matching.component.html',
  styleUrls: ['./mentor-matching.component.scss']
})
export class MentorMatchingComponent implements OnInit {
  matchedMentors: any[] = [];
  selectedDomain = 'ALL';
  searchQuery = '';
  selectedMentorForBooking: any = null;
  bookingTopic = '';
  bookingDate = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchMentors();
  }

  getAvatarByName(name: string): string {
    if (!name) return 'assets/akshat-profile.jpg';
    const nameUpper = name.toUpperCase();
    if (nameUpper.includes('AKSHAT')) return 'assets/akshat-profile.jpg';
    if (nameUpper.includes('PAVANI')) return 'assets/pavani-profile.jpg';
    if (nameUpper.includes('VANAJA')) return 'assets/vanaja-profile.jpg';
    if (nameUpper.includes('KRITI')) return 'assets/kriti-profile.jpg';
    return 'assets/akshat-profile.jpg';
  }

  fetchMentors() {
    this.apiService.getMatchedMentors().subscribe(data => {
      this.matchedMentors = (data || []).map((m: any) => ({
        ...m,
        mentor: {
          ...m.mentor,
          avatarUrl: this.getAvatarByName(m.mentor?.name)
        }
      }));
    });
  }

  openBookingModal(mentorItem: any) {
    this.selectedMentorForBooking = mentorItem;
    this.bookingTopic = `1-on-1 Mentorship: ${mentorItem.mentor.skills.split(',')[0]}`;
    this.bookingDate = new Date(Date.now() + 86400000).toISOString().substring(0, 16);
  }

  confirmBooking() {
    if (!this.selectedMentorForBooking) return;
    const session = {
      mentorId: this.selectedMentorForBooking.mentor.id,
      mentorName: this.selectedMentorForBooking.mentor.name,
      topic: this.bookingTopic,
      durationMinutes: 45,
      scheduledAt: this.bookingDate
    };

    this.apiService.bookSession(session).subscribe(() => {
      alert(`Session successfully booked with ${this.selectedMentorForBooking.mentor.name}!`);
      this.selectedMentorForBooking = null;
    });
  }
}
