import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { 
  CutmCoursesService, 
  CutmCourse, 
  CutmModule, 
  BasketSummary,
  CoursewareCategorySummary
} from '../../services/cutm-courses.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-cutm-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cutm-courses.component.html',
  styleUrls: ['./cutm-courses.component.scss']
})
export class CutmCoursesComponent implements OnInit, OnDestroy {
  courses: CutmCourse[] = [];
  filteredCourses: CutmCourse[] = [];
  basketSummaries: BasketSummary[] = [];
  coursewareCategories: CoursewareCategorySummary[] = [];

  // Filters & State
  selectedBasket = 'ALL';
  selectedCourseCategory = 'ALL';
  searchQuery = '';
  selectedSemester = 'ALL';
  bookmarkedOnly = false;
  viewMode: 'grid' | 'detailed' = 'grid';

  // Expansion & Inspection
  expandedCourseIds: Set<number> = new Set<number>();
  activeCourseModal: CutmCourse | null = null;
  activeModuleDetail: { course: CutmCourse; module: CutmModule } | null = null;

  // Cloud Database Status
  isCloudSynced = false;
  copiedCode: string | null = null;

  private sub = new Subscription();

  constructor(
    private cutmService: CutmCoursesService,
    private soundService: SoundService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.cutmService.courses$.subscribe(list => {
        this.courses = list;
        this.basketSummaries = this.cutmService.getBasketSummaries();
        this.coursewareCategories = this.cutmService.getCoursewareCategories();
        this.applyFilters();
      })
    );

