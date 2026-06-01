import { Component, OnInit, inject, ChangeDetectionStrategy, signal, DestroyRef } from '@angular/core';
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
    <div class="list-page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-xl md:mb-2xl">
        <div class="header-titles flex-col gap-xs">
          <h1 class="title font-heading text-3xl font-bold text-primary m-0">Shift Management</h1>
          <p class="subtitle text-secondary m-0">View, filter, and manage organizational shift configurations.</p>
        </div>
        <p-button label="Add Shift" icon="pi pi-plus" (onClick)="createNew()" size="small"></p-button>
      </header>

      <div class="themed-card glass-panel list-content-area">
        
        <div class="se-filter-bar flex-wrap align-items-end gap-md pb-lg border-bottom-subtle">
          
          <div class="se-filter-field flex-grow-1 md:flex-grow-0">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input pInputText type="text" 
                [ngModel]="shiftFilter().search" 
                (ngModelChange)="onSearchChange($event)" 
                placeholder="Search Shift Name or Code..." 
                class="w-full md:w-20rem" />
            </span>
          </div>

          <div class="se-filter-field">
            <p-select 
              [options]="typeOptions" 
              [ngModel]="shiftFilter().shiftType" 
              (ngModelChange)="updateFilter('shiftType', $event)" 
              placeholder="All Types"
              styleClass="w-full md:w-14rem"
              [showClear]="true"
              [filter]="true"
              filterBy="label">
            </p-select>

          </div>

          <div class="se-filter-field">
            <p-select 
              [options]="statusOptions" 
              [ngModel]="shiftFilter().isActive" 
              (ngModelChange)="updateFilter('isActive', $event)" 
              placeholder="All Statuses"
              styleClass="w-full md:w-12rem"
              [showClear]="true"
              [filter]="true"
              filterBy="label">
            </p-select>

          </div>

          <div class="se-filter-actions ml-auto flex gap-sm">
            <p-button icon="pi pi-filter-slash" label="Reset" severity="secondary" [outlined]="true" (onClick)="resetFilters()"></p-button>
          </div>
        </div>

        <div class="list-grid-wrapper mt-lg">
          <app-ag-share-grid 
            [columns]="column()" 
            [data]="data()" 
            [actionColumn]="shiftActionColumn"
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
      min-height: 100vh;
      background-color: var(--bg-secondary);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .list-page-container {
      padding: var(--spacing-2xl) var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
      height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .themed-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      padding: var(--spacing-xl);
    }

    /* Glassmorphism token support */
    .glass-panel {
      background: var(--glass-bg-c, var(--bg-primary));
      backdrop-filter: blur(var(--glass-blur-c, 10px));
      -webkit-backdrop-filter: blur(var(--glass-blur-c, 10px));
    }

    /* Utility Classes */
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .flex-grow-1 { flex-grow: 1; }
    .align-items-end { align-items: flex-end; }
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .w-full { width: 100%; }
    .m-0 { margin: 0; }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .pb-lg { padding-bottom: var(--spacing-lg); }
    .mt-lg { margin-top: var(--spacing-lg); }
    .ml-auto { margin-left: auto; }
    
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    
    .font-heading { font-family: var(--font-heading); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }

    .se-filter-bar { display: flex; }
    .list-grid-wrapper { flex: 1; min-height: 0; position: relative; }

    /* Animations */
    .fade-in { animation: fadeIn var(--transition-base); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) {
      .list-page-container { padding: var(--spacing-xl) var(--spacing-md); }
      .md\\:mb-2xl { margin-bottom: var(--spacing-2xl); }
      .md\\:w-20rem { width: 20rem; }
      .md\\:w-14rem { width: 14rem; }
      .md\\:w-12rem { width: 12rem; }
      .md\\:flex-grow-0 { flex-grow: 0; }
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .se-filter-actions { margin-left: 0; justify-content: flex-start; }
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
