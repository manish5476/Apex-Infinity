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
    <div class="apex-page">
      
      <header class="apex-page-header">
        <div class="apex-page-header__title-block">
          <div class="apex-page-header__icon"><i class="pi pi-id-card"></i></div>
          <div>
            <h1 class="apex-page-header__title">Designations</h1>
            <p class="apex-page-header__subtitle">Manage job titles, levels, and organizational grades.</p>
          </div>
        </div>
        <div class="apex-page-header__actions">
          <div class="apex-stat-badge">
            <span class="apex-stat-badge__value">{{ totalCount() }}</span>
            <span class="apex-stat-badge__label">Total Records</span>
          </div>
        </div>
      </header>

      <div class="apex-content">
        <div class="apex-card apex-card--surface h-full d-flex flex-column p-0">
          
          <div class="apex-filter-bar p-3 border-bottom">
            <div class="apex-flex flex-wrap gap-3 align-items-end w-full">
              
              <div class="apex-filter-group flex-1 min-w-15rem">
                <label class="apex-input-label">Search</label>
                <div class="p-input-icon-left w-full">
                  <i class="pi pi-search"></i>
                  <input type="text" 
                    [ngModel]="filters().search" 
                    (ngModelChange)="updateSearch($event)"
                    placeholder="Title or Code..." class="apex-input w-full" />
                </div>
              </div>

              <div class="apex-filter-group min-w-10rem">
                <label class="apex-input-label">Grade</label>
                <select [ngModel]="filters().grade" (change)="updateGrade($event)" class="apex-input w-full">
                  <option value="">All Grades</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                  <option value="E">Grade E</option>
                  <option value="F">Grade F</option>
                </select>
              </div>

              <div class="apex-filter-group min-w-10rem">
                <label class="apex-input-label">Status</label>
                <select [ngModel]="filters().isActive" (change)="updateStatus($event)" class="apex-input w-full">
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div class="apex-flex gap-2 ml-auto">
                <button class="apex-btn apex-btn--secondary" (click)="resetFilters()">
                  <i class="pi pi-refresh"></i> Reset
                </button>
                <button class="apex-btn apex-btn--primary" (click)="createNew()">
                  <i class="pi pi-plus"></i> Add Designation
                </button>
              </div>

            </div>
          </div>

          <div class="flex-1 position-relative p-3">
            <app-ag-share-grid 
              [columns]="column()" 
              [data]="data()" 
              [actionColumn]="designationActionColumn"
              selectionMode="single"
              class="fill-grid"
              (gridEvent)="eventFromGrid($event)">
            </app-ag-share-grid>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background-color: var(--bg-secondary);
    }
    
    .h-full { height: 100%; }
    .d-flex { display: flex; }
    .flex-column { flex-direction: column; }
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg) !important; }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .flex-1 { flex: 1; min-height: 0; }
    .w-full { width: 100%; }
    .min-w-15rem { min-width: 15rem; }
    .min-w-10rem { min-width: 10rem; }
    .ml-auto { margin-left: auto; }
    .position-relative { position: relative; }
    
    .fill-grid {
      position: absolute;
      inset: 1rem;
      display: block;
    }
    
    .apex-stat-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
    }
    .apex-stat-badge__value {
      font-size: var(--font-size-xl);
      font-weight: 800;
      color: var(--accent-primary);
      line-height: 1;
    }
    .apex-stat-badge__label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
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