    this.sub.add(
      this.cutmService.isCloudSynced$.subscribe(synced => {
        this.isCloudSynced = synced;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // --- Filtering & View Controls ---
  selectBasket(category: string): void {
    this.selectedBasket = category;
    this.soundService.playClickSound();
    this.applyFilters();
  }

  selectCourseCategory(cat: string): void {
    this.selectedCourseCategory = cat;
    this.soundService.playClickSound();
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSemesterChange(): void {
    this.applyFilters();
  }

  toggleBookmarkedFilter(): void {
    this.bookmarkedOnly = !this.bookmarkedOnly;
    this.soundService.playClickSound();
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'detailed'): void {
    this.viewMode = mode;
    this.soundService.playClickSound();
  }

  resetAllFilters(): void {
    this.selectedBasket = 'ALL';
    this.selectedCourseCategory = 'ALL';
    this.searchQuery = '';
    this.selectedSemester = 'ALL';
    this.bookmarkedOnly = false;
    this.applyFilters();
    this.soundService.playClickSound();
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredCourses = this.courses.filter(course => {
      // Courseware Category filter
      if (this.selectedCourseCategory !== 'ALL' && course.courseCategory !== this.selectedCourseCategory) {
        return false;
      }

      // Basket filter
      if (this.selectedBasket !== 'ALL' && course.basketCategory !== this.selectedBasket) {
        return false;
      }

      // Semester filter
      if (this.selectedSemester !== 'ALL' && !course.semester.includes(this.selectedSemester)) {
        return false;
      }

      // Bookmark filter
      if (this.bookmarkedOnly && !course.isBookmarked) {
        return false;
      }

      // Search Query filter (matches Code, Title, Faculty, Dept, Description, Modules)
      if (q) {
        const inCode = (course.courseCode || '').toLowerCase().includes(q);
        const inTitle = (course.courseTitle || '').toLowerCase().includes(q);
        const inFaculty = (course.faculty || '').toLowerCase().includes(q);
        const inDept = (course.department || '').toLowerCase().includes(q);
        const inDesc = (course.description || '').toLowerCase().includes(q);
        const inCat = (course.courseCategory || '').toLowerCase().includes(q);
        const inModules = (course.modules || []).some(m => 
          m.moduleTitle.toLowerCase().includes(q) || 
          m.topics.toLowerCase().includes(q) ||
          m.practicalLabWork.toLowerCase().includes(q)
        );
        return inCode || inTitle || inFaculty || inDept || inDesc || inCat || inModules;
      }

      return true;
    });
  }

  // --- Actions ---
  toggleBookmark(course: CutmCourse, event?: Event): void {
    if (event) event.stopPropagation();
    this.cutmService.toggleBookmark(course.id);
    this.soundService.playClickSound();
    this.applyFilters();
  }

  toggleModuleComplete(courseId: number, moduleNum: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.cutmService.toggleModuleComplete(courseId, moduleNum);
    this.soundService.playClickSound();
    this.applyFilters();
  }

  toggleExpandCourse(courseId: number): void {
    if (this.expandedCourseIds.has(courseId)) {
      this.expandedCourseIds.delete(courseId);
    } else {
      this.expandedCourseIds.add(courseId);
    }
    this.soundService.playClickSound();
  }

  isCourseExpanded(courseId: number): boolean {
    return this.expandedCourseIds.has(courseId);
  }

  openCourseModal(course: CutmCourse, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeCourseModal = course;
    this.soundService.playClickSound();
  }

  closeCourseModal(): void {
    this.activeCourseModal = null;
  }

  openModuleDetail(course: CutmCourse, mod: CutmModule, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeModuleDetail = { course, module: mod };
    this.soundService.playClickSound();
  }

  closeModuleDetail(): void {
    this.activeModuleDetail = null;
  }

  openCoursewarePortal(course: CutmCourse, event?: Event): void {
    if (event) event.stopPropagation();
    this.soundService.playClickSound();
    const url = course.coursewareUrl || (course.coursewareId ? `https://courseware.cutm.ac.in/course/${course.coursewareId}` : 'https://courseware.cutm.ac.in/courses');
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  copyCourseCode(code: string, event?: Event): void {
    if (event) event.stopPropagation();
    navigator.clipboard?.writeText(code);
    this.copiedCode = code;
    this.soundService.playClickSound();
    setTimeout(() => {
      if (this.copiedCode === code) this.copiedCode = null;
    }, 2000);
  }

  launchVivaDefense(course: CutmCourse, mod?: CutmModule, event?: Event): void {
    if (event) event.stopPropagation();
    this.soundService.playClickSound();
    const queryParams: any = {
      courseCode: course.courseCode,
      courseTitle: course.courseTitle
    };
    if (mod) {
      queryParams.module = mod.moduleNumber;
      queryParams.topic = mod.moduleTitle;
    }
    this.router.navigate(['/mock-viva'], { queryParams });
  }

  // --- Metrics & Calculations ---
  getCourseCompletionPercentage(course: CutmCourse): number {
    const total = course.modules?.length || 5;
    const completed = course.completedModules?.length || 0;
    return Math.round((completed / total) * 100);
  }

  isModuleCompleted(course: CutmCourse, moduleNum: number): boolean {
    return (course.completedModules || []).includes(moduleNum);
  }

  getTotalCreditsCount(): number {
    return this.courses.reduce((acc, c) => acc + (c.credits || 0), 0);
  }

  getTotalModulesCount(): number {
    return this.courses.reduce((acc, c) => acc + (c.modules?.length || 0), 0);
  }

  getCompletedModulesTotal(): number {
    return this.courses.reduce((acc, c) => acc + (c.completedModules?.length || 0), 0);
  }

  getOverallDegreeProgress(): number {
    const total = this.getTotalModulesCount();
    if (!total) return 0;
    return Math.round((this.getCompletedModulesTotal() / total) * 100);
  }

  getBasketColor(category: string): string {
    switch (category) {
      case 'BASKET_I': return '#3B82F6';
      case 'BASKET_II': return '#10B981';
      case 'BASKET_III': return '#DE7048';
      case 'BASKET_IV': return '#8B5CF6';
      case 'BASKET_V': return '#EC4899';
      default: return '#D4AF37';
    }
  }

  getBasketShortLabel(category: string): string {
    switch (category) {
      case 'BASKET_I': return 'AECC';
      case 'BASKET_II': return 'PCC';
      case 'BASKET_III': return 'PEC';
      case 'BASKET_IV': return 'OE';
      case 'BASKET_V': return 'SEC';
      default: return 'CBCS';
    }
  }

  getCourseCategoryColor(category?: string): string {
    switch (category) {
      case 'Core': return '#1D4ED8';
      case 'Domain': return '#15803D';
      case 'Skill': return '#C2410C';
      case 'Certificate': return '#6D28D9';
      case 'Advanced Certificate': return '#0D9488';
      case 'Diploma': return '#BE185D';
      default: return '#D4AF37';
    }
  }

  getCourseCategoryIcon(category?: string): string {
    switch (category) {
      case 'Core': return '📘';
      case 'Domain': return '🚀';
      case 'Skill': return '🛠️';
      case 'Certificate': return '📜';
      case 'Advanced Certificate': return '🏅';
      case 'Diploma': return '🎓';
      default: return '🏛️';
    }
  }
}
