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
      case 'BASKET_I': return '#1D4ED8';
      case 'BASKET_II': return '#15803D';
      case 'BASKET_III': return '#A63B19';
      case 'BASKET_IV': return '#6D28D9';
      case 'BASKET_V': return '#BE185D';
      default: return '#B45309';
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

  // --- Graphical UI Helpers ---
  getCourseGraphic(course: CutmCourse): CourseGraphicMeta {
    const title = (course.courseTitle || '').toLowerCase();

    if (title.includes('ai') || title.includes('intelligence') || title.includes('machine learning') || 
        title.includes('deep learning') || title.includes('neural') || title.includes('vision') || 
        title.includes('nlp') || title.includes('data science') || title.includes('python')) {
      return {
        gradient: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #4338CA 100%)',
        pattern: 'pattern-neural',
        glyph: '🧠',
        domainTag: 'AI & Neural Systems',
        rigorLevel: 'Advanced Specialization',
        rigorBars: 3
      };
    }

    if (title.includes('cloud') || title.includes('devops') || title.includes('docker') || 
        title.includes('kubernetes') || title.includes('network') || title.includes('distributed') || 
        title.includes('security') || title.includes('cyber')) {
      return {
        gradient: 'linear-gradient(135deg, #0C4A6E 0%, #0369A1 45%, #0284C7 100%)',
        pattern: 'pattern-cloud',
        glyph: '☁️',
        domainTag: 'Cloud & Infrastructure',
        rigorLevel: 'Industrial Core',
        rigorBars: 3
      };
    }

    if (title.includes('data structure') || title.includes('algorithm') || title.includes('java') || 
        title.includes('c++') || title.includes('c programming') || title.includes('compiler') || 
        title.includes('database') || title.includes('dbms') || title.includes('full-stack') || 
        title.includes('web') || title.includes('e-commerce') || title.includes('software')) {
      return {
        gradient: 'linear-gradient(135deg, #1C1917 0%, #292524 45%, #44403C 100%)',
        pattern: 'pattern-code',
        glyph: '💻',
        domainTag: 'Computer Science & Systems',
        rigorLevel: 'Industrial Core',
        rigorBars: 2
      };
    }

    if (title.includes('math') || title.includes('calculus') || title.includes('physics') || 
        title.includes('quantum') || title.includes('discrete') || title.includes('algebra') || 
        title.includes('statistics') || title.includes('probability')) {
      return {
        gradient: 'linear-gradient(135deg, #3B0764 0%, #581C87 45%, #7E22CE 100%)',
        pattern: 'pattern-quantum',
        glyph: '⚛️',
        domainTag: 'Mathematics & Quantum Physics',
        rigorLevel: 'Foundation',
        rigorBars: 2
      };
    }

    if (title.includes('iot') || title.includes('vlsi') || title.includes('electronic') || 
        title.includes('circuit') || title.includes('digital logic') || title.includes('sensor') || 
        title.includes('embedded') || title.includes('robotics')) {
      return {
        gradient: 'linear-gradient(135deg, #064E3B 0%, #047857 45%, #059669 100%)',
        pattern: 'pattern-circuit',
        glyph: '🔌',
        domainTag: 'Electronics & Embedded IoT',
        rigorLevel: 'Industrial Core',
        rigorBars: 3
      };
    }

    if (title.includes('management') || title.includes('market') || title.includes('finance') || 
        title.includes('accounting') || title.includes('entrepreneur') || title.includes('law') || 
        title.includes('ipr') || title.includes('mba') || title.includes('business')) {
      return {
        gradient: 'linear-gradient(135deg, #713F12 0%, #854D0E 45%, #A16207 100%)',
        pattern: 'pattern-business',
        glyph: '📊',
        domainTag: 'Management & Corporate Strategy',
        rigorLevel: 'Foundation',
        rigorBars: 1
      };
    }

    if (title.includes('agriculture') || title.includes('plant') || title.includes('bio') || 
        title.includes('environmental') || title.includes('welding') || title.includes('manufacturing') || 
        title.includes('mechanical') || title.includes('civil')) {
      return {
        gradient: 'linear-gradient(135deg, #14532D 0%, #166534 45%, #15803D 100%)',
        pattern: 'pattern-bio',
        glyph: '🌱',
        domainTag: 'Applied Technologies & Practicums',
        rigorLevel: 'Intermediate',
        rigorBars: 2
      };
    }

    return {
      gradient: 'linear-gradient(135deg, #7C2D12 0%, #9A3412 45%, #C2410C 100%)',
      pattern: 'pattern-code',
      glyph: '📘',
      domainTag: (course.courseCategory ? course.courseCategory + ' Courses' : 'Academic Courseware'),
      rigorLevel: 'Intermediate',
      rigorBars: 2
    };
  }

  hasPracticalLab(course: CutmCourse): boolean {
    const ltp = this.getParsedLtp(course);
    return ltp.practical > 0;
  }

  getParsedLtp(course: CutmCourse): { lecture: number; tutorial: number; practical: number } {
    if (!course.ltp) return { lecture: 3, tutorial: 0, practical: 0 };
    const parts = course.ltp.split('-').map(p => parseInt(p.trim(), 10) || 0);
    return {
      lecture: parts[0] || 0,
      tutorial: parts[1] || 0,
      practical: parts[2] || 0
    };
  }

  getCbcsCreditDistribution(): { category: string; label: string; credits: number; percent: number; color: string }[] {
    const totalCredits = this.getTotalCreditsCount() || 1;
    const baskets = ['BASKET_I', 'BASKET_II', 'BASKET_III', 'BASKET_IV', 'BASKET_V'];
    return baskets.map(cat => {
      const cr = this.courses
        .filter(c => c.basketCategory === cat)
        .reduce((sum, c) => sum + (c.credits || 0), 0);
      const pct = Math.round((cr / totalCredits) * 100);
      return {
        category: cat,
        label: this.getBasketShortLabel(cat),
        credits: cr,
        percent: pct,
        color: this.getBasketColor(cat)
      };
    });
  }
}

export interface CourseGraphicMeta {
  gradient: string;
  pattern: string;
  glyph: string;
  domainTag: string;
  rigorLevel: 'Foundation' | 'Intermediate' | 'Industrial Core' | 'Advanced Specialization';
  rigorBars: number;
}
