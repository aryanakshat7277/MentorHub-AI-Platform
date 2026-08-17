import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-resource-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-hub.component.html',
  styleUrls: ['./resource-hub.component.scss']
})
export class ResourceHubComponent implements OnInit {
  resources: any[] = [];
  selectedCategory = 'ALL';
  searchQuery = '';

  filterPills = [
    { label: 'ALL', value: 'ALL' },
    { label: 'ARTICLE', value: 'ARTICLE' },
    { label: 'VIDEO', value: 'VIDEO' },
    { label: 'PDF & DOCS', value: 'PDF' },
    { label: 'PICTURES', value: 'PICTURE' },
    { label: 'COURSE', value: 'COURSE' },
    { label: 'BOOK', value: 'BOOK' }
  ];

  // Upload Modal State
  showUploadModal = false;
  isUploading = false;
  currentUser: any = null;

  newResource = {
    title: '',
    type: 'PDF',
    category: 'Backend',
    description: '',
    url: '',
    author: 'AKSHAT ARYAN',
    readTime: 'File Resource',
    fileName: '',
    fileType: '',
    fileData: ''
  };

  // File Preview Modal State
  selectedPreviewResource: any = null;
  showPreviewModal = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getCurrentUser().subscribe(u => {
      if (u) {
        this.currentUser = u;
        if (u.name) {
          this.newResource.author = u.name;
        }
      }
    });
    this.loadResources();
  }

  loadResources() {
    this.apiService.getResources(this.selectedCategory).subscribe(data => {
      this.resources = data || [];
    });
  }

  get filteredResources() {
    return this.resources.filter(res => {
      const matchesSearch = !this.searchQuery || 
        res.title?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        res.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        res.author?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesType = this.selectedCategory === 'ALL' ||
        (res.type && res.type.toUpperCase() === this.selectedCategory.toUpperCase()) ||
        (this.selectedCategory === 'PDF' && (res.type === 'PDF' || res.type === 'DOCUMENT'));

      return matchesSearch && matchesType;
    });
  }

  selectFilter(pillValue: string) {
    this.selectedCategory = pillValue;
    this.loadResources();
  }

  toggleBookmark(resource: any) {
    this.apiService.toggleBookmark(resource.id).subscribe(res => {
      resource.bookmarked = res.bookmarked;
    });
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  resetUploadForm() {
    this.newResource = {
      title: '',
      type: 'PDF',
      category: 'Backend',
      description: '',
      url: '',
      author: this.currentUser?.name || 'AKSHAT ARYAN',
      readTime: 'File Resource',
      fileName: '',
      fileType: '',
      fileData: ''
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.newResource.fileName = file.name;
    this.newResource.fileType = file.type;

    // Auto detect type
    if (file.type.includes('image')) {
      this.newResource.type = 'PICTURE';
    } else if (file.type.includes('pdf')) {
      this.newResource.type = 'PDF';
    } else if (file.type.includes('video')) {
      this.newResource.type = 'VIDEO';
    } else {
      this.newResource.type = 'DOCUMENT';
    }

    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    this.newResource.readTime = `${fileSizeMb} MB File`;

    const reader = new FileReader();
    reader.onload = () => {
      this.newResource.fileData = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  submitResourceUpload() {
    if (!this.newResource.title.trim()) {
      alert('Please enter a title for the resource.');
      return;
    }

    this.isUploading = true;
    const payload = {
      ...this.newResource,
      url: this.newResource.url || (this.newResource.fileName ? `#file-${this.newResource.fileName}` : 'https://mentorhub.ai')
    };

    this.apiService.uploadResource(payload).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.closeUploadModal();
        this.loadResources();
      },
      error: (err) => {
        this.isUploading = false;
        alert('Resource upload failed. Please try again.');
      }
    });
  }

  deleteResource(resId: number) {
    if (confirm('Are you sure you want to delete this resource from the database? This action cannot be undone.')) {
      this.apiService.deleteResource(resId).subscribe({
        next: () => {
          this.resources = this.resources.filter(r => r.id !== resId);
        },
        error: (err) => {
          alert('Failed to delete resource.');
        }
      });
    }
  }

  openPreview(resource: any) {
    if (resource.fileData) {
      this.selectedPreviewResource = resource;
      this.showPreviewModal = true;
    } else if (resource.url && resource.url.startsWith('http')) {
      window.open(resource.url, '_blank');
    }
  }

  closePreviewModal() {
    this.showPreviewModal = false;
    this.selectedPreviewResource = null;
  }

  downloadResourceFile(resource: any) {
    if (resource.fileData) {
      const link = document.createElement('a');
      link.href = resource.fileData;
      link.download = resource.fileName || `${resource.title.replace(/\s+/g, '_')}`;
      link.click();
    } else if (resource.url) {
      window.open(resource.url, '_blank');
    }
  }
}
