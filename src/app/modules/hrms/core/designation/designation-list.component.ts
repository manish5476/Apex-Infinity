import { Component, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { HRMSService } from '../../hrms.service';
import { of, take } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-designation-list',
  standalone: true,
  imports: [FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      
      <div class="list-header">
        <div class="title-section">
          <div class="icon-box"><i class="pi pi-id-card"></i></div>
          <div class="text-content">
            <h2 class="page-title">Designations</h2>
            <p class="page-subtitle">Manage job titles, levels, and organizational grades.</p>
          </div>
        </div>
        <div class="stats-badge">
          <span class="count">{{ totalCount() }}</span>
          <span class="label">Total Records</span>
        </div>
      </div>

      <div class="themed-card list-content-area">

        <div class="se-filter-bar">
          <div class="se-filter-field search-field">
            <label for="search">Search</label>
            <div class="input-icon-wrapper w-full">
              <i class="pi pi-search input-icon"></i>
              <input id="search" type="text" 
                [ngModel]="filters().search" 
                (ngModelChange)="updateSearch($event)"
                placeholder="Title or Code..." class="se-input w-full with-icon" />
            </div>
          </div>

          <div class="se-filter-field">
            <label for="grade">Grade</label>
            <div class="select-wrapper w-full">
              <select id="grade" [ngModel]="filters().grade" (change)="updateGrade($event)" class="se-input w-full">
                <option value="">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
                <option value="E">Grade E</option>
                <option value="F">Grade F</option>
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label for="status">Status</label>
            <div class="select-wrapper w-full">
              <select id="status" [ngModel]="filters().isActive" (change)="updateStatus($event)" class="se-input w-full">
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div class="se-filter-actions">
            <button class="btn btn-outline" (click)="resetFilters()">
              <i class="pi pi-refresh"></i> Reset
            </button>
          </div>

          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <i class="pi pi-plus"></i> Add Designation
            </button>
          </div>
        </div>

        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column()" 
            [data]="data()" 
            [actionColumn]="designationActionColumn"
           
            selectionMode="single"
            (gridEvent)="eventFromGrid($event)">
          </app-ag-share-grid>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background-color: var(--bg-secondary);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .list-page-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      max-width: 100%; /* Changed from 1600px for full width */
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .list-header {
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 0 var(--spacing-xs);
    }

    .themed-card {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--elevation-2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: var(--spacing-lg);
      gap: var(--spacing-md);
    }

    .list-grid-wrapper {
      flex: 1;
      min-height: 0;
      width: 100%;
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      overflow: hidden;
      background: var(--bg-primary);
    }

    /* Input & UI refinements using your theme */
    .se-input {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      transition: var(--transition-base);
    }

    .se-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px var(--accent-focus);
    }

    .btn-primary {
      background: var(--accent-gradient);
      border: none;
      color: var(--color-on-primary);
      box-shadow: var(--shadow-md);
    }

    .btn-primary:hover {
      filter: brightness(1.1);
      box-shadow: var(--elevation-1);
    }
  `]
})
export class DesignationListComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  // --- Signals ---
  data = signal<any[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);
  currentPage = signal(1);
  pageSize = signal(50);

  filters = signal({
    search: '',
    grade: null as string | null,
    isActive: null as boolean | null
  });

  column = signal<any[]>([]);

  readonly designationActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.DESIGNATION.READ,
    editPermission: PERMISSIONS.DESIGNATION.MANAGE,
    deletePermission: PERMISSIONS.DESIGNATION.MANAGE,
  };

  ngOnInit(): void {
    this.setupColumns();
    this.loadData(true);
  }

  // --- Logic ---
  private loadData(isReset: boolean = true) {
    this.isLoading.set(true);

    const rawParams = {
      ...this.filters(),
      page: this.currentPage(),
      limit: this.pageSize()
    };
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(([, value]) => value !== null && value !== '')
    );

    this.hrmsService.getDesignations(params).pipe(
      finalize(() => this.isLoading.set(false)),
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const newData = res.data?.designations || res.data?.data || [];
        this.totalCount.set(res.pagination?.totalResults ?? res.total ?? res.results ?? newData.length);
        this.data.set(isReset ? newData : [...this.data(), ...newData]);
      }
    });
  }

  // --- Filter Updates ---
  updateSearch(val: string) {
    this.filters.update(f => ({ ...f, search: val }));
    this.currentPage.set(1);
    this.loadData(true);
  }

  updateGrade(event: any) {
    this.filters.update(f => ({ ...f, grade: event.target.value || null }));
    this.currentPage.set(1);
    this.loadData(true);
  }

  updateStatus(event: any) {
    const val = event.target.value === 'true' ? true : event.target.value === 'false' ? false : null;
    this.filters.update(f => ({ ...f, isActive: val }));
    this.currentPage.set(1);
    this.loadData(true);
  }

  resetFilters() {
    this.filters.set({ search: '', grade: null, isActive: null });
    this.currentPage.set(1);
    this.loadData(true);
  }

  createNew() {
    this.router.navigate(['/hrms/designation/new']);
  }

  // --- Grid Events ---
  eventFromGrid(event: any) {
    const desigId = event?.row?._id;
    switch (event.type) {
      case 'cellClicked':
        this.router.navigate(['/hrms/designation/details', desigId]);
        break;
      case 'editStart':
        this.router.navigate(['/hrms/designation/edit', desigId]);
        break;
      case 'delete':
        if (confirm(`Delete ${event.row.title}?`)) this.deleteDesignation(desigId);
        break;
      case 'reachedBottom':
        if (this.data().length < this.totalCount()) {
          this.currentPage.update(p => p + 1);
          this.loadData(false);
        }
        break;
    }
  }

  private deleteDesignation(id: string) {
    this.hrmsService.deleteDesignation(id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.messageService.showSuccess('Deleted');
          this.loadData(true);
        },
        error: (err: any) => this.messageService.handleHttpError(err)
      });
  }

  setupColumns(): void {
    this.column.set([
      {
        field: 'title',
        headerName: 'DESIGNATION TITLE',
        minWidth: 250,
        flex: 2,
        pinned: 'left',
        cellRenderer: (p: any) => `
          <div style="display: flex; align-items: center; gap: 12px; height: 100%;">
            <div style="width: 3px; height: 16px; background: var(--accent-primary); border-radius: 4px;"></div>
            <span style="font-weight: 600; color: var(--text-primary);">${p.value}</span>
          </div>`
      },
      {
        headerName: 'CODE',
        field: 'code',
        width: 120,
        cellRenderer: (p: any) => `<span style="font-family: var(--font-mono); color: var(--text-secondary); font-size: 11px;">${p.value || '-'}</span>`
      },
      {
        headerName: 'STATUS',
        field: 'isActive',
        width: 120,
        pinned: 'right',
        cellRenderer: (p: any) => {
          const statusClass = p.value ? 'color-success' : 'color-error';
          const text = p.value ? 'Active' : 'Inactive';
          return `<span class="status-pill ${statusClass}" style="
            padding: 4px 12px; 
            border-radius: 12px; 
            font-size: 11px; 
            font-weight: 700; 
            background: color-mix(in srgb, var(--${statusClass}), transparent 90%);
            border: 1px solid var(--${statusClass});
            color: var(--${statusClass});
          ">${text}</span>`;
        }
      }
    ]);
  }
}