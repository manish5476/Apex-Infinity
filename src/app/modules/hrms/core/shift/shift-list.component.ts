import { Component, OnInit, inject, ChangeDetectionStrategy, signal, DestroyRef, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

// AG Grid & Services
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { HRMSService } from '../../hrms.service';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-shift-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    AgShareGrid
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="apex-page">
      <header class="apex-page-header">
        <div class="apex-page-header__title-block">
          <div class="apex-page-header__icon"><i class="pi pi-calendar-clock"></i></div>
          <div>
            <h1 class="apex-page-header__title">Shift Management</h1>
            <p class="apex-page-header__subtitle">View, filter, and manage organizational shift configurations.</p>
          </div>
        </div>
        <div class="apex-page-header__actions">
          <div class="apex-stat-badge mr-3">
            <span class="apex-stat-badge__value">{{ totalCount() }}</span>
            <span class="apex-stat-badge__label">Total Shifts</span>
          </div>
          <button class="apex-btn apex-btn--primary" (click)="createNew()">
            <i class="pi pi-plus"></i> Add Shift
          </button>
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
                  <input type="text" pInputText
                    [ngModel]="shiftFilter().search" 
                    (ngModelChange)="onSearchChange($event)"
                    placeholder="Search Shift Name or Code..." class="apex-input w-full" />
                </div>
              </div>

              <div class="apex-filter-group min-w-14rem">
                <label class="apex-input-label">Shift Type</label>
                <p-select 
                  [options]="typeOptions" 
                  [ngModel]="shiftFilter().shiftType" 
                  (ngModelChange)="updateFilter('shiftType', $event)" 
                  placeholder="All Types"
                  styleClass="w-full"
                  [showClear]="true"
                  [filter]="true"
                  filterBy="label">
                </p-select>
              </div>

              <div class="apex-filter-group min-w-14rem">
                <label class="apex-input-label">Status</label>
                <p-select 
                  [options]="statusOptions" 
                  [ngModel]="shiftFilter().isActive" 
                  (ngModelChange)="updateFilter('isActive', $event)" 
                  placeholder="All Statuses"
                  styleClass="w-full"
                  [showClear]="true"
                  [filter]="true"
                  filterBy="label">
                </p-select>
              </div>

              <div class="apex-flex ml-auto">
                <button class="apex-btn apex-btn--secondary" (click)="resetFilters()">
                  <i class="pi pi-filter-slash"></i> Reset
                </button>
              </div>

            </div>
          </div>

          <div class="flex-1 position-relative p-3">
            <app-ag-share-grid 
              [columns]="column()" 
              [data]="data()" 
              [actionColumn]="shiftActionColumn"
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
    .min-w-14rem { min-width: 14rem; }
    .ml-auto { margin-left: auto; }
    .mr-3 { margin-right: var(--spacing-lg); }
    .position-relative { position: relative; }
    
    ::ng-deep .p-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
    }
    
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
export class ShiftListComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

  readonly shiftActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.SHIFT.READ,
    editPermission: PERMISSIONS.SHIFT.MANAGE,
    deletePermission: PERMISSIONS.SHIFT.MANAGE,
  };

  // State Signals
  isLoading = signal<boolean>(false);
  data = signal<any[]>([]);
  column = signal<any[]>([]);

  currentPage = signal<number>(1);
  totalCount = signal<number>(0);
  pageSize = 50;

  // Filter Signal State
  shiftFilter = signal({
    search: '',
    shiftType: null as string | null,
    isActive: null as boolean | null
  });

  // select Options
  typeOptions = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Rotating', value: 'rotating' },
    { label: 'Flexible', value: 'flexi' },
    { label: 'Split', value: 'split' },
    { label: 'Night', value: 'night' }
  ];

  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  ngOnInit(): void {
    this.setupColumns();
    this.setupSearchDebounce();
    this.getData(true);
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(searchTerm => {
      this.shiftFilter.update(f => ({ ...f, search: searchTerm }));
      this.getData(true);
    });
  }

  onSearchChange(value: string): void {
    // Immediate UI update, but subject handles debounce logic for API
    this.shiftFilter.update(f => ({ ...f, search: value }));
    this.searchSubject.next(value);
  }

  updateFilter(key: 'shiftType' | 'isActive', value: any): void {
    this.shiftFilter.update(f => ({ ...f, [key]: value }));
    this.getData(true);
  }

  resetFilters(): void {
    this.shiftFilter.set({ search: '', shiftType: null, isActive: null });
    this.getData(true);
  }

  createNew(): void {
    this.router.navigate(['/hrms/shifts/new']);
  }

  getData(isReset: boolean = false): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    if (isReset) {
      this.currentPage.set(1);
      this.data.set([]);
      this.totalCount.set(0);
    }

    const rawParams = {
      ...this.shiftFilter(),
      page: this.currentPage(),
      limit: this.pageSize
    };
    const params = Object.fromEntries(
      Object.entries(rawParams).filter(([, value]) => value !== null && value !== '')
    );

    this.hrmsService.getShifts(params).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        const newData = res.data?.shifts || res.data?.data || res.data || [];
        const pagination = res.pagination;

        if (pagination) {
          this.totalCount.set(pagination.totalResults);
        } else {
          this.totalCount.set(res.total ?? res.results ?? newData.length);
        }

        this.data.update(prev => isReset ? newData : [...prev, ...newData]);

        if (newData.length > 0) {
          this.currentPage.update(p => p + 1);
        }

      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  onScrolledToBottom(): void {
    if (!this.isLoading() && this.data().length < this.totalCount()) {
      this.getData(false);
    }
  }

  eventFromGrid(event: any): void {
    const shiftId = event?.row?._id;
    switch (event.type) {
      case 'cellClicked':
        this.router.navigate(['/hrms/shifts/details', shiftId]);
        break;
      case 'editStart':
        this.router.navigate(['/hrms/shifts/edit', shiftId]);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete the shift "${event.row.name}"?`)) {
          this.deleteShift(shiftId);
        }
        break;
      case 'reachedBottom':
        this.onScrolledToBottom();
        break;
    }
  }

  private deleteShift(id: string): void {
    this.hrmsService.deleteShift(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.showSuccess('Shift removed successfully');
        this.getData(true);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  setupColumns(): void {
    this.column.set([
      {
        field: 'name',
        headerName: 'Shift Name',
        width: 250,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellStyle: {
          'display': 'flex',
          'align-items': 'center',
          'font-weight': '600',
          'color': 'var(--text-primary)',
          'font-size': '13px'
        }
      },
      {
        headerName: 'Code',
        field: 'code',
        width: 120,
        filter: true,
        cellRenderer: (params: any) => {
          const code = params.value || '-';
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="background-color: var(--bg-secondary); color: var(--text-secondary); padding: 2px 8px; border-radius: var(--ui-border-radius-sm, 4px); font-family: var(--font-mono, monospace); font-size: 11px; border: 1px solid var(--border-secondary); letter-spacing: 0.5px;">
                ${code}
              </span>
            </div>`;
        }
      },
      {
        headerName: 'Timing',
        width: 180,
        valueGetter: (params: any) => params.data ? `${params.data.startTime} - ${params.data.endTime}` : '',
        cellRenderer: (params: any) => {
          const data = params.data;
          if (!data) return '';

          // Use standard PrimeIcons for consistency rather than complex raw SVG
          const icon = data.isNightShift ? 'pi-moon' : 'pi-sun';
          const iconColor = data.isNightShift ? 'var(--color-primary)' : 'var(--color-warning)';

          return `
            <div style="display:flex; align-items:center; height:100%; font-family: var(--font-mono, monospace); font-size:12px;">
              <i class="pi ${icon}" style="color: ${iconColor}; margin-right: 6px;"></i>
              <span style="font-weight:600; color:var(--text-primary);">${data.startTime}</span>
              <span style="color:var(--text-tertiary); margin: 0 6px;">→</span>
              <span style="font-weight:600; color:var(--text-primary);">${data.endTime}</span>
            </div>`;
        }
      },
      {
        headerName: 'Type',
        field: 'shiftType',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = params.value || 'fixed';
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                display: inline-flex; 
                align-items: center; 
                justify-content: center;
                box-sizing: border-box;
                line-height: 1;
                white-space: nowrap;
                color: var(--text-primary); 
                padding: 4px 10px; 
                border-radius: 999px; 
                font-size: 11px; 
                font-weight: 600; 
                border: 1px solid var(--border-primary); 
                text-transform: capitalize;
              ">
                ${type}
              </span>
            </div>`;
        }
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        sortable: true,
        cellRenderer: (params: any) => {
          const isActive = params.value;
          const bg = isActive ? 'var(--color-success-bg)' : 'var(--color-error-bg)';
          const color = isActive ? 'var(--color-success-text)' : 'var(--color-error-text)';
          const border = isActive ? 'var(--color-success-border)' : 'var(--color-error-border)';

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                line-height: 1;
                white-space: nowrap;
                background-color: ${bg}; 
                color: ${color}; 
                border: 1px solid ${border}; 
                padding: 4px 8px; 
                border-radius: var(--ui-border-radius-sm, 4px); 
                font-size: 10px; 
                font-weight: 700; 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
              ">
                ${isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>`;
        }
      }
    ]);
  }
}
