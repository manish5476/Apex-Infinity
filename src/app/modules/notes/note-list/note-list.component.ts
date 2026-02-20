import { Component, inject, signal, effect, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
import { NoteCardComponent, User } from '../note-card/note-card.component';
import { SharedNoteCardComponent } from '../shared-note-card.component';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { NoteService } from '../../../core/services/notes.service';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';

type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash' | 'calendar';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ReactiveFormsModule, 
    NoteCardComponent, 
    SharedNoteCardComponent,
    RecentActivityComponent,
    CalendarViewComponent
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="dashboard-container">
      
      <!-- ==================== SIDEBAR FILTERS ==================== -->
      <aside class="filters-sidebar">
        
        <!-- Compose Button -->
        <div class="compose-btn-wrapper">
          <button class="btn-compose" routerLink="/notes/create">
            <span class="icon"><i class="pi pi-plus"></i></span> 
            <span class="label">New Note</span>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="nav-menu custom-scrollbar">
          
          <!-- Library Group -->
          <div class="nav-group">
            <label>Library</label>
            <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
              <span class="icon"><i class="pi pi-file"></i></span> 
              <span class="text">All Notes</span>
              <span class="count">{{ dashboardStats().total }}</span>
            </button>
            <button class="nav-item" [class.active]="activeFilter() === 'favorites'" (click)="setFilter('favorites')">
              <span class="icon"><i class="pi pi-star"></i></span> 
              <span class="text">Favorites</span>
            </button>
            <button class="nav-item" [class.active]="activeFilter() === 'recent'" (click)="setFilter('recent')">
              <span class="icon"><i class="pi pi-clock"></i></span> 
              <span class="text">Recent Activity</span>
            </button>
            <button class="nav-item" [class.active]="activeFilter() === 'calendar'" (click)="setFilter('calendar')">
              <span class="icon"><i class="pi pi-calendar"></i></span> 
              <span class="text">Calendar</span>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Sharing Group -->
          <div class="nav-group">
            <label>Sharing</label>
            <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
              <span class="icon"><i class="pi pi-users"></i></span> 
              <span class="text">Shared with me</span>
            </button>
            <button class="nav-item" [class.active]="activeFilter() === 'shared-by-me'" (click)="setFilter('shared-by-me')">
              <span class="icon"><i class="pi pi-share-alt"></i></span> 
              <span class="text">Shared by me</span>
            </button>
          </div>

          <div class="divider"></div>

          <!-- Organization Group -->
          <div class="nav-group">
            <label>Organization</label>
            <button class="nav-item" [class.active]="activeFilter() === 'archived'" (click)="setFilter('archived')">
              <span class="icon"><i class="pi pi-box"></i></span> 
              <span class="text">Archived</span>
            </button>
            <button class="nav-item danger" [class.active]="activeFilter() === 'trash'" (click)="setFilter('trash')">
              <span class="icon"><i class="pi pi-trash"></i></span> 
              <span class="text">Trash Bin</span>
            </button>
          </div>
        </nav>

        <!-- Stats Widget -->
        @if (stats()) {
        <div class="stats-widget glass-panel">
          <div class="stat-header">
            <h3>Overview</h3>
            <i class="pi pi-chart-bar"></i>
          </div>
          <div class="stat-row">
            <span>Active</span>
            <span class="val">{{ dashboardStats().active }}</span>
          </div>
           <div class="stat-row">
            <span>Completed</span>
            <span class="val success">{{ dashboardStats().completed }}</span>
          </div>
        </div>
        }
      </aside>

      <!-- ==================== MAIN CONTENT ==================== -->
      <main class="main-content">
        
        <!-- Top Bar -->
        <header class="top-bar glass-panel">
          <div class="header-left">
            <div class="mobile-toggle"><i class="pi pi-bars"></i></div> <!-- Placeholder for mobile -->
            <div class="context-title">
              @switch (activeFilter()) {
                @case ('recent') { <i class="pi pi-clock"></i> Recent Activity }
                @case ('calendar') { <i class="pi pi-calendar"></i> Calendar }
                @case ('shared') { <i class="pi pi-users"></i> Shared With Me }
                @case ('shared-by-me') { <i class="pi pi-share-alt"></i> Shared By Me }
                @case ('favorites') { <i class="pi pi-star-fill"></i> Favorites }
                @case ('trash') { <i class="pi pi-trash"></i> Trash }
                @case ('archived') { <i class="pi pi-box"></i> Archive }
                @default { <i class="pi pi-file"></i> All Notes }
              }
            </div>
          </div>

          <!-- Search (Hidden on Calendar/Recent) -->
          @if (activeFilter() !== 'calendar' && activeFilter() !== 'recent') {
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input type="text" [formControl]="searchControl" placeholder="Search notes..." class="search-input">
            </div>
          }
          
          <div class="actions-wrapper">
            <!-- Trash Actions -->
            @if (activeFilter() === 'trash') {
              <button class="btn-action danger" (click)="onEmptyTrash()" title="Empty Trash">
                 <i class="pi pi-trash"></i> Empty
              </button>
            }

            <!-- Export -->
            <button class="btn-icon" (click)="exportNotes()" title="Export Data">
              <i class="pi pi-download"></i>
            </button>

            <div class="divider-v"></div>

            <!-- View Toggles (Hidden for Recent/Calendar) -->
            @if (activeFilter() !== 'recent' && activeFilter() !== 'calendar') {
              <div class="view-controls">
                <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
                  <i class="pi pi-th-large"></i>
                </button>
                <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
                  <i class="pi pi-list"></i>
                </button>
              </div>
            }
          </div>
        </header>

        <!-- Scrollable Content Area -->
        <div class="content-area custom-scrollbar" [class.no-padding]="activeFilter() === 'calendar'">
          
          <!-- Loading -->
          @if (isLoading() && activeFilter() !== 'calendar') {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Syncing notes...</p>
          </div>
          }

          <!-- Empty State (Not for Calendar) -->
          @if (!isLoading() && notes().length === 0 && activeFilter() !== 'calendar') {
          <div class="empty-state">
            <div class="illustration">
              @if (activeFilter() === 'trash') { 🗑️ }
              @else if (activeFilter() === 'favorites') { ⭐ }
              @else if (activeFilter() === 'recent') { 🕰️ }
              @else if (activeFilter() === 'shared') { 📪 }
              @else if (activeFilter() === 'shared-by-me') { 📤 }
              @else { 📝 }
            </div>
            <h3>{{ getEmptyMessage().title }}</h3>
            <p>{{ getEmptyMessage().desc }}</p>
            @if (activeFilter() === 'all') {
              <button class="btn-primary" routerLink="/notes/create">Create your first note</button>
            }
          </div>
          }

          <!-- CONTENT VIEW SWITCHER -->
          @if (!isLoading() || activeFilter() === 'calendar') {
            
            <!-- 1. Recent Activity View -->
            @if (activeFilter() === 'recent') {
              <app-recent-activity></app-recent-activity>
            } 

            <!-- 2. Calendar View -->
            @else if (activeFilter() === 'calendar') {
              <app-datepicker-view></app-datepicker-view>
            }
            
            <!-- 3. Standard Grid/List View -->
            @else if (notes().length > 0) {
              <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
                @for (note of notes(); track note._id) {
                  
                  <!-- Shared Note Card -->
                  @if (isSharedFilter()) {
                    <app-shared-note-card
                      [note]="note"
                      [viewMode]="viewMode()"
                      [filterType]="activeFilter() === 'shared-by-me' ? 'shared-by-me' : 'shared'"
                      (action)="handleSharedAction($event, note._id)">
                    </app-shared-note-card>
                  } 
                  
                  <!-- Standard Note Card -->
                  @else {
                    <app-note-card 
                      [note]="note" 
                      [viewMode]="viewMode()"
                      [availableUsers]="availableUsers()"
                      (edit)="onEditNote($event)" 
                      (pin)="onPinNote($event)"
                      (delete)="onDeleteNote($event)" 
                      (deleteHard)="onHardDeleteNote($event)"
                      (archive)="onArchiveNote($event)" 
                      (restore)="onRestoreNote($event)"
                      (share)="onShareNote($event)"
                      (linkClick)="onLinkNoteRequest($event)"
                      (convertToTask)="onConvertToTask($event)">
                    </app-note-card>
                  }
                }
              </div>
            }
          }

          <!-- Pagination (Hide for Recent/Trash/Calendar if needed) -->
          @if (!isLoading() && totalPages() > 1 && !isSpecialFilter()) {
          <div class="pagination">
            <button class="page-btn" (click)="changePage(-1)" [disabled]="currentPage() === 1">
              <i class="pi pi-chevron-left"></i> Previous
            </button>
            <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button class="page-btn" (click)="changePage(1)" [disabled]="currentPage() === totalPages()">
              Next <i class="pi pi-chevron-right"></i>
            </button>
          </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ==================== THEME VARIABLES MAPPING ==================== */
    :host {
      display: block;
      height: 100%;
      overflow: hidden; /* CRITICAL: Prevents host from spilling over */
      
      --sidebar-w: 260px;
      --topbar-h: 64px;
      
      /* Mapping to Provided Theme Tokens */
      --bg-app: var(--bg-primary);
      --bg-panel: var(--bg-secondary);
      --border-color: var(--border-secondary);
      --primary: var(--accent-primary);
      --text-main: var(--text-primary);
      --text-muted: var(--text-secondary);
    }

    .dashboard-container {
      display: flex;
      height: 100%;
      width: 100%;
      background-color: var(--bg-app);
      color: var(--text-main);
      overflow: hidden; /* CRITICAL: Prevents double scrollbars */
    }

    /* ==================== SIDEBAR ==================== */
    .filters-sidebar {
      width: var(--sidebar-w);
      background: var(--bg-panel);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-lg);
      gap: var(--spacing-xl);
      flex-shrink: 0;
      height: 100%;
      overflow: hidden; /* Keep internal scrolling contained */

      .compose-btn-wrapper {
        .btn-compose {
          width: 100%;
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: var(--ui-border-radius-lg);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-weight: 600;
          font-size: var(--font-size-md);
          cursor: pointer;
          transition: var(--transition-base);
          box-shadow: var(--shadow-md);

          &:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
          .icon { font-size: 1rem; }
        }
      }

      .nav-menu {
        display: flex; flex-direction: column; gap: var(--spacing-md);
        flex: 1;
        overflow-y: auto; /* Allow menu to scroll if it gets too long */
        padding-right: 4px; /* Space for scrollbar */

        .nav-group {
          display: flex; flex-direction: column; gap: 4px;
          label { 
            font-size: 11px; 
            text-transform: uppercase; 
            font-weight: 700; 
            color: var(--text-muted); 
            margin-bottom: 8px; 
            padding-left: 12px;
            letter-spacing: 0.5px;
          }
        }

        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: var(--ui-border-radius);
          cursor: pointer;
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: left;

          &:hover { background: var(--bg-ternary); color: var(--text-main); }
          &.active { 
            background: color-mix(in srgb, var(--primary) 10%, transparent); 
            color: var(--primary); 
            font-weight: 600; 
            
            .count { background: var(--primary); color: white; }
          }
          &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
          &.danger.active { background: var(--color-error-bg); color: var(--color-error); }

          .icon { font-size: 1.1em; width: 20px; text-align: center; }
          .text { flex: 1; }
          .count { 
            font-size: 10px; 
            background: var(--bg-ternary); 
            padding: 2px 8px; 
            border-radius: 12px; 
            transition: all 0.2s;
          }
        }

        .divider { height: 1px; background: var(--border-color); margin: 8px 0; opacity: 0.5; }
      }

      .stats-widget {
        padding: var(--spacing-md);
        border-radius: var(--ui-border-radius);
        border: 1px solid var(--border-color);
        background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
        margin-top: auto;
        
        .stat-header { 
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; 
          h3 { font-size: 12px; font-weight: 600; margin: 0; color: var(--text-muted); }
          i { color: var(--primary); }
        }
        .stat-row {
          display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;
          .val { font-weight: 600; &.success { color: var(--color-success); } }
        }
      }
    }

    /* ==================== MAIN AREA ==================== */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      min-width: 0; /* CRITICAL: Prevents flex child from overflowing */
      height: 100%;
      overflow: hidden; /* Ensure only content-area scrolls */
    }

    .top-bar {
      height: var(--topbar-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-xl);
      border-bottom: 1px solid var(--border-color);
      /* Glassmorphism */
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      position: sticky;
      top: 0;
      z-index: 10;
      flex-shrink: 0; /* Prevent header from shrinking */

      .header-left {
        display: flex; align-items: center; gap: 12px;
        .context-title {
          font-weight: 600; color: var(--text-main); font-size: 16px;
          display: flex; align-items: center; gap: 8px;
          i { color: var(--primary); }
        }
      }

      .search-wrapper {
        display: flex; align-items: center; gap: 10px;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        padding: 8px 12px;
        border-radius: var(--ui-border-radius-xl);
        width: 300px;
        transition: all 0.2s;

        &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px var(--accent-focus); }
        .search-icon { color: var(--text-muted); }
        
        .search-input {
          border: none; background: transparent; outline: none; width: 100%;
          color: var(--text-main); font-size: var(--font-size-sm);
        }
      }

      .actions-wrapper {
        display: flex; align-items: center; gap: 8px;

        .btn-icon {
          width: 36px; height: 36px;
          border-radius: var(--ui-border-radius);
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;

          &:hover { background: var(--bg-ternary); color: var(--text-main); }
          &.active { background: var(--bg-ternary); color: var(--primary); border-color: var(--border-color); }
        }
        
        .btn-action {
          padding: 6px 12px; border-radius: var(--ui-border-radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
          &.danger { background: var(--color-error-bg); color: var(--color-error); &:hover { background: #fee2e2; } }
        }

        .divider-v { width: 1px; height: 20px; background: var(--border-color); margin: 0 8px; }
        .view-controls { display: flex; gap: 4px; background: var(--bg-panel); padding: 2px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-color); }
      }
    }

    .content-area {
      flex: 1;
      overflow-y: auto; /* This is the ONLY place we want scrolling */
      padding: var(--spacing-xl);
      position: relative;
      
      /* Specific styling for calendar mode to use full space */
      &.no-padding {
        padding: 0;
        overflow: hidden; /* Calendar likely handles its own scrolling */
      }
    }

    /* ==================== LOADING & EMPTY STATES ==================== */
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
      color: var(--text-muted);
      .spinner {
        width: 40px; height: 40px; border: 3px solid var(--bg-ternary); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center; margin-top: 100px;
      .illustration { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; filter: grayscale(0.5); }
      h3 { font-size: 1.25rem; margin-bottom: 8px; color: var(--text-main); }
      p { color: var(--text-muted); margin-bottom: 24px; }
      .btn-primary { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600; }
    }

    /* ==================== GRID/LIST LAYOUTS ==================== */
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      padding-bottom: 40px;

      &.list-layout {
        display: flex; flex-direction: column; gap: var(--spacing-sm);
      }
    }

    /* ==================== PAGINATION ==================== */
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; padding-bottom: 20px;
      .page-btn {
        background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 16px; border-radius: var(--ui-border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px;
        &:disabled { opacity: 0.5; cursor: not-allowed; }
        &:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
      }
      .page-info { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
    }
  `]
})
export class NoteListComponent {
  private notesService = inject(NoteService);
  private dialogServices = inject(DynamicDialogServices);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // --- State Signals ---
  notes = signal<Note[]>([]); // This will also hold Activity Data due to shared structure or mapping
  stats = signal<NoteStatistics | null>(null);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');
  
  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalNotes = signal(0);

  // Filters State
  activeFilter = signal<FilterType>('all');
  searchQuery = signal('');
  
  // Users for sharing
  availableUsers = signal<User[]>([]); 

  // Search Form
  searchControl = this.fb.control('');

  // --- Computed Stats for Dashboard ---
  dashboardStats = computed(() => {
    const s = this.stats() as any; 
    if (!s) return { total: 0, active: 0, completed: 0 };

    const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    
    let completed = 0;
    if (Array.isArray(s.byStatus)) {
      const c = s.byStatus.find((i: any) => i._id === 'completed');
      completed = c ? c.count : 0;
    } else if (typeof s.byStatus === 'number') {
      completed = s.byStatus;
    }

    return {
      total: Number(total),
      completed: Number(completed),
      active: Math.max(0, Number(total) - Number(completed))
    };
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(val => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
        this.loadNotes();
      });

    this.loadNotes();
    this.loadStats();
  }

  // --- Helpers ---
  isSharedFilter(): boolean {
    const f = this.activeFilter();
    return f === 'shared' || f === 'shared-by-me';
  }

  handleSharedAction(action: string, id: string) {
    if (action === 'view') {
      this.onEditNote(id);
    } else if (action === 'unshare') {
      // Logic to unshare note
      console.log('Unshare requested for', id);
    }
  }

  // --- Data Loading ---

  loadNotes() {
    this.isLoading.set(true);
    const filter = this.activeFilter();

    // Reset pagination for special filters that might not support it
    if (this.isSpecialFilter()) {
      this.totalPages.set(1); 
    }

    // --- 0. Calendar (Handled by Child) ---
    if (filter === 'calendar') {
      this.isLoading.set(false); // Child component handles loading
      return;
    }

    // --- 1. Recent Activity ---
    if (filter === 'recent') {
      this.notesService.getRecentActivity().subscribe({
        next: (res) => {
          // Recent Activity data structure might be slightly different
          // The RecentActivityComponent knows how to handle the "NoteActivity" shape
          // We assume the service returns { data: { notes: [...] } }
          this.notes.set(res.data.notes);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load recent activity', err);
          this.isLoading.set(false);
        }
      });
      return;
    }

    // --- 2. Shared With Me ---
    if (filter === 'shared') {
      this.notesService.getSharedNotesWithMe().subscribe({
        next: (res) => {
          this.notes.set(res.data.notes);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load shared notes', err);
          this.isLoading.set(false);
        }
      });
      return;
    }

    // --- 3. Shared By Me ---
    if (filter === 'shared-by-me') {
      this.notesService.getNotesSharedByMe().subscribe({
        next: (res) => {
          this.notes.set(res.data.notes);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load shared by me notes', err);
          this.isLoading.set(false);
        }
      });
      return;
    }

    // --- 4. Trash Bin ---
    if (filter === 'trash') {
      this.notesService.getTrashBin().subscribe({
        next: (res) => {
          this.notes.set(res.data.notes);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
      return;
    }

    // --- 5. Standard Filters (All, Favorites, Archived) ---
    const params: NoteFilterParams = {
      page: this.currentPage(),
      limit: 12,
      search: this.searchQuery(),
      sort: '-createdAt'
    };

    if (filter === 'favorites') (params as any).isPinned = true;
    if (filter === 'archived') params.status = 'archived';

    this.notesService.getNotes(params).subscribe({
      next: (res) => {
        this.notes.set(res.data.notes);
        this.totalPages.set(res.data.pagination?.pages || 1);
        this.totalNotes.set(res.data.pagination?.total || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  loadStats() {
    this.notesService.getNoteStatistics().subscribe(res => {
      this.stats.set(res.data);
    });
  }

  // --- UI Logic ---

  setFilter(filter: FilterType) {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.searchControl.setValue('', {emitEvent: false}); // Clear search, prevent double trigger
    this.searchQuery.set('');
    this.loadNotes();
  }

  changePage(delta: number) {
    const newPage = this.currentPage() + delta;
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      this.loadNotes();
    }
  }

  // Helper to check if we should hide pagination
  isSpecialFilter(): boolean {
    const f = this.activeFilter();
    return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent' || f === 'calendar';
  }

  getEmptyMessage() {
    const map: Record<string, {title: string, desc: string}> = {
      all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
      favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
      shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
      'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
      recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
      archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
      trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' },
      calendar: { title: 'Calendar', desc: '' } // Shouldn't be seen
    };
    return map[this.activeFilter()] || map['all'];
  }

  // --- Action Handlers ---

  onEditNote(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onPinNote(id: string) {
    this.notesService.togglePinNote(id).subscribe(() => {
      this.notes.update(notes => 
        notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
      );
      if (this.activeFilter() === 'favorites') this.loadNotes();
    });
  }

  onArchiveNote(id: string) {
    this.notesService.archiveNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats();
    });
  }

  onDeleteNote(id: string) {
    if(!confirm('Move this note to trash?')) return;
    this.notesService.deleteNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats();
    });
  }

  onHardDeleteNote(id: string) {
    if(!confirm('Permanently delete this note? This cannot be undone.')) return;
    this.notesService.hardDeleteNote(id).subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
    });
  }

  onRestoreNote(id: string) {
    const action = this.activeFilter() === 'trash' 
      ? this.notesService.restoreFromTrash(id)
      : this.notesService.restoreNote(id);

    action.subscribe(() => {
      this.notes.update(notes => notes.filter(n => n._id !== id));
      this.loadStats();
    });
  }

  onEmptyTrash() {
    if(!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
    this.notesService.emptyTrash().subscribe(() => {
      this.notes.set([]);
    });
  }

  onShareNote(id: string) {
    console.log('Shared note:', id);
  }

  onConvertToTask(id: string) {
    this.notesService.convertToTask(id).subscribe(() => {
       this.loadNotes();
    });
  }

  onLinkNoteRequest(sourceId: string) {
    const ref:any = this.dialogServices.openNoteLinkDialog(sourceId);
    ref.onClose.subscribe((targetNote: Note) => {
      if (targetNote) {
        this.notesService.linkNote(sourceId, targetNote._id).subscribe({
          next: (res) => {
            this.notes.update(notes => 
              notes.map(n => n._id === sourceId ? res.data.note : n)
            );
          },
          error: (err) => console.error('Failed to link note', err)
        });
      }
    });
  }

  exportNotes() {
    this.dialogServices.openNoteExport();
  }
}

// import { Component, inject, signal, effect, computed, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { debounceTime, distinctUntilChanged } from 'rxjs';
// import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
// import { NoteCardComponent, User } from '../note-card/note-card.component';
// import { SharedNoteCardComponent } from '../shared-note-card.component';
// import { CalendarViewComponent } from '../calendar-view/calendar-view.component'; // Import Calendar View
// import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// import { NoteService } from '../../../core/services/notes.service';
// import { RecentActivityComponent } from '../recent-activity/recent-activity.component';

// type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash' | 'calendar';

// @Component({
//   selector: 'app-note-list',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     RouterModule, 
//     ReactiveFormsModule, 
//     NoteCardComponent, 
//     SharedNoteCardComponent,
//     RecentActivityComponent,
//     CalendarViewComponent // Added to imports
//   ],
//   encapsulation: ViewEncapsulation.None,
//   template: `
//     <div class="dashboard-container">
      
//       <!-- ==================== SIDEBAR FILTERS ==================== -->
//       <aside class="filters-sidebar">
        
//         <!-- Compose Button -->
//         <div class="compose-btn-wrapper">
//           <button class="btn-compose" routerLink="/notes/create">
//             <span class="icon"><i class="pi pi-plus"></i></span> 
//             <span class="label">New Note</span>
//           </button>
//         </div>

//         <!-- Navigation -->
//         <nav class="nav-menu custom-scrollbar">
          
//           <!-- Library Group -->
//           <div class="nav-group">
//             <label>Library</label>
//             <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
//               <span class="icon"><i class="pi pi-file"></i></span> 
//               <span class="text">All Notes</span>
//               <span class="count">{{ dashboardStats().total }}</span>
//             </button>
//             <button class="nav-item" [class.active]="activeFilter() === 'favorites'" (click)="setFilter('favorites')">
//               <span class="icon"><i class="pi pi-star"></i></span> 
//               <span class="text">Favorites</span>
//             </button>
//             <button class="nav-item" [class.active]="activeFilter() === 'recent'" (click)="setFilter('recent')">
//               <span class="icon"><i class="pi pi-clock"></i></span> 
//               <span class="text">Recent Activity</span>
//             </button>
//             <button class="nav-item" [class.active]="activeFilter() === 'calendar'" (click)="setFilter('calendar')">
//               <span class="icon"><i class="pi pi-calendar"></i></span> 
//               <span class="text">Calendar</span>
//             </button>
//           </div>

//           <div class="divider"></div>

//           <!-- Sharing Group -->
//           <div class="nav-group">
//             <label>Sharing</label>
//             <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
//               <span class="icon"><i class="pi pi-users"></i></span> 
//               <span class="text">Shared with me</span>
//             </button>
//             <button class="nav-item" [class.active]="activeFilter() === 'shared-by-me'" (click)="setFilter('shared-by-me')">
//               <span class="icon"><i class="pi pi-share-alt"></i></span> 
//               <span class="text">Shared by me</span>
//             </button>
//           </div>

//           <div class="divider"></div>

//           <!-- Organization Group -->
//           <div class="nav-group">
//             <label>Organization</label>
//             <button class="nav-item" [class.active]="activeFilter() === 'archived'" (click)="setFilter('archived')">
//               <span class="icon"><i class="pi pi-box"></i></span> 
//               <span class="text">Archived</span>
//             </button>
//             <button class="nav-item danger" [class.active]="activeFilter() === 'trash'" (click)="setFilter('trash')">
//               <span class="icon"><i class="pi pi-trash"></i></span> 
//               <span class="text">Trash Bin</span>
//             </button>
//           </div>
//         </nav>

//         <!-- Stats Widget -->
//         @if (stats()) {
//         <div class="stats-widget glass-panel">
//           <div class="stat-header">
//             <h3>Overview</h3>
//             <i class="pi pi-chart-bar"></i>
//           </div>
//           <div class="stat-row">
//             <span>Active</span>
//             <span class="val">{{ dashboardStats().active }}</span>
//           </div>
//            <div class="stat-row">
//             <span>Completed</span>
//             <span class="val success">{{ dashboardStats().completed }}</span>
//           </div>
//         </div>
//         }
//       </aside>

//       <!-- ==================== MAIN CONTENT ==================== -->
//       <main class="main-content">
        
//         <!-- Top Bar -->
//         <header class="top-bar glass-panel">
//           <div class="header-left">
//             <div class="mobile-toggle"><i class="pi pi-bars"></i></div> <!-- Placeholder for mobile -->
//             <div class="context-title">
//               @switch (activeFilter()) {
//                 @case ('recent') { <i class="pi pi-clock"></i> Recent Activity }
//                 @case ('calendar') { <i class="pi pi-calendar"></i> Calendar }
//                 @case ('shared') { <i class="pi pi-users"></i> Shared With Me }
//                 @case ('shared-by-me') { <i class="pi pi-share-alt"></i> Shared By Me }
//                 @case ('favorites') { <i class="pi pi-star-fill"></i> Favorites }
//                 @case ('trash') { <i class="pi pi-trash"></i> Trash }
//                 @case ('archived') { <i class="pi pi-box"></i> Archive }
//                 @default { <i class="pi pi-file"></i> All Notes }
//               }
//             </div>
//           </div>

//           <!-- Search (Hidden on Calendar/Recent) -->
//           @if (activeFilter() !== 'calendar' && activeFilter() !== 'recent') {
//             <div class="search-wrapper">
//               <i class="pi pi-search search-icon"></i>
//               <input type="text" [formControl]="searchControl" placeholder="Search notes..." class="search-input">
//             </div>
//           }
          
//           <div class="actions-wrapper">
//             <!-- Trash Actions -->
//             @if (activeFilter() === 'trash') {
//               <button class="btn-action danger" (click)="onEmptyTrash()" title="Empty Trash">
//                  <i class="pi pi-trash"></i> Empty
//               </button>
//             }

//             <!-- Export -->
//             <button class="btn-icon" (click)="exportNotes()" title="Export Data">
//               <i class="pi pi-download"></i>
//             </button>

//             <div class="divider-v"></div>

//             <!-- View Toggles (Hidden for Recent/Calendar) -->
//             @if (activeFilter() !== 'recent' && activeFilter() !== 'calendar') {
//               <div class="view-controls">
//                 <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
//                   <i class="pi pi-th-large"></i>
//                 </button>
//                 <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
//                   <i class="pi pi-list"></i>
//                 </button>
//               </div>
//             }
//           </div>
//         </header>

//         <!-- Scrollable Content Area -->
//         <div class="content-area custom-scrollbar" [class.no-padding]="activeFilter() === 'calendar'">
          
//           <!-- Loading -->
//           @if (isLoading() && activeFilter() !== 'calendar') {
//           <div class="loading-state">
//             <div class="spinner"></div>
//             <p>Syncing notes...</p>
//           </div>
//           }

//           <!-- Empty State (Not for Calendar) -->
//           @if (!isLoading() && notes().length === 0 && activeFilter() !== 'calendar') {
//           <div class="empty-state">
//             <div class="illustration">
//               @if (activeFilter() === 'trash') { 🗑️ }
//               @else if (activeFilter() === 'favorites') { ⭐ }
//               @else if (activeFilter() === 'recent') { 🕰️ }
//               @else if (activeFilter() === 'shared') { 📪 }
//               @else if (activeFilter() === 'shared-by-me') { 📤 }
//               @else { 📝 }
//             </div>
//             <h3>{{ getEmptyMessage().title }}</h3>
//             <p>{{ getEmptyMessage().desc }}</p>
//             @if (activeFilter() === 'all') {
//               <button class="btn-primary" routerLink="/notes/create">Create your first note</button>
//             }
//           </div>
//           }

//           <!-- CONTENT VIEW SWITCHER -->
//           @if (!isLoading() || activeFilter() === 'calendar') {
            
//             <!-- 1. Recent Activity View -->
//             @if (activeFilter() === 'recent') {
//               <app-recent-activity></app-recent-activity>
//             } 

//             <!-- 2. Calendar View -->
//             @else if (activeFilter() === 'calendar') {
//               <app-datepicker-view></app-datepicker-view>
//             }
            
//             <!-- 3. Standard Grid/List View -->
//             @else if (notes().length > 0) {
//               <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
//                 @for (note of notes(); track note._id) {
                  
//                   <!-- Shared Note Card -->
//                   @if (isSharedFilter()) {
//                     <app-shared-note-card
//                       [note]="note"
//                       [viewMode]="viewMode()"
//                       [filterType]="activeFilter() === 'shared-by-me' ? 'shared-by-me' : 'shared'"
//                       (action)="handleSharedAction($event, note._id)">
//                     </app-shared-note-card>
//                   } 
                  
//                   <!-- Standard Note Card -->
//                   @else {
//                     <app-note-card 
//                       [note]="note" 
//                       [viewMode]="viewMode()"
//                       [availableUsers]="availableUsers()"
//                       (edit)="onEditNote($event)" 
//                       (pin)="onPinNote($event)"
//                       (delete)="onDeleteNote($event)" 
//                       (deleteHard)="onHardDeleteNote($event)"
//                       (archive)="onArchiveNote($event)" 
//                       (restore)="onRestoreNote($event)"
//                       (share)="onShareNote($event)"
//                       (linkClick)="onLinkNoteRequest($event)"
//                       (convertToTask)="onConvertToTask($event)">
//                     </app-note-card>
//                   }
//                 }
//               </div>
//             }
//           }

//           <!-- Pagination (Hide for Recent/Trash/Calendar if needed) -->
//           @if (!isLoading() && totalPages() > 1 && !isSpecialFilter()) {
//           <div class="pagination">
//             <button class="page-btn" (click)="changePage(-1)" [disabled]="currentPage() === 1">
//               <i class="pi pi-chevron-left"></i> Previous
//             </button>
//             <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
//             <button class="page-btn" (click)="changePage(1)" [disabled]="currentPage() === totalPages()">
//               Next <i class="pi pi-chevron-right"></i>
//             </button>
//           </div>
//           }
//         </div>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* ==================== THEME VARIABLES MAPPING ==================== */
//     :host {
//       display: block;
//       height: 100%;
//       overflow: hidden;
//       --sidebar-w: 260px;
//       --topbar-h: 64px;
      
//       /* Mapping to Provided Theme Tokens */
//       --bg-app: var(--bg-primary);
//       --bg-panel: var(--bg-secondary);
//       --border-color: var(--border-secondary);
//       --primary: var(--accent-primary);
//       --text-main: var(--text-primary);
//       --text-muted: var(--text-secondary);
//     }

//     .dashboard-container {
//       display: flex;
//       height: 100%;
//       background-color: var(--bg-app);
//       color: var(--text-main);
//     }

//     /* ==================== SIDEBAR ==================== */
//     .filters-sidebar {
//       width: var(--sidebar-w);
//       background: var(--bg-panel);
//       border-right: 1px solid var(--border-color);
//       display: flex;
//       flex-direction: column;
//       padding: var(--spacing-lg);
//       gap: var(--spacing-xl);
//       flex-shrink: 0;

//       .compose-btn-wrapper {
//         .btn-compose {
//           width: 100%;
//           background: var(--primary);
//           color: white;
//           border: none;
//           padding: 12px;
//           border-radius: var(--ui-border-radius-lg);
//           display: flex; align-items: center; justify-content: center; gap: 8px;
//           font-weight: 600;
//           font-size: var(--font-size-md);
//           cursor: pointer;
//           transition: var(--transition-base);
//           box-shadow: var(--shadow-md);

//           &:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
//           .icon { font-size: 1rem; }
//         }
//       }

//       .nav-menu {
//         display: flex; flex-direction: column; gap: var(--spacing-md);
//         flex: 1;
//         overflow-y: auto;
//         padding-right: 4px; /* Space for scrollbar */

//         .nav-group {
//           display: flex; flex-direction: column; gap: 4px;
//           label { 
//             font-size: 11px; 
//             text-transform: uppercase; 
//             font-weight: 700; 
//             color: var(--text-muted); 
//             margin-bottom: 8px; 
//             padding-left: 12px;
//             letter-spacing: 0.5px;
//           }
//         }

//         .nav-item {
//           display: flex; align-items: center; gap: 12px;
//           padding: 10px 12px;
//           border: none;
//           background: transparent;
//           color: var(--text-muted);
//           border-radius: var(--ui-border-radius);
//           cursor: pointer;
//           font-size: var(--font-size-sm);
//           font-weight: 500;
//           transition: all 0.2s ease;
//           text-align: left;

//           &:hover { background: var(--bg-ternary); color: var(--text-main); }
//           &.active { 
//             background: color-mix(in srgb, var(--primary) 10%, transparent); 
//             color: var(--primary); 
//             font-weight: 600; 
            
//             .count { background: var(--primary); color: white; }
//           }
//           &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
//           &.danger.active { background: var(--color-error-bg); color: var(--color-error); }

//           .icon { font-size: 1.1em; width: 20px; text-align: center; }
//           .text { flex: 1; }
//           .count { 
//             font-size: 10px; 
//             background: var(--bg-ternary); 
//             padding: 2px 8px; 
//             border-radius: 12px; 
//             transition: all 0.2s;
//           }
//         }

//         .divider { height: 1px; background: var(--border-color); margin: 8px 0; opacity: 0.5; }
//       }

//       .stats-widget {
//         padding: var(--spacing-md);
//         border-radius: var(--ui-border-radius);
//         border: 1px solid var(--border-color);
//         background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
//         margin-top: auto;
        
//         .stat-header { 
//           display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; 
//           h3 { font-size: 12px; font-weight: 600; margin: 0; color: var(--text-muted); }
//           i { color: var(--primary); }
//         }
//         .stat-row {
//           display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;
//           .val { font-weight: 600; &.success { color: var(--color-success); } }
//         }
//       }
//     }

//     /* ==================== MAIN AREA ==================== */
//     .main-content {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       position: relative;
//       min-width: 0; /* Prevents flex overflow */
//     }

//     .top-bar {
//       height: var(--topbar-h);
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: 0 var(--spacing-xl);
//       border-bottom: 1px solid var(--border-color);
//       /* Glassmorphism */
//       background: var(--glass-bg-c);
//       backdrop-filter: blur(var(--glass-blur-c));
//       position: sticky;
//       top: 0;
//       z-index: 10;

//       .header-left {
//         display: flex; align-items: center; gap: 12px;
//         .context-title {
//           font-weight: 600; color: var(--text-main); font-size: 16px;
//           display: flex; align-items: center; gap: 8px;
//           i { color: var(--primary); }
//         }
//       }

//       .search-wrapper {
//         display: flex; align-items: center; gap: 10px;
//         background: var(--bg-panel);
//         border: 1px solid var(--border-color);
//         padding: 8px 12px;
//         border-radius: var(--ui-border-radius-xl);
//         width: 300px;
//         transition: all 0.2s;

//         &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px var(--accent-focus); }
//         .search-icon { color: var(--text-muted); }
        
//         .search-input {
//           border: none; background: transparent; outline: none; width: 100%;
//           color: var(--text-main); font-size: var(--font-size-sm);
//         }
//       }

//       .actions-wrapper {
//         display: flex; align-items: center; gap: 8px;

//         .btn-icon {
//           width: 36px; height: 36px;
//           border-radius: var(--ui-border-radius);
//           border: 1px solid transparent;
//           background: transparent;
//           color: var(--text-muted);
//           cursor: pointer;
//           display: flex; align-items: center; justify-content: center;
//           transition: all 0.2s;

//           &:hover { background: var(--bg-ternary); color: var(--text-main); }
//           &.active { background: var(--bg-ternary); color: var(--primary); border-color: var(--border-color); }
//         }
        
//         .btn-action {
//           padding: 6px 12px; border-radius: var(--ui-border-radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
//           &.danger { background: var(--color-error-bg); color: var(--color-error); &:hover { background: #fee2e2; } }
//         }

//         .divider-v { width: 1px; height: 20px; background: var(--border-color); margin: 0 8px; }
//         .view-controls { display: flex; gap: 4px; background: var(--bg-panel); padding: 2px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-color); }
//       }
//     }

//     .content-area {
//       flex: 1;
//       overflow-y: auto;
//       padding: var(--spacing-xl);
//       position: relative;
      
//       /* Specific styling for calendar mode to use full space */
//       &.no-padding {
//         padding: 0;
//       }
//     }

//     /* ==================== LOADING & EMPTY STATES ==================== */
//     .loading-state {
//       display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
//       color: var(--text-muted);
//       .spinner {
//         width: 40px; height: 40px; border: 3px solid var(--bg-ternary); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
//       }
//     }
//     @keyframes spin { to { transform: rotate(360deg); } }

//     .empty-state {
//       text-align: center; margin-top: 100px;
//       .illustration { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; filter: grayscale(0.5); }
//       h3 { font-size: 1.25rem; margin-bottom: 8px; color: var(--text-main); }
//       p { color: var(--text-muted); margin-bottom: 24px; }
//       .btn-primary { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600; }
//     }

//     /* ==================== GRID/LIST LAYOUTS ==================== */
//     .notes-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//       gap: var(--spacing-lg);
//       padding-bottom: 40px;

//       &.list-layout {
//         display: flex; flex-direction: column; gap: var(--spacing-sm);
//       }
//     }

//     /* ==================== PAGINATION ==================== */
//     .pagination {
//       display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; padding-bottom: 20px;
//       .page-btn {
//         background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 16px; border-radius: var(--ui-border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px;
//         &:disabled { opacity: 0.5; cursor: not-allowed; }
//         &:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
//       }
//       .page-info { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
//     }
//   `]
// })
// export class NoteListComponent {
//   private notesService = inject(NoteService);
//   private dialogServices = inject(DynamicDialogServices);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);

//   // --- State Signals ---
//   notes = signal<Note[]>([]); // This will also hold Activity Data due to shared structure or mapping
//   stats = signal<NoteStatistics | null>(null);
//   isLoading = signal(true);
//   viewMode = signal<'grid' | 'list'>('grid');
  
//   // Pagination
//   currentPage = signal(1);
//   totalPages = signal(1);
//   totalNotes = signal(0);

//   // Filters State
//   activeFilter = signal<FilterType>('all');
//   searchQuery = signal('');
  
//   // Users for sharing
//   availableUsers = signal<User[]>([]); 

//   // Search Form
//   searchControl = this.fb.control('');

//   // --- Computed Stats for Dashboard ---
//   dashboardStats = computed(() => {
//     const s = this.stats() as any; 
//     if (!s) return { total: 0, active: 0, completed: 0 };

//     const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    
//     let completed = 0;
//     if (Array.isArray(s.byStatus)) {
//       const c = s.byStatus.find((i: any) => i._id === 'completed');
//       completed = c ? c.count : 0;
//     } else if (typeof s.byStatus === 'number') {
//       completed = s.byStatus;
//     }

//     return {
//       total: Number(total),
//       completed: Number(completed),
//       active: Math.max(0, Number(total) - Number(completed))
//     };
//   });

//   constructor() {
//     this.searchControl.valueChanges
//       .pipe(debounceTime(300), distinctUntilChanged())
//       .subscribe(val => {
//         this.searchQuery.set(val || '');
//         this.currentPage.set(1);
//         this.loadNotes();
//       });

//     this.loadNotes();
//     this.loadStats();
//   }

//   // --- Helpers ---
//   isSharedFilter(): boolean {
//     const f = this.activeFilter();
//     return f === 'shared' || f === 'shared-by-me';
//   }

//   handleSharedAction(action: string, id: string) {
//     if (action === 'view') {
//       this.onEditNote(id);
//     } else if (action === 'unshare') {
//       // Logic to unshare note
//       console.log('Unshare requested for', id);
//     }
//   }

//   // --- Data Loading ---

//   loadNotes() {
//     this.isLoading.set(true);
//     const filter = this.activeFilter();

//     // Reset pagination for special filters that might not support it
//     if (this.isSpecialFilter()) {
//       this.totalPages.set(1); 
//     }

//     // --- 0. Calendar (Handled by Child) ---
//     if (filter === 'calendar') {
//       this.isLoading.set(false); // Child component handles loading
//       return;
//     }

//     // --- 1. Recent Activity ---
//     if (filter === 'recent') {
//       this.notesService.getRecentActivity().subscribe({
//         next: (res) => {
//           // Recent Activity data structure might be slightly different
//           // The RecentActivityComponent knows how to handle the "NoteActivity" shape
//           // We assume the service returns { data: { notes: [...] } }
//           this.notes.set(res.data.notes);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Failed to load recent activity', err);
//           this.isLoading.set(false);
//         }
//       });
//       return;
//     }

//     // --- 2. Shared With Me ---
//     if (filter === 'shared') {
//       this.notesService.getSharedNotesWithMe().subscribe({
//         next: (res) => {
//           this.notes.set(res.data.notes);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Failed to load shared notes', err);
//           this.isLoading.set(false);
//         }
//       });
//       return;
//     }

//     // --- 3. Shared By Me ---
//     if (filter === 'shared-by-me') {
//       this.notesService.getNotesSharedByMe().subscribe({
//         next: (res) => {
//           this.notes.set(res.data.notes);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Failed to load shared by me notes', err);
//           this.isLoading.set(false);
//         }
//       });
//       return;
//     }

//     // --- 4. Trash Bin ---
//     if (filter === 'trash') {
//       this.notesService.getTrashBin().subscribe({
//         next: (res) => {
//           this.notes.set(res.data.notes);
//           this.isLoading.set(false);
//         },
//         error: () => this.isLoading.set(false)
//       });
//       return;
//     }

//     // --- 5. Standard Filters (All, Favorites, Archived) ---
//     const params: NoteFilterParams = {
//       page: this.currentPage(),
//       limit: 12,
//       search: this.searchQuery(),
//       sort: '-createdAt'
//     };

//     if (filter === 'favorites') (params as any).isPinned = true;
//     if (filter === 'archived') params.status = 'archived';

//     this.notesService.getNotes(params).subscribe({
//       next: (res) => {
//         this.notes.set(res.data.notes);
//         this.totalPages.set(res.data.pagination?.pages || 1);
//         this.totalNotes.set(res.data.pagination?.total || 0);
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   loadStats() {
//     this.notesService.getNoteStatistics().subscribe(res => {
//       this.stats.set(res.data);
//     });
//   }

//   // --- UI Logic ---

//   setFilter(filter: FilterType) {
//     if (this.activeFilter() === filter) return;
//     this.activeFilter.set(filter);
//     this.currentPage.set(1);
//     this.searchControl.setValue('', {emitEvent: false}); // Clear search, prevent double trigger
//     this.searchQuery.set('');
//     this.loadNotes();
//   }

//   changePage(delta: number) {
//     const newPage = this.currentPage() + delta;
//     if (newPage >= 1 && newPage <= this.totalPages()) {
//       this.currentPage.set(newPage);
//       this.loadNotes();
//     }
//   }

//   // Helper to check if we should hide pagination
//   isSpecialFilter(): boolean {
//     const f = this.activeFilter();
//     return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent' || f === 'calendar';
//   }

//   getEmptyMessage() {
//     const map: Record<string, {title: string, desc: string}> = {
//       all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
//       favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
//       shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
//       'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
//       recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
//       archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
//       trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' },
//       calendar: { title: 'Calendar', desc: '' } // Shouldn't be seen
//     };
//     return map[this.activeFilter()] || map['all'];
//   }

//   // --- Action Handlers ---

//   onEditNote(id: string) {
//     this.router.navigate(['/notes', id]);
//   }

//   onPinNote(id: string) {
//     this.notesService.togglePinNote(id).subscribe(() => {
//       this.notes.update(notes => 
//         notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
//       );
//       if (this.activeFilter() === 'favorites') this.loadNotes();
//     });
//   }

//   onArchiveNote(id: string) {
//     this.notesService.archiveNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//       this.loadStats();
//     });
//   }

//   onDeleteNote(id: string) {
//     if(!confirm('Move this note to trash?')) return;
//     this.notesService.deleteNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//       this.loadStats();
//     });
//   }

//   onHardDeleteNote(id: string) {
//     if(!confirm('Permanently delete this note? This cannot be undone.')) return;
//     this.notesService.hardDeleteNote(id).subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//     });
//   }

//   onRestoreNote(id: string) {
//     const action = this.activeFilter() === 'trash' 
//       ? this.notesService.restoreFromTrash(id)
//       : this.notesService.restoreNote(id);

//     action.subscribe(() => {
//       this.notes.update(notes => notes.filter(n => n._id !== id));
//       this.loadStats();
//     });
//   }

//   onEmptyTrash() {
//     if(!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
//     this.notesService.emptyTrash().subscribe(() => {
//       this.notes.set([]);
//     });
//   }

//   onShareNote(id: string) {
//     console.log('Shared note:', id);
//   }

//   onConvertToTask(id: string) {
//     this.notesService.convertToTask(id).subscribe(() => {
//        this.loadNotes();
//     });
//   }

//   onLinkNoteRequest(sourceId: string) {
//     const ref:any = this.dialogServices.openNoteLinkDialog(sourceId);
//     ref.onClose.subscribe((targetNote: Note) => {
//       if (targetNote) {
//         this.notesService.linkNote(sourceId, targetNote._id).subscribe({
//           next: (res) => {
//             this.notes.update(notes => 
//               notes.map(n => n._id === sourceId ? res.data.note : n)
//             );
//           },
//           error: (err) => console.error('Failed to link note', err)
//         });
//       }
//     });
//   }

//   exportNotes() {
//     this.dialogServices.openNoteExport();
//   }
// }
// // import { Component, inject, signal, effect, computed, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule, Router } from '@angular/router';
// // import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// // import { debounceTime, distinctUntilChanged } from 'rxjs';
// // import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
// // import { NoteCardComponent, User } from '../note-card/note-card.component';
// // import { SharedNoteCardComponent } from '../shared-note-card.component';
// // import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// // import { NoteService } from '../../../core/services/notes.service';
// // import { RecentActivityComponent } from '../recent-activity/recent-activity.component';

// // type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash';

// // @Component({
// //   selector: 'app-note-list',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     RouterModule, 
// //     ReactiveFormsModule, 
// //     NoteCardComponent, 
// //     SharedNoteCardComponent,
// //     RecentActivityComponent // Added to imports
// //   ],
// //   encapsulation: ViewEncapsulation.None,
// //   template: `
// //     <div class="dashboard-container">
      
// //       <!-- ==================== SIDEBAR FILTERS ==================== -->
// //       <aside class="filters-sidebar">
        
// //         <!-- Compose Button -->
// //         <div class="compose-btn-wrapper">
// //           <button class="btn-compose" routerLink="/notes/create">
// //             <span class="icon"><i class="pi pi-plus"></i></span> 
// //             <span class="label">New Note</span>
// //           </button>
// //         </div>

// //         <!-- Navigation -->
// //         <nav class="nav-menu custom-scrollbar">
          
// //           <!-- Library Group -->
// //           <div class="nav-group">
// //             <label>Library</label>
// //             <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
// //               <span class="icon"><i class="pi pi-file"></i></span> 
// //               <span class="text">All Notes</span>
// //               <span class="count">{{ dashboardStats().total }}</span>
// //             </button>
// //             <button class="nav-item" [class.active]="activeFilter() === 'favorites'" (click)="setFilter('favorites')">
// //               <span class="icon"><i class="pi pi-star"></i></span> 
// //               <span class="text">Favorites</span>
// //             </button>
// //             <button class="nav-item" [class.active]="activeFilter() === 'recent'" (click)="setFilter('recent')">
// //               <span class="icon"><i class="pi pi-clock"></i></span> 
// //               <span class="text">Recent Activity</span>
// //             </button>
// //           </div>

// //           <div class="divider"></div>

// //           <!-- Sharing Group -->
// //           <div class="nav-group">
// //             <label>Sharing</label>
// //             <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
// //               <span class="icon"><i class="pi pi-users"></i></span> 
// //               <span class="text">Shared with me</span>
// //             </button>
// //             <button class="nav-item" [class.active]="activeFilter() === 'shared-by-me'" (click)="setFilter('shared-by-me')">
// //               <span class="icon"><i class="pi pi-share-alt"></i></span> 
// //               <span class="text">Shared by me</span>
// //             </button>
// //           </div>

// //           <div class="divider"></div>

// //           <!-- Organization Group -->
// //           <div class="nav-group">
// //             <label>Organization</label>
// //             <button class="nav-item" [class.active]="activeFilter() === 'archived'" (click)="setFilter('archived')">
// //               <span class="icon"><i class="pi pi-box"></i></span> 
// //               <span class="text">Archived</span>
// //             </button>
// //             <button class="nav-item danger" [class.active]="activeFilter() === 'trash'" (click)="setFilter('trash')">
// //               <span class="icon"><i class="pi pi-trash"></i></span> 
// //               <span class="text">Trash Bin</span>
// //             </button>
// //           </div>
// //         </nav>

// //         <!-- Stats Widget -->
// //         @if (stats()) {
// //         <div class="stats-widget glass-panel">
// //           <div class="stat-header">
// //             <h3>Overview</h3>
// //             <i class="pi pi-chart-bar"></i>
// //           </div>
// //           <div class="stat-row">
// //             <span>Active</span>
// //             <span class="val">{{ dashboardStats().active }}</span>
// //           </div>
// //            <div class="stat-row">
// //             <span>Completed</span>
// //             <span class="val success">{{ dashboardStats().completed }}</span>
// //           </div>
// //         </div>
// //         }
// //       </aside>

// //       <!-- ==================== MAIN CONTENT ==================== -->
// //       <main class="main-content">
        
// //         <!-- Top Bar -->
// //         <header class="top-bar glass-panel">
// //           <div class="header-left">
// //             <div class="mobile-toggle"><i class="pi pi-bars"></i></div> <!-- Placeholder for mobile -->
// //             <div class="context-title">
// //               @switch (activeFilter()) {
// //                 @case ('recent') { <i class="pi pi-clock"></i> Recent Activity }
// //                 @case ('shared') { <i class="pi pi-users"></i> Shared With Me }
// //                 @case ('shared-by-me') { <i class="pi pi-share-alt"></i> Shared By Me }
// //                 @case ('favorites') { <i class="pi pi-star-fill"></i> Favorites }
// //                 @case ('trash') { <i class="pi pi-trash"></i> Trash }
// //                 @case ('archived') { <i class="pi pi-box"></i> Archive }
// //                 @default { <i class="pi pi-file"></i> All Notes }
// //               }
// //             </div>
// //           </div>

// //           <div class="search-wrapper">
// //             <i class="pi pi-search search-icon"></i>
// //             <input type="text" [formControl]="searchControl" placeholder="Search notes..." class="search-input">
// //           </div>
          
// //           <div class="actions-wrapper">
// //             <!-- Trash Actions -->
// //             @if (activeFilter() === 'trash') {
// //               <button class="btn-action danger" (click)="onEmptyTrash()" title="Empty Trash">
// //                  <i class="pi pi-trash"></i> Empty
// //               </button>
// //             }

// //             <!-- Export -->
// //             <button class="btn-icon" (click)="exportNotes()" title="Export Data">
// //               <i class="pi pi-download"></i>
// //             </button>

// //             <div class="divider-v"></div>

// //             <!-- View Toggles (Hidden for Recent Activity) -->
// //             @if (activeFilter() !== 'recent') {
// //               <div class="view-controls">
// //                 <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
// //                   <i class="pi pi-th-large"></i>
// //                 </button>
// //                 <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
// //                   <i class="pi pi-list"></i>
// //                 </button>
// //               </div>
// //             }
// //           </div>
// //         </header>

// //         <!-- Scrollable Content Area -->
// //         <div class="content-area custom-scrollbar">
          
// //           <!-- Loading -->
// //           @if (isLoading()) {
// //           <div class="loading-state">
// //             <div class="spinner"></div>
// //             <p>Syncing notes...</p>
// //           </div>
// //           }

// //           <!-- Empty State -->
// //           @if (!isLoading() && notes().length === 0) {
// //           <div class="empty-state">
// //             <div class="illustration">
// //               @if (activeFilter() === 'trash') { 🗑️ }
// //               @else if (activeFilter() === 'favorites') { ⭐ }
// //               @else if (activeFilter() === 'recent') { 🕰️ }
// //               @else if (activeFilter() === 'shared') { 📪 }
// //               @else if (activeFilter() === 'shared-by-me') { 📤 }
// //               @else { 📝 }
// //             </div>
// //             <h3>{{ getEmptyMessage().title }}</h3>
// //             <p>{{ getEmptyMessage().desc }}</p>
// //             @if (activeFilter() === 'all') {
// //               <button class="btn-primary" routerLink="/notes/create">Create your first note</button>
// //             }
// //           </div>
// //           }

// //           <!-- CONTENT VIEW SWITCHER -->
// //           @if (!isLoading() && notes().length > 0) {
            
// //             <!-- 1. Recent Activity View -->
// //             @if (activeFilter() === 'recent') {
// //               <app-recent-activity ></app-recent-activity>
// //             } 
            
// //             <!-- 2. Standard Grid/List View -->
// //             @else {
// //               <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
// //                 @for (note of notes(); track note._id) {
                  
// //                   <!-- Shared Note Card -->
// //                   @if (isSharedFilter()) {
// //                     <app-shared-note-card
// //                       [note]="note"
// //                       [viewMode]="viewMode()"
// //                       [filterType]="activeFilter() === 'shared-by-me' ? 'shared-by-me' : 'shared'"
// //                       (action)="handleSharedAction($event, note._id)">
// //                     </app-shared-note-card>
// //                   } 
                  
// //                   <!-- Standard Note Card -->
// //                   @else {
// //                     <app-note-card 
// //                       [note]="note" 
// //                       [viewMode]="viewMode()"
// //                       [availableUsers]="availableUsers()"
// //                       (edit)="onEditNote($event)" 
// //                       (pin)="onPinNote($event)"
// //                       (delete)="onDeleteNote($event)" 
// //                       (deleteHard)="onHardDeleteNote($event)"
// //                       (archive)="onArchiveNote($event)" 
// //                       (restore)="onRestoreNote($event)"
// //                       (share)="onShareNote($event)"
// //                       (linkClick)="onLinkNoteRequest($event)"
// //                       (convertToTask)="onConvertToTask($event)">
// //                     </app-note-card>
// //                   }
// //                 }
// //               </div>
// //             }
// //           }

// //           <!-- Pagination (Hide for Recent/Trash if needed) -->
// //           @if (!isLoading() && totalPages() > 1 && !isSpecialFilter()) {
// //           <div class="pagination">
// //             <button class="page-btn" (click)="changePage(-1)" [disabled]="currentPage() === 1">
// //               <i class="pi pi-chevron-left"></i> Previous
// //             </button>
// //             <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
// //             <button class="page-btn" (click)="changePage(1)" [disabled]="currentPage() === totalPages()">
// //               Next <i class="pi pi-chevron-right"></i>
// //             </button>
// //           </div>
// //           }
// //         </div>
// //       </main>
// //     </div>
// //   `,
// //   styles: [`
// //     /* ==================== THEME VARIABLES MAPPING ==================== */
// //     :host {
// //       display: block;
// //       height: 100%;
// //       overflow: hidden;
// //       --sidebar-w: 260px;
// //       --topbar-h: 64px;
      
// //       /* Mapping to Provided Theme Tokens */
// //       --bg-app: var(--bg-primary);
// //       --bg-panel: var(--bg-secondary);
// //       --border-color: var(--border-secondary);
// //       --primary: var(--accent-primary);
// //       --text-main: var(--text-primary);
// //       --text-muted: var(--text-secondary);
// //     }

// //     .dashboard-container {
// //       display: flex;
// //       height: 100%;
// //       background-color: var(--bg-app);
// //       color: var(--text-main);
// //     }

// //     /* ==================== SIDEBAR ==================== */
// //     .filters-sidebar {
// //       width: var(--sidebar-w);
// //       background: var(--bg-panel);
// //       border-right: 1px solid var(--border-color);
// //       display: flex;
// //       flex-direction: column;
// //       padding: var(--spacing-lg);
// //       gap: var(--spacing-xl);
// //       flex-shrink: 0;

// //       .compose-btn-wrapper {
// //         .btn-compose {
// //           width: 100%;
// //           background: var(--primary);
// //           color: white;
// //           border: none;
// //           padding: 12px;
// //           border-radius: var(--ui-border-radius-lg);
// //           display: flex; align-items: center; justify-content: center; gap: 8px;
// //           font-weight: 600;
// //           font-size: var(--font-size-md);
// //           cursor: pointer;
// //           transition: var(--transition-base);
// //           box-shadow: var(--shadow-md);

// //           &:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
// //           .icon { font-size: 1rem; }
// //         }
// //       }

// //       .nav-menu {
// //         display: flex; flex-direction: column; gap: var(--spacing-md);
// //         flex: 1;
// //         overflow-y: auto;
// //         padding-right: 4px; /* Space for scrollbar */

// //         .nav-group {
// //           display: flex; flex-direction: column; gap: 4px;
// //           label { 
// //             font-size: 11px; 
// //             text-transform: uppercase; 
// //             font-weight: 700; 
// //             color: var(--text-muted); 
// //             margin-bottom: 8px; 
// //             padding-left: 12px;
// //             letter-spacing: 0.5px;
// //           }
// //         }

// //         .nav-item {
// //           display: flex; align-items: center; gap: 12px;
// //           padding: 10px 12px;
// //           border: none;
// //           background: transparent;
// //           color: var(--text-muted);
// //           border-radius: var(--ui-border-radius);
// //           cursor: pointer;
// //           font-size: var(--font-size-sm);
// //           font-weight: 500;
// //           transition: all 0.2s ease;
// //           text-align: left;

// //           &:hover { background: var(--bg-ternary); color: var(--text-main); }
// //           &.active { 
// //             background: color-mix(in srgb, var(--primary) 10%, transparent); 
// //             color: var(--primary); 
// //             font-weight: 600; 
            
// //             .count { background: var(--primary); color: white; }
// //           }
// //           &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
// //           &.danger.active { background: var(--color-error-bg); color: var(--color-error); }

// //           .icon { font-size: 1.1em; width: 20px; text-align: center; }
// //           .text { flex: 1; }
// //           .count { 
// //             font-size: 10px; 
// //             background: var(--bg-ternary); 
// //             padding: 2px 8px; 
// //             border-radius: 12px; 
// //             transition: all 0.2s;
// //           }
// //         }

// //         .divider { height: 1px; background: var(--border-color); margin: 8px 0; opacity: 0.5; }
// //       }

// //       .stats-widget {
// //         padding: var(--spacing-md);
// //         border-radius: var(--ui-border-radius);
// //         border: 1px solid var(--border-color);
// //         background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
// //         margin-top: auto;
        
// //         .stat-header { 
// //           display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; 
// //           h3 { font-size: 12px; font-weight: 600; margin: 0; color: var(--text-muted); }
// //           i { color: var(--primary); }
// //         }
// //         .stat-row {
// //           display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;
// //           .val { font-weight: 600; &.success { color: var(--color-success); } }
// //         }
// //       }
// //     }

// //     /* ==================== MAIN AREA ==================== */
// //     .main-content {
// //       flex: 1;
// //       display: flex;
// //       flex-direction: column;
// //       position: relative;
// //       min-width: 0; /* Prevents flex overflow */
// //     }

// //     .top-bar {
// //       height: var(--topbar-h);
// //       display: flex;
// //       align-items: center;
// //       justify-content: space-between;
// //       padding: 0 var(--spacing-xl);
// //       border-bottom: 1px solid var(--border-color);
// //       /* Glassmorphism */
// //       background: var(--glass-bg-c);
// //       backdrop-filter: blur(var(--glass-blur-c));
// //       position: sticky;
// //       top: 0;
// //       z-index: 10;

// //       .header-left {
// //         display: flex; align-items: center; gap: 12px;
// //         .context-title {
// //           font-weight: 600; color: var(--text-main); font-size: 16px;
// //           display: flex; align-items: center; gap: 8px;
// //           i { color: var(--primary); }
// //         }
// //       }

// //       .search-wrapper {
// //         display: flex; align-items: center; gap: 10px;
// //         background: var(--bg-panel);
// //         border: 1px solid var(--border-color);
// //         padding: 8px 12px;
// //         border-radius: var(--ui-border-radius-xl);
// //         width: 300px;
// //         transition: all 0.2s;

// //         &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px var(--accent-focus); }
// //         .search-icon { color: var(--text-muted); }
        
// //         .search-input {
// //           border: none; background: transparent; outline: none; width: 100%;
// //           color: var(--text-main); font-size: var(--font-size-sm);
// //         }
// //       }

// //       .actions-wrapper {
// //         display: flex; align-items: center; gap: 8px;

// //         .btn-icon {
// //           width: 36px; height: 36px;
// //           border-radius: var(--ui-border-radius);
// //           border: 1px solid transparent;
// //           background: transparent;
// //           color: var(--text-muted);
// //           cursor: pointer;
// //           display: flex; align-items: center; justify-content: center;
// //           transition: all 0.2s;

// //           &:hover { background: var(--bg-ternary); color: var(--text-main); }
// //           &.active { background: var(--bg-ternary); color: var(--primary); border-color: var(--border-color); }
// //         }
        
// //         .btn-action {
// //           padding: 6px 12px; border-radius: var(--ui-border-radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
// //           &.danger { background: var(--color-error-bg); color: var(--color-error); &:hover { background: #fee2e2; } }
// //         }

// //         .divider-v { width: 1px; height: 20px; background: var(--border-color); margin: 0 8px; }
// //         .view-controls { display: flex; gap: 4px; background: var(--bg-panel); padding: 2px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-color); }
// //       }
// //     }

// //     .content-area {
// //       flex: 1;
// //       overflow-y: auto;
// //       padding: var(--spacing-xl);
// //       position: relative;
// //     }

// //     /* ==================== LOADING & EMPTY STATES ==================== */
// //     .loading-state {
// //       display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
// //       color: var(--text-muted);
// //       .spinner {
// //         width: 40px; height: 40px; border: 3px solid var(--bg-ternary); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
// //       }
// //     }
// //     @keyframes spin { to { transform: rotate(360deg); } }

// //     .empty-state {
// //       text-align: center; margin-top: 100px;
// //       .illustration { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; filter: grayscale(0.5); }
// //       h3 { font-size: 1.25rem; margin-bottom: 8px; color: var(--text-main); }
// //       p { color: var(--text-muted); margin-bottom: 24px; }
// //       .btn-primary { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600; }
// //     }

// //     /* ==================== GRID/LIST LAYOUTS ==================== */
// //     .notes-grid {
// //       display: grid;
// //       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
// //       gap: var(--spacing-lg);
// //       padding-bottom: 40px;

// //       &.list-layout {
// //         display: flex; flex-direction: column; gap: var(--spacing-sm);
// //       }
// //     }

// //     /* ==================== PAGINATION ==================== */
// //     .pagination {
// //       display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; padding-bottom: 20px;
// //       .page-btn {
// //         background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 16px; border-radius: var(--ui-border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px;
// //         &:disabled { opacity: 0.5; cursor: not-allowed; }
// //         &:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
// //       }
// //       .page-info { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
// //     }
// //   `]
// // })
// // export class NoteListComponent {
// //   private notesService = inject(NoteService);
// //   private dialogServices = inject(DynamicDialogServices);
// //   private router = inject(Router);
// //   private fb = inject(FormBuilder);

// //   // --- State Signals ---
// //   notes = signal<Note[]>([]); // This will also hold Activity Data due to shared structure or mapping
// //   stats = signal<NoteStatistics | null>(null);
// //   isLoading = signal(true);
// //   viewMode = signal<'grid' | 'list'>('grid');
  
// //   // Pagination
// //   currentPage = signal(1);
// //   totalPages = signal(1);
// //   totalNotes = signal(0);

// //   // Filters State
// //   activeFilter = signal<FilterType>('all');
// //   searchQuery = signal('');
  
// //   // Users for sharing
// //   availableUsers = signal<User[]>([]); 

// //   // Search Form
// //   searchControl = this.fb.control('');

// //   // --- Computed Stats for Dashboard ---
// //   dashboardStats = computed(() => {
// //     const s = this.stats() as any; 
// //     if (!s) return { total: 0, active: 0, completed: 0 };

// //     const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    
// //     let completed = 0;
// //     if (Array.isArray(s.byStatus)) {
// //       const c = s.byStatus.find((i: any) => i._id === 'completed');
// //       completed = c ? c.count : 0;
// //     } else if (typeof s.byStatus === 'number') {
// //       completed = s.byStatus;
// //     }

// //     return {
// //       total: Number(total),
// //       completed: Number(completed),
// //       active: Math.max(0, Number(total) - Number(completed))
// //     };
// //   });

// //   constructor() {
// //     this.searchControl.valueChanges
// //       .pipe(debounceTime(300), distinctUntilChanged())
// //       .subscribe(val => {
// //         this.searchQuery.set(val || '');
// //         this.currentPage.set(1);
// //         this.loadNotes();
// //       });

// //     this.loadNotes();
// //     this.loadStats();
// //   }

// //   // --- Helpers ---
// //   isSharedFilter(): boolean {
// //     const f = this.activeFilter();
// //     return f === 'shared' || f === 'shared-by-me';
// //   }

// //   handleSharedAction(action: string, id: string) {
// //     if (action === 'view') {
// //       this.onEditNote(id);
// //     } else if (action === 'unshare') {
// //       // Logic to unshare note
// //       console.log('Unshare requested for', id);
// //     }
// //   }

// //   // --- Data Loading ---

// //   loadNotes() {
// //     this.isLoading.set(true);
// //     const filter = this.activeFilter();

// //     // Reset pagination for special filters that might not support it
// //     if (this.isSpecialFilter()) {
// //       this.totalPages.set(1); 
// //     }

// //     // --- 1. Recent Activity ---
// //     if (filter === 'recent') {
// //       this.notesService.getRecentActivity().subscribe({
// //         next: (res) => {
// //           // Recent Activity data structure might be slightly different
// //           // The RecentActivityComponent knows how to handle the "NoteActivity" shape
// //           // We assume the service returns { data: { notes: [...] } }
// //           this.notes.set(res.data.notes);
// //           this.isLoading.set(false);
// //         },
// //         error: (err) => {
// //           console.error('Failed to load recent activity', err);
// //           this.isLoading.set(false);
// //         }
// //       });
// //       return;
// //     }

// //     // --- 2. Shared With Me ---
// //     if (filter === 'shared') {
// //       this.notesService.getSharedNotesWithMe().subscribe({
// //         next: (res) => {
// //           this.notes.set(res.data.notes);
// //           this.isLoading.set(false);
// //         },
// //         error: (err) => {
// //           console.error('Failed to load shared notes', err);
// //           this.isLoading.set(false);
// //         }
// //       });
// //       return;
// //     }

// //     // --- 3. Shared By Me ---
// //     if (filter === 'shared-by-me') {
// //       this.notesService.getNotesSharedByMe().subscribe({
// //         next: (res) => {
// //           this.notes.set(res.data.notes);
// //           this.isLoading.set(false);
// //         },
// //         error: (err) => {
// //           console.error('Failed to load shared by me notes', err);
// //           this.isLoading.set(false);
// //         }
// //       });
// //       return;
// //     }

// //     // --- 4. Trash Bin ---
// //     if (filter === 'trash') {
// //       this.notesService.getTrashBin().subscribe({
// //         next: (res) => {
// //           this.notes.set(res.data.notes);
// //           this.isLoading.set(false);
// //         },
// //         error: () => this.isLoading.set(false)
// //       });
// //       return;
// //     }

// //     // --- 5. Standard Filters (All, Favorites, Archived) ---
// //     const params: NoteFilterParams = {
// //       page: this.currentPage(),
// //       limit: 12,
// //       search: this.searchQuery(),
// //       sort: '-createdAt'
// //     };

// //     if (filter === 'favorites') (params as any).isPinned = true;
// //     if (filter === 'archived') params.status = 'archived';

// //     this.notesService.getNotes(params).subscribe({
// //       next: (res) => {
// //         this.notes.set(res.data.notes);
// //         this.totalPages.set(res.data.pagination?.pages || 1);
// //         this.totalNotes.set(res.data.pagination?.total || 0);
// //         this.isLoading.set(false);
// //       },
// //       error: (err) => {
// //         console.error(err);
// //         this.isLoading.set(false);
// //       }
// //     });
// //   }

// //   loadStats() {
// //     this.notesService.getNoteStatistics().subscribe(res => {
// //       this.stats.set(res.data);
// //     });
// //   }

// //   // --- UI Logic ---

// //   setFilter(filter: FilterType) {
// //     if (this.activeFilter() === filter) return;
// //     this.activeFilter.set(filter);
// //     this.currentPage.set(1);
// //     this.searchControl.setValue('', {emitEvent: false}); // Clear search, prevent double trigger
// //     this.searchQuery.set('');
// //     this.loadNotes();
// //   }

// //   changePage(delta: number) {
// //     const newPage = this.currentPage() + delta;
// //     if (newPage >= 1 && newPage <= this.totalPages()) {
// //       this.currentPage.set(newPage);
// //       this.loadNotes();
// //     }
// //   }

// //   // Helper to check if we should hide pagination
// //   isSpecialFilter(): boolean {
// //     const f = this.activeFilter();
// //     return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent';
// //   }

// //   getEmptyMessage() {
// //     const map: Record<string, {title: string, desc: string}> = {
// //       all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
// //       favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
// //       shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
// //       'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
// //       recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
// //       archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
// //       trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' }
// //     };
// //     return map[this.activeFilter()] || map['all'];
// //   }

// //   // --- Action Handlers ---

// //   onEditNote(id: string) {
// //     this.router.navigate(['/notes', id]);
// //   }

// //   onPinNote(id: string) {
// //     this.notesService.togglePinNote(id).subscribe(() => {
// //       this.notes.update(notes => 
// //         notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
// //       );
// //       if (this.activeFilter() === 'favorites') this.loadNotes();
// //     });
// //   }

// //   onArchiveNote(id: string) {
// //     this.notesService.archiveNote(id).subscribe(() => {
// //       this.notes.update(notes => notes.filter(n => n._id !== id));
// //       this.loadStats();
// //     });
// //   }

// //   onDeleteNote(id: string) {
// //     if(!confirm('Move this note to trash?')) return;
// //     this.notesService.deleteNote(id).subscribe(() => {
// //       this.notes.update(notes => notes.filter(n => n._id !== id));
// //       this.loadStats();
// //     });
// //   }

// //   onHardDeleteNote(id: string) {
// //     if(!confirm('Permanently delete this note? This cannot be undone.')) return;
// //     this.notesService.hardDeleteNote(id).subscribe(() => {
// //       this.notes.update(notes => notes.filter(n => n._id !== id));
// //     });
// //   }

// //   onRestoreNote(id: string) {
// //     const action = this.activeFilter() === 'trash' 
// //       ? this.notesService.restoreFromTrash(id)
// //       : this.notesService.restoreNote(id);

// //     action.subscribe(() => {
// //       this.notes.update(notes => notes.filter(n => n._id !== id));
// //       this.loadStats();
// //     });
// //   }

// //   onEmptyTrash() {
// //     if(!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
// //     this.notesService.emptyTrash().subscribe(() => {
// //       this.notes.set([]);
// //     });
// //   }

// //   onShareNote(id: string) {
// //     console.log('Shared note:', id);
// //   }

// //   onConvertToTask(id: string) {
// //     this.notesService.convertToTask(id).subscribe(() => {
// //        this.loadNotes();
// //     });
// //   }

// //   onLinkNoteRequest(sourceId: string) {
// //     const ref:any = this.dialogServices.openNoteLinkDialog(sourceId);
// //     ref.onClose.subscribe((targetNote: Note) => {
// //       if (targetNote) {
// //         this.notesService.linkNote(sourceId, targetNote._id).subscribe({
// //           next: (res) => {
// //             this.notes.update(notes => 
// //               notes.map(n => n._id === sourceId ? res.data.note : n)
// //             );
// //           },
// //           error: (err) => console.error('Failed to link note', err)
// //         });
// //       }
// //     });
// //   }

// //   exportNotes() {
// //     this.dialogServices.openNoteExport();
// //   }
// // }

// // // import { Component, inject, signal, effect, computed } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { RouterModule, Router } from '@angular/router';
// // // import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// // // import { debounceTime, distinctUntilChanged } from 'rxjs';
// // // import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
// // // import { NoteCardComponent, User } from '../note-card/note-card.component';
// // // import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// // // import { NoteService } from '../../../core/services/notes.service';
// // // import { SharedNoteCardComponent } from '../shared-note-card.component';

// // // type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash';

// // // @Component({
// // //   selector: 'app-note-list',
// // //   standalone: true,
// // //   imports: [CommonModule, RouterModule, ReactiveFormsModule, NoteCardComponent, SharedNoteCardComponent],
// // //   template: `
// // //     <div class="dashboard-container">
      
// // //       <!-- ==================== SIDEBAR FILTERS ==================== -->
// // //       <aside class="filters-sidebar">
        
// // //         <!-- Compose Button -->
// // //         <div class="compose-btn-wrapper">
// // //           <button class="btn-compose" routerLink="/notes/create">
// // //             <span class="icon"><i class="pi pi-plus"></i></span> 
// // //             <span class="label">New Note</span>
// // //           </button>
// // //         </div>

// // //         <!-- Navigation -->
// // //         <nav class="nav-menu custom-scrollbar">
          
// // //           <!-- Library Group -->
// // //           <div class="nav-group">
// // //             <label>Library</label>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
// // //               <span class="icon"><i class="pi pi-file"></i></span> 
// // //               <span class="text">All Notes</span>
// // //               <span class="count">{{ dashboardStats().total }}</span>
// // //             </button>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'favorites'" (click)="setFilter('favorites')">
// // //               <span class="icon"><i class="pi pi-star"></i></span> 
// // //               <span class="text">Favorites</span>
// // //             </button>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'recent'" (click)="setFilter('recent')">
// // //               <span class="icon"><i class="pi pi-clock"></i></span> 
// // //               <span class="text">Recent Activity</span>
// // //             </button>
// // //           </div>

// // //           <div class="divider"></div>

// // //           <!-- Sharing Group -->
// // //           <div class="nav-group">
// // //             <label>Sharing</label>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
// // //               <span class="icon"><i class="pi pi-users"></i></span> 
// // //               <span class="text">Shared with me</span>
// // //             </button>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'shared-by-me'" (click)="setFilter('shared-by-me')">
// // //               <span class="icon"><i class="pi pi-share-alt"></i></span> 
// // //               <span class="text">Shared by me</span>
// // //             </button>
// // //           </div>

// // //           <div class="divider"></div>

// // //           <!-- Organization Group -->
// // //           <div class="nav-group">
// // //             <label>Organization</label>
// // //             <button class="nav-item" [class.active]="activeFilter() === 'archived'" (click)="setFilter('archived')">
// // //               <span class="icon"><i class="pi pi-box"></i></span> 
// // //               <span class="text">Archived</span>
// // //             </button>
// // //             <button class="nav-item danger" [class.active]="activeFilter() === 'trash'" (click)="setFilter('trash')">
// // //               <span class="icon"><i class="pi pi-trash"></i></span> 
// // //               <span class="text">Trash Bin</span>
// // //             </button>
// // //           </div>
// // //         </nav>

// // //         <!-- Stats Widget -->
// // //         @if (stats()) {
// // //         <div class="stats-widget glass-panel">
// // //           <div class="stat-header">
// // //             <h3>Overview</h3>
// // //             <i class="pi pi-chart-bar"></i>
// // //           </div>
// // //           <div class="stat-row">
// // //             <span>Active</span>
// // //             <span class="val">{{ dashboardStats().active }}</span>
// // //           </div>
// // //            <div class="stat-row">
// // //             <span>Completed</span>
// // //             <span class="val success">{{ dashboardStats().completed }}</span>
// // //           </div>
// // //         </div>
// // //         }
// // //       </aside>

// // //       <!-- ==================== MAIN CONTENT ==================== -->
// // //       <main class="main-content">
        
// // //         <!-- Top Bar -->
// // //         <header class="top-bar glass-panel">
// // //           <div class="header-left">
// // //             <div class="mobile-toggle"><i class="pi pi-bars"></i></div> <!-- Placeholder for mobile -->
// // //             <div class="context-title">
// // //               @switch (activeFilter()) {
// // //                 @case ('recent') { <i class="pi pi-clock"></i> Recent Activity }
// // //                 @case ('shared') { <i class="pi pi-users"></i> Shared With Me }
// // //                 @case ('shared-by-me') { <i class="pi pi-share-alt"></i> Shared By Me }
// // //                 @case ('favorites') { <i class="pi pi-star-fill"></i> Favorites }
// // //                 @case ('trash') { <i class="pi pi-trash"></i> Trash }
// // //                 @case ('archived') { <i class="pi pi-box"></i> Archive }
// // //                 @default { <i class="pi pi-file"></i> All Notes }
// // //               }
// // //             </div>
// // //           </div>

// // //           <div class="search-wrapper">
// // //             <i class="pi pi-search search-icon"></i>
// // //             <input type="text" [formControl]="searchControl" placeholder="Search notes..." class="search-input">
// // //           </div>
          
// // //           <div class="actions-wrapper">
// // //             <!-- Trash Actions -->
// // //             @if (activeFilter() === 'trash') {
// // //               <button class="btn-action danger" (click)="onEmptyTrash()" title="Empty Trash">
// // //                  <i class="pi pi-trash"></i> Empty
// // //               </button>
// // //             }

// // //             <!-- Export -->
// // //             <button class="btn-icon" (click)="exportNotes()" title="Export Data">
// // //               <i class="pi pi-download"></i>
// // //             </button>

// // //             <div class="divider-v"></div>

// // //             <!-- View Toggles -->
// // //             <div class="view-controls">
// // //               <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
// // //                 <i class="pi pi-th-large"></i>
// // //               </button>
// // //               <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
// // //                 <i class="pi pi-list"></i>
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </header>

// // //         <!-- Scrollable Content Area -->
// // //         <div class="content-area custom-scrollbar">
          
// // //           <!-- Loading -->
// // //           @if (isLoading()) {
// // //           <div class="loading-state">
// // //             <div class="spinner"></div>
// // //             <p>Syncing notes...</p>
// // //           </div>
// // //           }

// // //           <!-- Empty State -->
// // //           @if (!isLoading() && notes().length === 0) {
// // //           <div class="empty-state">
// // //             <div class="illustration">
// // //               @if (activeFilter() === 'trash') { 🗑️ }
// // //               @else if (activeFilter() === 'favorites') { ⭐ }
// // //               <!-- @else if (activeFilter() === 'recent') { 🕰️ } -->
// // //               @else if (activeFilter() === 'shared') { 📪 }
// // //               @else if (activeFilter() === 'shared-by-me') { 📤 }
// // //               @else { 📝 }
// // //             </div>
// // //             <h3>{{ getEmptyMessage().title }}</h3>
// // //             <p>{{ getEmptyMessage().desc }}</p>
// // //             @if (activeFilter() === 'all') {
// // //               <button class="btn-primary" routerLink="/notes/create">Create your first note</button>
// // //             }
// // //           </div>
// // //           }

// // //           <!-- Notes Grid/List -->
// // //           @if (!isLoading() && notes().length > 0) {
// // //             <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
// // //               @for (note of notes(); track note._id) {
// // //                 <!-- CONDITIONAL RENDERING BASED ON FILTER TYPE -->
// // //                 @if (isSharedFilter()) {
// // //                   <app-shared-note-card
// // //                     [note]="note"
// // //                     [viewMode]="viewMode()"
// // //                     [filterType]="activeFilter() === 'shared-by-me' ? 'shared-by-me' : 'shared'"
// // //                     (action)="handleSharedAction($event, note._id)">
// // //                   </app-shared-note-card>
// // //                 } @else {
// // //                   <app-note-card 
// // //                     [note]="note" 
// // //                     [viewMode]="viewMode()"
// // //                     [availableUsers]="availableUsers()"
// // //                     (edit)="onEditNote($event)" 
// // //                     (pin)="onPinNote($event)"
// // //                     (delete)="onDeleteNote($event)" 
// // //                     (deleteHard)="onHardDeleteNote($event)"
// // //                     (archive)="onArchiveNote($event)" 
// // //                     (restore)="onRestoreNote($event)"
// // //                     (share)="onShareNote($event)"
// // //                     (linkClick)="onLinkNoteRequest($event)"
// // //                     (convertToTask)="onConvertToTask($event)">
// // //                   </app-note-card>
// // //                 }
// // //               }
// // //             </div>
// // //           }

// // //           <!-- Pagination -->
// // //           @if (!isLoading() && totalPages() > 1 && !isSpecialFilter()) {
// // //           <div class="pagination">
// // //             <button class="page-btn" (click)="changePage(-1)" [disabled]="currentPage() === 1">
// // //               <i class="pi pi-chevron-left"></i> Previous
// // //             </button>
// // //             <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
// // //             <button class="page-btn" (click)="changePage(1)" [disabled]="currentPage() === totalPages()">
// // //               Next <i class="pi pi-chevron-right"></i>
// // //             </button>
// // //           </div>
// // //           }
// // //         </div>
// // //       </main>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     /* ==================== THEME VARIABLES MAPPING ==================== */
// // //     :host {
// // //       display: block;
// // //       height: 100%;
// // //       overflow: hidden;
// // //       --sidebar-w: 260px;
// // //       --topbar-h: 64px;
      
// // //       /* Mapping to Provided Theme Tokens */
// // //       --bg-app: var(--bg-primary);
// // //       --bg-panel: var(--bg-secondary);
// // //       --border-color: var(--border-secondary);
// // //       --primary: var(--accent-primary);
// // //       --text-main: var(--text-primary);
// // //       --text-muted: var(--text-secondary);
// // //     }

// // //     .dashboard-container {
// // //       display: flex;
// // //       height: 100%;
// // //       background-color: var(--bg-app);
// // //       color: var(--text-main);
// // //     }

// // //     /* ==================== SIDEBAR ==================== */
// // //     .filters-sidebar {
// // //       width: var(--sidebar-w);
// // //       background: var(--bg-panel);
// // //       border-right: 1px solid var(--border-color);
// // //       display: flex;
// // //       flex-direction: column;
// // //       padding: var(--spacing-lg);
// // //       gap: var(--spacing-xl);
// // //       flex-shrink: 0;

// // //       .compose-btn-wrapper {
// // //         .btn-compose {
// // //           width: 100%;
// // //           background: var(--primary);
// // //           color: white;
// // //           border: none;
// // //           padding: 12px;
// // //           border-radius: var(--ui-border-radius-lg);
// // //           display: flex; align-items: center; justify-content: center; gap: 8px;
// // //           font-weight: 600;
// // //           font-size: var(--font-size-md);
// // //           cursor: pointer;
// // //           transition: var(--transition-base);
// // //           box-shadow: var(--shadow-md);

// // //           &:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
// // //           .icon { font-size: 1rem; }
// // //         }
// // //       }

// // //       .nav-menu {
// // //         display: flex; flex-direction: column; gap: var(--spacing-md);
// // //         flex: 1;
// // //         overflow-y: auto;
// // //         padding-right: 4px; /* Space for scrollbar */

// // //         .nav-group {
// // //           display: flex; flex-direction: column; gap: 4px;
// // //           label { 
// // //             font-size: 11px; 
// // //             text-transform: uppercase; 
// // //             font-weight: 700; 
// // //             color: var(--text-muted); 
// // //             margin-bottom: 8px; 
// // //             padding-left: 12px;
// // //             letter-spacing: 0.5px;
// // //           }
// // //         }

// // //         .nav-item {
// // //           display: flex; align-items: center; gap: 12px;
// // //           padding: 10px 12px;
// // //           border: none;
// // //           background: transparent;
// // //           color: var(--text-muted);
// // //           border-radius: var(--ui-border-radius);
// // //           cursor: pointer;
// // //           font-size: var(--font-size-sm);
// // //           font-weight: 500;
// // //           transition: all 0.2s ease;
// // //           text-align: left;

// // //           &:hover { background: var(--bg-ternary); color: var(--text-main); }
// // //           &.active { 
// // //             background: color-mix(in srgb, var(--primary) 10%, transparent); 
// // //             color: var(--primary); 
// // //             font-weight: 600; 
            
// // //             .count { background: var(--primary); color: white; }
// // //           }
// // //           &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
// // //           &.danger.active { background: var(--color-error-bg); color: var(--color-error); }

// // //           .icon { font-size: 1.1em; width: 20px; text-align: center; }
// // //           .text { flex: 1; }
// // //           .count { 
// // //             font-size: 10px; 
// // //             background: var(--bg-ternary); 
// // //             padding: 2px 8px; 
// // //             border-radius: 12px; 
// // //             transition: all 0.2s;
// // //           }
// // //         }

// // //         .divider { height: 1px; background: var(--border-color); margin: 8px 0; opacity: 0.5; }
// // //       }

// // //       .stats-widget {
// // //         padding: var(--spacing-md);
// // //         border-radius: var(--ui-border-radius);
// // //         border: 1px solid var(--border-color);
// // //         background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%);
// // //         margin-top: auto;
        
// // //         .stat-header { 
// // //           display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; 
// // //           h3 { font-size: 12px; font-weight: 600; margin: 0; color: var(--text-muted); }
// // //           i { color: var(--primary); }
// // //         }
// // //         .stat-row {
// // //           display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;
// // //           .val { font-weight: 600; &.success { color: var(--color-success); } }
// // //         }
// // //       }
// // //     }

// // //     /* ==================== MAIN AREA ==================== */
// // //     .main-content {
// // //       flex: 1;
// // //       display: flex;
// // //       flex-direction: column;
// // //       position: relative;
// // //       min-width: 0; /* Prevents flex overflow */
// // //     }

// // //     .top-bar {
// // //       height: var(--topbar-h);
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: space-between;
// // //       padding: 0 var(--spacing-xl);
// // //       border-bottom: 1px solid var(--border-color);
// // //       /* Glassmorphism */
// // //       background: var(--glass-bg-c);
// // //       backdrop-filter: blur(var(--glass-blur-c));
// // //       position: sticky;
// // //       top: 0;
// // //       z-index: 10;

// // //       .header-left {
// // //         display: flex; align-items: center; gap: 12px;
// // //         .context-title {
// // //           font-weight: 600; color: var(--text-main); font-size: 16px;
// // //           display: flex; align-items: center; gap: 8px;
// // //           i { color: var(--primary); }
// // //         }
// // //       }

// // //       .search-wrapper {
// // //         display: flex; align-items: center; gap: 10px;
// // //         background: var(--bg-panel);
// // //         border: 1px solid var(--border-color);
// // //         padding: 8px 12px;
// // //         border-radius: var(--ui-border-radius-xl);
// // //         width: 300px;
// // //         transition: all 0.2s;

// // //         &:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px var(--accent-focus); }
// // //         .search-icon { color: var(--text-muted); }
        
// // //         .search-input {
// // //           border: none; background: transparent; outline: none; width: 100%;
// // //           color: var(--text-main); font-size: var(--font-size-sm);
// // //         }
// // //       }

// // //       .actions-wrapper {
// // //         display: flex; align-items: center; gap: 8px;

// // //         .btn-icon {
// // //           width: 36px; height: 36px;
// // //           border-radius: var(--ui-border-radius);
// // //           border: 1px solid transparent;
// // //           background: transparent;
// // //           color: var(--text-muted);
// // //           cursor: pointer;
// // //           display: flex; align-items: center; justify-content: center;
// // //           transition: all 0.2s;

// // //           &:hover { background: var(--bg-ternary); color: var(--text-main); }
// // //           &.active { background: var(--bg-ternary); color: var(--primary); border-color: var(--border-color); }
// // //         }
        
// // //         .btn-action {
// // //           padding: 6px 12px; border-radius: var(--ui-border-radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
// // //           &.danger { background: var(--color-error-bg); color: var(--color-error); &:hover { background: #fee2e2; } }
// // //         }

// // //         .divider-v { width: 1px; height: 20px; background: var(--border-color); margin: 0 8px; }
// // //         .view-controls { display: flex; gap: 4px; background: var(--bg-panel); padding: 2px; border-radius: var(--ui-border-radius); border: 1px solid var(--border-color); }
// // //       }
// // //     }

// // //     .content-area {
// // //       flex: 1;
// // //       overflow-y: auto;
// // //       padding: var(--spacing-xl);
// // //       position: relative;
// // //     }

// // //     /* ==================== LOADING & EMPTY STATES ==================== */
// // //     .loading-state {
// // //       display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
// // //       color: var(--text-muted);
// // //       .spinner {
// // //         width: 40px; height: 40px; border: 3px solid var(--bg-ternary); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
// // //       }
// // //     }
// // //     @keyframes spin { to { transform: rotate(360deg); } }

// // //     .empty-state {
// // //       text-align: center; margin-top: 100px;
// // //       .illustration { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; filter: grayscale(0.5); }
// // //       h3 { font-size: 1.25rem; margin-bottom: 8px; color: var(--text-main); }
// // //       p { color: var(--text-muted); margin-bottom: 24px; }
// // //       .btn-primary { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--ui-border-radius); cursor: pointer; font-weight: 600; }
// // //     }

// // //     /* ==================== GRID/LIST LAYOUTS ==================== */
// // //     .notes-grid {
// // //       display: grid;
// // //       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
// // //       gap: var(--spacing-lg);
// // //       padding-bottom: 40px;

// // //       &.list-layout {
// // //         display: flex; flex-direction: column; gap: var(--spacing-sm);
// // //       }
// // //     }

// // //     /* ==================== PAGINATION ==================== */
// // //     .pagination {
// // //       display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; padding-bottom: 20px;
// // //       .page-btn {
// // //         background: var(--bg-panel); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 16px; border-radius: var(--ui-border-radius); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px;
// // //         &:disabled { opacity: 0.5; cursor: not-allowed; }
// // //         &:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
// // //       }
// // //       .page-info { font-size: 13px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
// // //     }
// // //   `]
// // // })
// // // export class NoteListComponent {
// // //   private notesService = inject(NoteService);
// // //   private dialogServices = inject(DynamicDialogServices);
// // //   private router = inject(Router);
// // //   private fb = inject(FormBuilder);

// // //   // --- State Signals ---
// // //   notes = signal<Note[]>([]);
// // //   stats = signal<NoteStatistics | null>(null);
// // //   isLoading = signal(true);
// // //   viewMode = signal<'grid' | 'list'>('grid');
  
// // //   // Pagination
// // //   currentPage = signal(1);
// // //   totalPages = signal(1);
// // //   totalNotes = signal(0);

// // //   // Filters State
// // //   activeFilter = signal<FilterType>('all');
// // //   searchQuery = signal('');
  
// // //   // Users for sharing
// // //   availableUsers = signal<User[]>([]); 

// // //   // Search Form
// // //   searchControl = this.fb.control('');

// // //   // --- Computed Stats for Dashboard ---
// // //   dashboardStats = computed(() => {
// // //     const s = this.stats() as any; 
// // //     if (!s) return { total: 0, active: 0, completed: 0 };

// // //     const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    
// // //     let completed = 0;
// // //     if (Array.isArray(s.byStatus)) {
// // //       const c = s.byStatus.find((i: any) => i._id === 'completed');
// // //       completed = c ? c.count : 0;
// // //     } else if (typeof s.byStatus === 'number') {
// // //       completed = s.byStatus;
// // //     }

// // //     return {
// // //       total: Number(total),
// // //       completed: Number(completed),
// // //       active: Math.max(0, Number(total) - Number(completed))
// // //     };
// // //   });

// // //   constructor() {
// // //     this.searchControl.valueChanges
// // //       .pipe(debounceTime(300), distinctUntilChanged())
// // //       .subscribe(val => {
// // //         this.searchQuery.set(val || '');
// // //         this.currentPage.set(1);
// // //         this.loadNotes();
// // //       });

// // //     this.loadNotes();
// // //     this.loadStats();
// // //   }

// // //   // --- Helpers ---
// // //   isSharedFilter(): boolean {
// // //     const f = this.activeFilter();
// // //     return f === 'shared' || f === 'shared-by-me';
// // //   }

// // //   handleSharedAction(action: string, id: string) {
// // //     if (action === 'view') {
// // //       this.onEditNote(id);
// // //     } else if (action === 'unshare') {
// // //       // Logic to unshare note
// // //       console.log('Unshare requested for', id);
// // //     }
// // //   }

// // //   // --- Data Loading ---

// // //   loadNotes() {
// // //     this.isLoading.set(true);
// // //     const filter = this.activeFilter();

// // //     // Reset pagination for special filters that might not support it
// // //     // or handle it differently
// // //     if (this.isSpecialFilter()) {
// // //       this.totalPages.set(1); 
// // //     }

// // //     // // --- 1. Recent Activity ---
// // //     // if (filter === 'recent') {
// // //     //   this.notesService.getRecentActivity().subscribe({
// // //     //     next: (res) => {
// // //     //       this.notes.set(res.data.notes);
// // //     //       this.isLoading.set(false);
// // //     //     },
// // //     //     error: (err) => {
// // //     //       console.error('Failed to load recent activity', err);
// // //     //       this.isLoading.set(false);
// // //     //     }
// // //     //   });
// // //     //   return;
// // //     // }

// // //     // --- 2. Shared With Me ---
// // //     if (filter === 'shared') {
// // //       this.notesService.getSharedNotesWithMe().subscribe({
// // //         next: (res) => {
// // //           this.notes.set(res.data.notes);
// // //           this.isLoading.set(false);
// // //         },
// // //         error: (err) => {
// // //           console.error('Failed to load shared notes', err);
// // //           this.isLoading.set(false);
// // //         }
// // //       });
// // //       return;
// // //     }

// // //     // --- 3. Shared By Me ---
// // //     if (filter === 'shared-by-me') {
// // //       this.notesService.getNotesSharedByMe().subscribe({
// // //         next: (res) => {
// // //           this.notes.set(res.data.notes);
// // //           this.isLoading.set(false);
// // //         },
// // //         error: (err) => {
// // //           console.error('Failed to load shared by me notes', err);
// // //           this.isLoading.set(false);
// // //         }
// // //       });
// // //       return;
// // //     }

// // //     // --- 4. Trash Bin ---
// // //     if (filter === 'trash') {
// // //       this.notesService.getTrashBin().subscribe({
// // //         next: (res) => {
// // //           this.notes.set(res.data.notes);
// // //           this.isLoading.set(false);
// // //         },
// // //         error: () => this.isLoading.set(false)
// // //       });
// // //       return;
// // //     }

// // //     // --- 5. Standard Filters (All, Favorites, Archived) ---
// // //     const params: NoteFilterParams = {
// // //       page: this.currentPage(),
// // //       limit: 12,
// // //       search: this.searchQuery(),
// // //       sort: '-createdAt'
// // //     };

// // //     if (filter === 'favorites') (params as any).isPinned = true;
// // //     if (filter === 'archived') params.status = 'archived';

// // //     this.notesService.getNotes(params).subscribe({
// // //       next: (res) => {
// // //         this.notes.set(res.data.notes);
// // //         this.totalPages.set(res.data.pagination?.pages || 1);
// // //         this.totalNotes.set(res.data.pagination?.total || 0);
// // //         this.isLoading.set(false);
// // //       },
// // //       error: (err) => {
// // //         console.error(err);
// // //         this.isLoading.set(false);
// // //       }
// // //     });
// // //   }

// // //   loadStats() {
// // //     this.notesService.getNoteStatistics().subscribe(res => {
// // //       this.stats.set(res.data);
// // //     });
// // //   }

// // //   // --- UI Logic ---

// // //   setFilter(filter: FilterType) {
// // //     if (this.activeFilter() === filter) return;
// // //     this.activeFilter.set(filter);
// // //     this.currentPage.set(1);
// // //     this.searchControl.setValue('', {emitEvent: false}); // Clear search, prevent double trigger
// // //     this.searchQuery.set('');
// // //     this.loadNotes();
// // //   }

// // //   changePage(delta: number) {
// // //     const newPage = this.currentPage() + delta;
// // //     if (newPage >= 1 && newPage <= this.totalPages()) {
// // //       this.currentPage.set(newPage);
// // //       this.loadNotes();
// // //     }
// // //   }

// // //   // Helper to check if we should hide pagination
// // //   isSpecialFilter(): boolean {
// // //     const f = this.activeFilter();
// // //     return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent';
// // //   }

// // //   getEmptyMessage() {
// // //     const map: Record<string, {title: string, desc: string}> = {
// // //       all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
// // //       favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
// // //       shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
// // //       'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
// // //       recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
// // //       archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
// // //       trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' }
// // //     };
// // //     return map[this.activeFilter()] || map['all'];
// // //   }

// // //   // --- Action Handlers ---

// // //   onEditNote(id: string) {
// // //     this.router.navigate(['/notes', id]);
// // //   }

// // //   onPinNote(id: string) {
// // //     this.notesService.togglePinNote(id).subscribe(() => {
// // //       this.notes.update(notes => 
// // //         notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
// // //       );
// // //       if (this.activeFilter() === 'favorites') this.loadNotes();
// // //     });
// // //   }

// // //   onArchiveNote(id: string) {
// // //     this.notesService.archiveNote(id).subscribe(() => {
// // //       this.notes.update(notes => notes.filter(n => n._id !== id));
// // //       this.loadStats();
// // //     });
// // //   }

// // //   onDeleteNote(id: string) {
// // //     if(!confirm('Move this note to trash?')) return;
// // //     this.notesService.deleteNote(id).subscribe(() => {
// // //       this.notes.update(notes => notes.filter(n => n._id !== id));
// // //       this.loadStats();
// // //     });
// // //   }

// // //   onHardDeleteNote(id: string) {
// // //     if(!confirm('Permanently delete this note? This cannot be undone.')) return;
// // //     this.notesService.hardDeleteNote(id).subscribe(() => {
// // //       this.notes.update(notes => notes.filter(n => n._id !== id));
// // //     });
// // //   }

// // //   onRestoreNote(id: string) {
// // //     const action = this.activeFilter() === 'trash' 
// // //       ? this.notesService.restoreFromTrash(id)
// // //       : this.notesService.restoreNote(id);

// // //     action.subscribe(() => {
// // //       this.notes.update(notes => notes.filter(n => n._id !== id));
// // //       this.loadStats();
// // //     });
// // //   }

// // //   onEmptyTrash() {
// // //     if(!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
// // //     this.notesService.emptyTrash().subscribe(() => {
// // //       this.notes.set([]);
// // //     });
// // //   }

// // //   onShareNote(id: string) {
// // //     console.log('Shared note:', id);
// // //   }

// // //   onConvertToTask(id: string) {
// // //     this.notesService.convertToTask(id).subscribe(() => {
// // //        this.loadNotes();
// // //     });
// // //   }

// // //   onLinkNoteRequest(sourceId: string) {
// // //     const ref:any = this.dialogServices.openNoteLinkDialog(sourceId);
// // //     ref.onClose.subscribe((targetNote: Note) => {
// // //       if (targetNote) {
// // //         this.notesService.linkNote(sourceId, targetNote._id).subscribe({
// // //           next: (res) => {
// // //             this.notes.update(notes => 
// // //               notes.map(n => n._id === sourceId ? res.data.note : n)
// // //             );
// // //           },
// // //           error: (err) => console.error('Failed to link note', err)
// // //         });
// // //       }
// // //     });
// // //   }

// // //   exportNotes() {
// // //     this.dialogServices.openNoteExport();
// // //   }
// // // }