import { Component, inject, signal, effect, computed, ViewEncapsulation, OnDestroy } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntil } from "rxjs/operators";

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Core & Shared
import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
import { NoteCardComponent, User } from '../note-card/note-card.component';
import { SharedNoteCardComponent } from '../shared-note-card.component';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
import { NoteService } from '../../../core/services/notes.service';
import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
import { AppMessageService } from "../../../core/services/message.service";
import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
import { PERMISSIONS } from '@core/auth/permissions.constants';

type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash' | 'calendar';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    NoteCardComponent,
    SharedNoteCardComponent,
    RecentActivityComponent,
    CalendarViewComponent,
    HasPermissionDirective,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    ProgressSpinnerModule
],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="dashboard-container">

      <aside class="filters-sidebar">

        <div class="compose-btn-wrapper">
          <button *hasPermission="PERMISSIONS.NOTE.WRITE" class="btn-compose" routerLink="/notes/create">
            <span class="compose-icon"><i class="pi pi-plus"></i></span>
            <span class="label">New Note</span>
          </button>
        </div>

        <nav class="nav-menu custom-scrollbar">

          <div class="nav-group">
            <label class="nav-group-label">Library</label>
            <button class="nav-item" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
              <span class="icon"><i class="pi pi-file"></i></span>
              <span class="text">All Notes</span>
              @if (dashboardStats().total) {
                <span class="count">{{ dashboardStats().total }}</span>
              }
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

          <div class="nav-divider"></div>

          <div class="nav-group">
            <label class="nav-group-label">Sharing</label>
            <button class="nav-item" [class.active]="activeFilter() === 'shared'" (click)="setFilter('shared')">
              <span class="icon"><i class="pi pi-users"></i></span>
              <span class="text">Shared with me</span>
            </button>
            <button class="nav-item" [class.active]="activeFilter() === 'shared-by-me'" (click)="setFilter('shared-by-me')">
              <span class="icon"><i class="pi pi-share-alt"></i></span>
              <span class="text">Shared by me</span>
            </button>
          </div>

          <div class="nav-divider"></div>

          <div class="nav-group">
            <label class="nav-group-label">Organization</label>
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

        @if (stats()) {
          <div class="stats-widget">
            <div class="stats-header">
              <span class="stats-title">Overview</span>
              <i class="pi pi-chart-bar stats-icon"></i>
            </div>
            <div class="stats-body">
              <div class="stat-item">
                <span class="stat-label">Total</span>
                <span class="stat-value">{{ dashboardStats().total }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Active</span>
                <span class="stat-value">{{ dashboardStats().active }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Done</span>
                <span class="stat-value success">{{ dashboardStats().completed }}</span>
              </div>
            </div>
          </div>
        }

      </aside>

      <main class="main-content">

        <header class="top-bar">
          <div class="header-left">
            <div class="context-title">
              @switch (activeFilter()) {
                @case ('recent')       { <i class="pi pi-clock"></i><span>Recent Activity</span> }
                @case ('calendar')     { <i class="pi pi-calendar"></i><span>Calendar</span> }
                @case ('shared')       { <i class="pi pi-users"></i><span>Shared With Me</span> }
                @case ('shared-by-me') { <i class="pi pi-share-alt"></i><span>Shared By Me</span> }
                @case ('favorites')    { <i class="pi pi-star-fill text-warning"></i><span>Favorites</span> }
                @case ('trash')        { <i class="pi pi-trash text-error"></i><span>Trash</span> }
                @case ('archived')     { <i class="pi pi-box"></i><span>Archive</span> }
                @default               { <i class="pi pi-file"></i><span>All Notes</span> }
              }
            </div>
          </div>

          @if (activeFilter() !== 'calendar' && activeFilter() !== 'recent') {
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input type="text" [formControl]="searchControl" placeholder="Search notes…" class="search-input theme-control">
            </div>
          }

          <div class="actions-wrapper">
            @if (activeFilter() === 'trash') {
              <button class="btn-action danger" (click)="onEmptyTrash()" pTooltip="Empty Trash" tooltipPosition="bottom">
                <i class="pi pi-trash"></i> Empty Trash
              </button>
            }

            <button class="btn-icon theme-btn-secondary" (click)="exportNotes()" pTooltip="Export Data" tooltipPosition="bottom">
              <i class="pi pi-download"></i>
            </button>

            @if (activeFilter() !== 'recent' && activeFilter() !== 'calendar') {
              <div class="view-controls">
                <button class="btn-icon" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" pTooltip="Grid view" tooltipPosition="bottom">
                  <i class="pi pi-th-large"></i>
                </button>
                <button class="btn-icon" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')" pTooltip="List view" tooltipPosition="bottom">
                  <i class="pi pi-list"></i>
                </button>
              </div>
            }
          </div>
        </header>

        <div class="content-area custom-scrollbar" [class.no-padding]="activeFilter() === 'calendar'">

          @if (isLoading() && activeFilter() !== 'calendar') {
            <div class="loading-state">
              <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
              <p>Syncing your notes…</p>
            </div>
          }

          @if (!isLoading() && notes().length === 0 && activeFilter() !== 'calendar' && activeFilter() !== 'recent') {
            <div class="empty-state">
              <div class="empty-illustration">
                @if (activeFilter() === 'trash') { <i class="pi pi-trash"></i> }
                @else if (activeFilter() === 'favorites') { <i class="pi pi-star"></i> }
                @else if (activeFilter() === 'recent') { <i class="pi pi-clock"></i> }
                @else if (activeFilter() === 'shared') { <i class="pi pi-users"></i> }
                @else if (activeFilter() === 'shared-by-me') { <i class="pi pi-share-alt"></i> }
                @else { <i class="pi pi-file-edit"></i> }
              </div>
              <h3>{{ getEmptyMessage().title }}</h3>
              <p>{{ getEmptyMessage().desc }}</p>
              @if (activeFilter() === 'all') {
                <button class="btn-primary" routerLink="/notes/create">Create your first note</button>
              }
            </div>
          }

          @if (!isLoading() || activeFilter() === 'calendar' || activeFilter() === 'recent') {

            @if (activeFilter() === 'recent') {
              <app-recent-activity></app-recent-activity>
            }

            @else if (activeFilter() === 'calendar') {
              <app-datepicker-view></app-datepicker-view>
            }

            @else if (notes().length > 0) {
              <div class="notes-grid" [class.list-layout]="viewMode() === 'list'">
                @for (note of notes(); track note._id) {

                  @if (isSharedFilter()) {
                    <app-shared-note-card 
                      [note]="note" 
                      [viewMode]="viewMode()"
                      [filterType]="activeFilter() === 'shared-by-me' ? 'shared-by-me' : 'shared'"
                      (action)="handleSharedAction($event, note._id)">
                    </app-shared-note-card>
                  } @else {
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

          @if (!isLoading() && totalPages() > 1 && !isSpecialFilter()) {
            <div class="pagination">
              <button class="page-btn theme-btn-secondary" (click)="changePage(-1)" [disabled]="currentPage() === 1">
                <i class="pi pi-chevron-left"></i> Previous
              </button>
              <div class="page-dots">
                @for (p of [].constructor(totalPages()); track $index) {
                  <span class="dot" [class.active]="currentPage() === $index + 1"></span>
                }
              </div>
              <button class="page-btn theme-btn-secondary" (click)="changePage(1)" [disabled]="currentPage() === totalPages()">
                Next <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          }

        </div>
      </main>

    </div>
  `,
  styles: [`
    /* ============================================================================
       NOTE LIST COMPONENT - APEX CRM THEME INTEGRATION
       ============================================================================ */

    :host {
      display: block;
      height: 100%;
      width: 100%;
      font-family: var(--font-body);
    }

    .dashboard-container {
      display: flex;
      height: 100%;
      width: 100%;
      background: var(--bg-primary);
      overflow: hidden;
    }

    /* ── Sidebar ─────────────────────────────────────────────────── */
    .filters-sidebar {
      width: 260px;
      min-width: 260px;
      background: var(--bg-secondary);
      border-right: var(--ui-border-width) solid var(--border-primary);
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: var(--z-fixed);
      flex-shrink: 0;

      @media (max-width: 768px) {
        position: fixed;
        inset-block: 0;
        left: -260px;
        box-shadow: none;
        transition: left var(--transition-base);

        &.is-open {
          left: 0;
          box-shadow: var(--shadow-xl);
        }
      }
    }

    .compose-btn-wrapper {
      padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
    }

    .btn-compose {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--accent-primary);
      color: var(--bg-primary);
      border: none;
      border-radius: var(--ui-border-radius-lg);
      font-family: var(--font-heading);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      cursor: pointer;
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);

      &:hover {
        background: var(--accent-hover);
        box-shadow: var(--elevation-2);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      .compose-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: var(--ui-border-radius-sm);
        font-size: var(--font-size-sm);
        flex-shrink: 0;
      }
    }

    .nav-menu {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xl);
    }

    .nav-group {
      margin-bottom: var(--spacing-lg);
    }

    .nav-group-label {
      display: block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--spacing-sm) var(--spacing-lg);
      margin-bottom: var(--spacing-xs);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      background: transparent;
      border: none;
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: var(--transition-fast);
      text-align: left;

      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        font-size: var(--font-size-md);
        flex-shrink: 0;
        color: var(--text-tertiary);
        transition: color var(--transition-fast);
      }

      .text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 2px 6px;
        background: var(--bg-ternary);
        color: var(--text-secondary);
        border-radius: var(--ui-border-radius-pill);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        font-family: var(--font-mono);
      }

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        .icon { color: var(--text-secondary); }
      }

      &.active {
        background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
        color: var(--accent-primary);
        .icon { color: var(--accent-primary); }
        .count { background: var(--accent-primary); color: var(--bg-primary); }
      }

      &.danger {
        color: var(--color-error);
        .icon { color: var(--color-error); }
        &:hover { background: var(--color-error-bg); }
        &.active { background: var(--color-error-bg); color: var(--color-error-dark); }
      }
    }

    .nav-divider {
      height: 1px;
      background: var(--border-primary);
      margin: var(--spacing-md) var(--spacing-xl);
    }

    .stats-widget {
      margin: var(--spacing-md) var(--spacing-xl) var(--spacing-xl);
      background: var(--bg-ternary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      flex-shrink: 0;
    }

    .stats-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
      
      .stats-title {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .stats-icon { font-size: var(--font-size-sm); color: var(--text-tertiary); }
    }

    .stats-body {
      display: flex;
      gap: var(--spacing-sm);
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: var(--spacing-sm);
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-secondary);
      
      .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-semibold); }
      .stat-value { font-family: var(--font-mono); font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); }
      .success { color: var(--color-success); }
    }

    /* ── Main Content ────────────────────────────────────────────── */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--bg-primary);
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-xl);
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-primary);
      flex-shrink: 0;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        padding: var(--spacing-lg) var(--spacing-xl);
      }
    }

    .context-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-family: var(--font-heading);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);

      i { font-size: var(--font-size-lg); color: var(--accent-primary); }
      
      .text-warning { color: var(--color-warning); }
      .text-error { color: var(--color-error); }
    }

    .search-wrapper {
      flex: 1;
      max-width: 400px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: var(--spacing-lg);
      top: 50%;
      transform: translateY(-50%);
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding-left: calc(var(--spacing-lg) * 2 + var(--font-size-sm));
      border-radius: var(--ui-border-radius-pill);
    }

    .actions-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: transparent;
      border: var(--ui-border-width) solid transparent;
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: var(--font-size-md);
      transition: var(--transition-fast);

      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &.active {
        background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
        color: var(--accent-primary);
      }
      
      &.theme-btn-secondary {
        border-color: var(--border-secondary);
      }
    }

    .view-controls {
      display: flex;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);

      .btn-icon {
        border: none;
        border-radius: 0;
        & + .btn-icon { border-left: var(--ui-border-width) solid var(--border-secondary); }
      }
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 0 var(--spacing-lg);
      height: 36px;
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      background: transparent;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: var(--transition-fast);
      color: var(--text-secondary);

      &.danger {
        color: var(--color-error);
        border-color: var(--color-error-border);
        &:hover { background: var(--color-error-bg); }
      }
    }

    /* ── Content Area ────────────────────────────────────────────── */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-2xl);

      &.no-padding { padding: 0; }
      @media (max-width: 768px) { padding: var(--spacing-xl); }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-lg);
      height: 100%;
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;

      .empty-illustration {
        font-size: 3rem;
        color: var(--text-tertiary);
        opacity: 0.5;
        margin-bottom: var(--spacing-lg);
      }

      h3 {
        font-family: var(--font-heading);
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin: 0 0 var(--spacing-xs);
      }

      p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        max-width: 300px;
        margin: 0 0 var(--spacing-xl);
      }
      
      .btn-primary {
        padding: var(--spacing-sm) var(--spacing-xl);
        background: var(--accent-primary);
        color: var(--bg-primary);
        border: none;
        border-radius: var(--ui-border-radius-pill);
        font-weight: var(--font-weight-bold);
        cursor: pointer;
        transition: var(--transition-fast);
        &:hover { background: var(--accent-hover); }
      }
    }

    /* ── Notes Grid ──────────────────────────────────────────────── */
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--spacing-xl);

      &.list-layout { grid-template-columns: 1fr; }
      @media (max-width: 768px) { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }

    /* ── Pagination ──────────────────────────────────────────────── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xl);
      padding: var(--spacing-3xl) 0 var(--spacing-lg);
    }

    .page-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-xl);
      height: 36px;
      background: transparent;
      border: var(--ui-border-width) solid transparent;
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      cursor: pointer;
      transition: var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--bg-hover);
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      &.theme-btn-secondary {
        border-color: var(--border-secondary);
        color: var(--text-secondary);
      }
    }

    .page-dots {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-secondary);
      transition: var(--transition-base);

      &.active {
        background: var(--accent-primary);
        width: 24px;
        border-radius: var(--ui-border-radius-pill);
      }
    }

    /* Scrollbar Integration */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: var(--ui-border-radius-pill); }
  `]
})
export class NoteListComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly PERMISSIONS = PERMISSIONS;

  private notesService = inject(NoteService);
  private messageService = inject(AppMessageService);
  private dialogServices = inject(DynamicDialogServices);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  notes = signal<Note[]>([]);
  stats = signal<NoteStatistics | null>(null);
  isLoading = signal(true);
  viewMode = signal<'grid' | 'list'>('grid');

  currentPage = signal(1);
  totalPages = signal(1);
  totalNotes = signal(0);

  activeFilter = signal<FilterType>('all');
  searchQuery = signal('');
  availableUsers = signal<User[]>([]);
  searchControl = this.fb.control('');
  
  dashboardStats = computed(() => {
    const s = this.stats() as any;
    if (!s) return { total: 0, active: 0, completed: 0 };
    const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
    let completed = 0;
    if (Array.isArray(s.byStatus)) {
      const c = s.byStatus.find((i: any) => i._id === 'done'); completed = c ? c.count : 0;
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
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(val => {
        this.searchQuery.set(val || '');
        this.currentPage.set(1);
        this.loadNotes();
      });
    this.loadNotes();
    this.loadStats();
  }

  isSharedFilter(): boolean {
    const f = this.activeFilter();
    return f === 'shared' || f === 'shared-by-me';
  }

  handleSharedAction(action: string, id: string) {
    if (action === 'view') {
      this.onEditNote(id);
    } else if (action === 'unshare') {
      console.log('Unshare requested for', id);
    }
  }

  setFilter(filter: FilterType) {
    if (this.activeFilter() === filter) return;
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.searchControl.setValue('', { emitEvent: false });
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

  isSpecialFilter(): boolean {
    const f = this.activeFilter();
    return f === 'trash' || f === 'shared' || f === 'shared-by-me' || f === 'recent' || f === 'calendar';
  }

  getEmptyMessage() {
    const map: Record<string, { title: string, desc: string }> = {
      all: { title: 'No notes found', desc: 'Capture your ideas, meetings, and tasks.' },
      favorites: { title: 'No favorites yet', desc: 'Pin notes to access them quickly here.' },
      shared: { title: 'No shared notes', desc: 'Notes shared with you will appear here.' },
      'shared-by-me': { title: 'No shared items', desc: 'Notes you share with others appear here.' },
      recent: { title: 'No recent activity', desc: 'Your recent updates will show up here.' },
      archived: { title: 'Archive is empty', desc: 'Archived notes are safely stored here.' },
      trash: { title: 'Trash is empty', desc: 'Deleted notes will appear here for 30 days.' },
      calendar: { title: 'Calendar', desc: '' }
    };
    return map[this.activeFilter()] || map['all'];
  }

  onEditNote(id: string) {
    this.router.navigate(['/notes', id]);
  }

  onShareNote(id: string) {
    console.log('Shared note:', id);
  }

  exportNotes() {
    this.dialogServices.openNoteExport();
  }

  loadNotes() {
    this.isLoading.set(true);
    const filter = this.activeFilter();

    if (this.isSpecialFilter()) {
      this.totalPages.set(1);
    }

    if (filter === 'calendar' || filter === 'recent') {
      this.isLoading.set(false);
      this.notes.set([]);
      return;
    }

    let request$;

    switch (filter) {
      case 'shared': request$ = this.notesService.getSharedNotesWithMe(); break;
      case 'shared-by-me': request$ = this.notesService.getNotesSharedByMe(); break;
      case 'trash': request$ = this.notesService.getTrashBin(); break;
      default:
        const params: NoteFilterParams = {
          page: this.currentPage(),
          limit: 12,
          search: this.searchQuery(),
          sort: '-createdAt'
        };
        if (filter === 'favorites') (params as any).isPinned = true;
        if (filter === 'archived') params.status = 'archived';
        request$ = this.notesService.getNotes(params);
    }

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.notes.set(res.data.notes ?? []);
        if (res.data.pagination) {
          this.totalPages.set(res.data.pagination.pages || 1);
          this.totalNotes.set(res.data.pagination.total || 0);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
      }
    });
  }

  loadStats() {
    this.notesService.getNoteStatistics().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.stats.set(res.data),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onPinNote(id: string) {
    this.notesService.togglePinNote(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.update(notes =>
          notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
        );
        this.messageService.showSuccess('Note pin status updated.');
        if (this.activeFilter() === 'favorites') this.loadNotes();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onArchiveNote(id: string) {
    this.notesService.archiveNote(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note moved to archive.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onDeleteNote(id: string) {
    if (!confirm('Move this note to trash?')) return;
    this.notesService.deleteNote(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note moved to trash.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onHardDeleteNote(id: string) {
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    this.notesService.hardDeleteNote(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note permanently deleted.');
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onRestoreNote(id: string) {
    const action$ = this.activeFilter() === 'trash'
      ? this.notesService.restoreFromTrash(id)
      : this.notesService.restoreNote(id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.update(notes => notes.filter(n => n._id !== id));
        this.messageService.showSuccess('Note restored successfully.');
        this.loadStats();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onEmptyTrash() {
    if (!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
    this.notesService.emptyTrash().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notes.set([]);
        this.messageService.showSuccess('Trash folder cleared.');
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onConvertToTask(id: string) {
    this.notesService.convertToTask(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.messageService.showSuccess('Note converted to task.');
        this.loadNotes();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onLinkNoteRequest(sourceId: string) {
    const ref: any = this.dialogServices.openNoteLinkDialog(sourceId);
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((targetNote: Note) => {
      if (targetNote) {
        this.notesService.linkNote(sourceId, targetNote._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res) => {
            this.messageService.showSuccess('Notes linked successfully.');
            this.notes.update(notes =>
              notes.map(n => n._id === sourceId ? res.data.note : n)
            );
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}// import { MessageService } from "primeng/api";
// import { Component, inject, signal, effect, computed, ViewEncapsulation, OnDestroy } from '@angular/core';

// import { RouterModule, Router } from '@angular/router';
// import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
// import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
// import { Note, NoteStatistics, NoteFilterParams } from '../../../core/models/note.types';
// import { NoteCardComponent, User } from '../note-card/note-card.component';
// import { SharedNoteCardComponent } from '../shared-note-card.component';
// import { CalendarViewComponent } from '../calendar-view/calendar-view.component';
// import { DynamicDialogServices } from '../../../core/services/dynamic-dialog-services';
// import { NoteService } from '../../../core/services/notes.service';
// import { RecentActivityComponent } from '../recent-activity/recent-activity.component';
// import { AppMessageService } from "../../../core/services/message.service";
// import { HasPermissionDirective } from '@core/auth/directives/has-permission.directive';
// import { PERMISSIONS } from '@core/auth/permissions.constants';
// import { takeUntil } from "rxjs/operators";

// type FilterType = 'all' | 'favorites' | 'shared' | 'shared-by-me' | 'recent' | 'archived' | 'trash' | 'calendar';

// @Component({
//   selector: 'app-note-list',
//   standalone: true,
//   imports: [RouterModule, ReactiveFormsModule, NoteCardComponent, SharedNoteCardComponent, RecentActivityComponent, CalendarViewComponent, HasPermissionDirective],
//   encapsulation: ViewEncapsulation.None,
//   templateUrl: './note-list.component.html',
//   styleUrl: './note-list.component.scss'
// })
// export class NoteListComponent implements OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   readonly PERMISSIONS = PERMISSIONS;

//   private notesService = inject(NoteService);
//   private messageService = inject(AppMessageService);
//   private dialogServices = inject(DynamicDialogServices);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   notes = signal<Note[]>([]);
//   stats = signal<NoteStatistics | null>(null);
//   isLoading = signal(true);
//   viewMode = signal<'grid' | 'list'>('grid');

//   currentPage = signal(1);
//   totalPages = signal(1);
//   totalNotes = signal(0);

//   activeFilter = signal<FilterType>('all');
//   searchQuery = signal('');
//   availableUsers = signal<User[]>([]);
//   searchControl = this.fb.control('');
//   dashboardStats = computed(() => {
//     const s = this.stats() as any;
//     if (!s) return { total: 0, active: 0, completed: 0 };
//     const total = Array.isArray(s.totalNotes) ? (s.totalNotes[0]?.count || 0) : (s.totalNotes || 0);
//     let completed = 0;
//     if (Array.isArray(s.byStatus)) {
//       const c = s.byStatus.find((i: any) => i._id === 'done'); completed = c ? c.count : 0;
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
//       .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
//       .subscribe(val => {
//         this.searchQuery.set(val || '');
//         this.currentPage.set(1);
//         this.loadNotes();
//       });
//     this.loadNotes();
//     this.loadStats();
//   }
//   isSharedFilter(): boolean {
//     const f = this.activeFilter();
//     return f === 'shared' || f === 'shared-by-me';
//   }

//   handleSharedAction(action: string, id: string) {
//     if (action === 'view') {
//       this.onEditNote(id);
//     } else if (action === 'unshare') {
//       console.log('Unshare requested for', id);
//     }
//   }

//   setFilter(filter: FilterType) {
//     if (this.activeFilter() === filter) return;
//     this.activeFilter.set(filter);
//     this.currentPage.set(1);
//     this.searchControl.setValue('', { emitEvent: false }); // Clear search, prevent double trigger
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
//     const map: Record<string, { title: string, desc: string }> = {
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

//   onEditNote(id: string) {
//     this.router.navigate(['/notes', id]);
//   }

//   onShareNote(id: string) {
//     console.log('Shared note:', id);
//   }

//   exportNotes() {
//     this.dialogServices.openNoteExport();
//   }

//   // --- Data Loading ---
//   loadNotes() {
//     this.isLoading.set(true);
//     const filter = this.activeFilter();

//     if (this.isSpecialFilter()) {
//       this.totalPages.set(1);
//     }

//     if (filter === 'calendar' || filter === 'recent') {
//       this.isLoading.set(false);
//       this.notes.set([]);
//       return;
//     }

//     // Define the specific observable based on the filter
//     let request$;

//     switch (filter) {
//       case 'shared': request$ = this.notesService.getSharedNotesWithMe(); break;
//       case 'shared-by-me': request$ = this.notesService.getNotesSharedByMe(); break;
//       case 'trash': request$ = this.notesService.getTrashBin(); break;
//       default:
//         const params: NoteFilterParams = {
//           page: this.currentPage(),
//           limit: 12,
//           search: this.searchQuery(),
//           sort: '-createdAt'
//         };
//         if (filter === 'favorites') (params as any).isPinned = true;
//         if (filter === 'archived') params.status = 'archived';
//         request$ = this.notesService.getNotes(params);
//     }

//     request$.pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         this.notes.set(res.data.notes ?? []);
//         if (res.data.pagination) {
//           this.totalPages.set(res.data.pagination.pages || 1);
//           this.totalNotes.set(res.data.pagination.total || 0);
//         }
//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   loadStats() {
//     this.notesService.getNoteStatistics().pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res) => this.stats.set(res.data),
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onPinNote(id: string) {
//     this.notesService.togglePinNote(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.update(notes =>
//           notes.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n)
//         );
//         this.messageService.showSuccess('Note pin status updated.');
//         if (this.activeFilter() === 'favorites') this.loadNotes();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onArchiveNote(id: string) {
//     this.notesService.archiveNote(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.update(notes => notes.filter(n => n._id !== id));
//         this.messageService.showSuccess('Note moved to archive.');
//         this.loadStats();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onDeleteNote(id: string) {
//     // You could replace window.confirm with your confirmationService for consistency
//     if (!confirm('Move this note to trash?')) return;
//     this.notesService.deleteNote(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.update(notes => notes.filter(n => n._id !== id));
//         this.messageService.showSuccess('Note moved to trash.');
//         this.loadStats();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onHardDeleteNote(id: string) {
//     if (!confirm('Permanently delete this note? This cannot be undone.')) return;
//     this.notesService.hardDeleteNote(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.update(notes => notes.filter(n => n._id !== id));
//         this.messageService.showSuccess('Note permanently deleted.');
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onRestoreNote(id: string) {
//     const action$ = this.activeFilter() === 'trash'
//       ? this.notesService.restoreFromTrash(id)
//       : this.notesService.restoreNote(id);

//     action$.pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.update(notes => notes.filter(n => n._id !== id));
//         this.messageService.showSuccess('Note restored successfully.');
//         this.loadStats();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onEmptyTrash() {
//     if (!confirm('Are you sure you want to permanently delete ALL items in trash?')) return;
//     this.notesService.emptyTrash().pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.notes.set([]);
//         this.messageService.showSuccess('Trash folder cleared.');
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onConvertToTask(id: string) {
//     this.notesService.convertToTask(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Note converted to task.');
//         this.loadNotes();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onLinkNoteRequest(sourceId: string) {
//     const ref: any = this.dialogServices.openNoteLinkDialog(sourceId);
//     ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((targetNote: Note) => {
//       if (targetNote) {
//         this.notesService.linkNote(sourceId, targetNote._id).pipe(takeUntil(this.destroy$)).subscribe({
//           next: (res) => {
//             this.messageService.showSuccess('Notes linked successfully.');
//             this.notes.update(notes =>
//               notes.map(n => n._id === sourceId ? res.data.note : n)
//             );
//           },
//           error: (err) => this.messageService.handleHttpError(err)
//         });
//       }
//     });
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }
