import { Component, OnInit, inject, ChangeDetectionStrategy, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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

    const params = {
      ...this.shiftFilter(),
      page: this.currentPage(),
      limit: this.pageSize
    };

    this.hrmsService.getShifts(params).subscribe({
      next: (res: any) => {
        const newData = res.data?.shifts || res.data?.data || res.data || [];
        const pagination = res.pagination; 

        if (pagination) {
          this.totalCount.set(pagination.totalResults);
        }

        this.data.update(prev => isReset ? newData : [...prev, ...newData]);

        if (newData.length > 0) {
          this.currentPage.update(p => p + 1);
        }

        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
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
    this.hrmsService.deleteShift(id).subscribe({
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
          const iconColor = data.isNightShift ? 'color-mix(in srgb, var(--color-primary) 80%, black)' : 'var(--color-warning, #f59e0b)';

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
          const bg = isActive ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-error-bg, #fef2f2)';
          const color = isActive ? 'var(--color-success-text, #15803d)' : 'var(--color-error-text, #b91c1c)';
          const border = isActive ? 'var(--color-success-border, #bbf7d0)' : 'var(--color-error-border, #fecaca)';
          
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

// import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';

// import { GridApi, GridReadyEvent } from 'ag-grid-community';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-shift-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     RouterModule,
//     AgShareGrid
//   ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="list-page-container">
//       <div class="themed-card list-content-area">

//         <div class="se-filter-bar">
          
//           <div class="se-filter-field">
//             <label for="search">Search</label>
//             <input id="search" type="text" [(ngModel)]="shiftFilter.search" 
//               (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
//               placeholder="Shift Name or Code..." class="se-input w-full" />
//           </div>

//           <div class="se-filter-field">
//             <label for="shiftType">Shift Type</label>
//             <div class="select-wrapper w-full">
//               <select id="shiftType" [(ngModel)]="shiftFilter.shiftType" (change)="applyFilters()" class="se-input w-full">
//                 <option [ngValue]="null">All Types</option>
//                 <option value="fixed">Fixed</option>
//                 <option value="rotating">Rotating</option>
//                 <option value="flexi">Flexible</option>
//                 <option value="split">Split</option>
//                 <option value="night">Night</option>
//               </select>
//             </div>
//           </div>

//           <div class="se-filter-field">
//             <label for="status">Status</label>
//             <div class="select-wrapper w-full">
//               <select id="status" [(ngModel)]="shiftFilter.isActive" (change)="applyFilters()" class="se-input w-full">
//                 <option [ngValue]="null">All Statuses</option>
//                 <option [ngValue]="true">Active</option>
//                 <option [ngValue]="false">Inactive</option>
//               </select>
//             </div>
//           </div>

//           <div class="se-filter-actions">
//             <button class="btn btn-outline" (click)="resetFilters()">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
//               Reset
//             </button>
//           </div>

//           <div class="se-filter-right">
//             <button class="btn btn-primary" (click)="createNew()">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
//               Add Shift
//             </button>
//           </div>
//         </div>

//         <div class="list-grid-wrapper">
//           <app-ag-share-grid 
//             [columns]="column" 
//             [data]="data" 
//             [showActions]="true" 
//             selectionMode="single"
//             (gridEvent)="eventFromGrid($event)">
//           </app-ag-share-grid>
//         </div>

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        THEME TOKENS: INJECTED & MAPPED
//        ========================================================================== */
//     :host {
//       display: block;
//       min-height: 100vh;
//       background-color: var(--bg-secondary);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     .list-page-container {
//       padding: var(--spacing-2xl) var(--spacing-3xl);
//       max-width: 1400px;
//       margin: 0 auto;
//       height: calc(100vh - 80px);
//       display: flex;
//       flex-direction: column;
//     }

//     .themed-card {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: 0 1px 3px rgba(0,0,0,0.05);
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       overflow: hidden;
//     }

//     .list-content-area {
//       padding: var(--spacing-xl);
//       gap: var(--spacing-xl);
//     }

//     /* Filter Bar Styles */
//     .se-filter-bar {
//       display: flex;
//       flex-wrap: wrap;
//       align-items: flex-end;
//       gap: var(--spacing-lg);
//       padding-bottom: var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//     }

//     .se-filter-field {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//       min-width: 200px;
//     }

//     .se-filter-field label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-label);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }

//     .se-filter-actions {
//       display: flex;
//       align-items: flex-end;
//       margin-bottom: 2px;
//     }

//     .se-filter-right {
//       margin-left: auto;
//       display: flex;
//       align-items: flex-end;
//       margin-bottom: 2px;
//     }

//     /* Inputs & Selects */
//     .w-full { width: 100%; }

//     .se-input {
//       width: 100%;
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-md) var(--spacing-lg);
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       font-family: inherit;
//       transition: all 0.2s;
//       outline: none;
//       box-sizing: border-box;
//       height: 38px;
//     }

//     .se-input:focus {
//       border-color: var(--color-primary);
//       box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
//     }

//     .select-wrapper { position: relative; }
//     select.se-input { appearance: none; padding-right: 2.5rem; cursor: pointer; }
    
//     .select-wrapper::after {
//       content: "";
//       position: absolute;
//       right: 1rem;
//       top: 50%;
//       transform: translateY(-50%);
//       width: 10px;
//       height: 6px;
//       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
//       background-repeat: no-repeat;
//       pointer-events: none;
//     }

//     /* Buttons */
//     .btn {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       padding: 0 var(--spacing-xl);
//       height: 38px;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       font-family: var(--font-body);
//       border-radius: var(--ui-border-radius);
//       cursor: pointer;
//       transition: all 0.2s ease;
//       border: 1px solid transparent;
//       outline: none;
//     }

//     .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
//     .btn-outline:hover { background: var(--bg-secondary); border-color: var(--border-primary); }
//     .btn-primary { background: var(--color-primary); color: #ffffff; }
//     .btn-primary:hover { background: var(--color-primary-dark); }

//     .list-grid-wrapper { flex: 1; height: 100%; min-height: 0; }

//     @media (max-width: 768px) {
//       .se-filter-bar { flex-direction: column; align-items: stretch; }
//       .se-filter-right { margin-left: 0; width: 100%; }
//       .se-filter-right .btn { width: 100%; }
//     }
//   `]
// })
// export class ShiftListComponent implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);

//   private gridApi!: GridApi;
//   private currentPage = 1;
//   private isLoading = false;
//   private totalCount = 0;
//   private pageSize = 50;
  
//   data: any[] = [];
//   column: any[] = [];
  
//   shiftFilter = {
//     search: '',
//     shiftType: null,
//     isActive: null
//   };

//   ngOnInit(): void {
//     this.setupColumns();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.shiftFilter = { search: '', shiftType: null, isActive: null };
//     this.getData(true);
//   }

//   createNew() {
//     this.router.navigate(['/hrms/shifts/new']);
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     if (isReset) {
//       this.currentPage = 1;
//       this.data = [];
//       this.totalCount = 0;
//     }

//     const params = {
//       ...this.shiftFilter,
//       page: this.currentPage,
//       limit: this.pageSize
//     };

//     // Using the generic get if getShifts isn't strictly defined in the service
//     // Replace with `this.hrmsService.getShifts(params)` if you have that method.
//     this.hrmsService.getShifts().subscribe({
//       next: (res: any) => {
//         // Handle nested response structures gracefully
//         const newData = res.data?.shifts || res.data?.data || res.data || [];
//         const pagination = res.pagination; 

//         if (pagination) {
//           this.totalCount = pagination.totalResults;
//         }

//         this.data = isReset ? newData : [...this.data, ...newData];

//         if (newData.length > 0) {
//           this.currentPage++;
//         }

//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err: any) => {
//         this.isLoading = false;
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   onScrolledToBottom() {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   onGridReady(params: GridReadyEvent) {
//     this.gridApi = params.api;
//   }

//   eventFromGrid(event: any) {
//     const shiftId = event?.row?._id;
//     switch (event.type) {
//       case 'cellClicked':
//         this.router.navigate(['/hrms/shifts/details', shiftId]);
//         break;
//       case 'editStart':
//         this.router.navigate(['/hrms/shifts/edit', shiftId]);
//         break;
//       case 'delete':
//         const shiftName = event.row.name;
//         if (window.confirm(
//           `Are you sure you want to delete the shift "${shiftName}"?`
//         )) {
//           this.deleteShift(shiftId);
//         }
//         break;
//       case 'reachedBottom':
//         this.onScrolledToBottom();
//         break;
//     }
//   }

//   private deleteShift(id: string) {
//     this.hrmsService.deleteShift(id).subscribe({
//       next: () => {
//         this.messageService.showSuccess( 'Shift removed successfully');
//         this.getData(true);
//       },
//       error: (err: any) => {
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }

//   setupColumns(): void {
//     this.column = [
//       // 1. SHIFT NAME
//       {
//         field: 'name',
//         headerName: 'Shift Name',
//         width: 250,
//         pinned: 'left',
//         sortable: true,
//         filter: true,
//         cellStyle: {
//           'display': 'flex',
//           'align-items': 'center',
//           'font-weight': '600',
//           'color': 'var(--text-primary)',
//           'font-size': '13px'
//         }
//       },

//       // 2. CODE (Badge Style)
//       {
//         headerName: 'Code',
//         field: 'code',
//         width: 120,
//         filter: true,
//         cellRenderer: (params: any) => {
//           const code = params.value || '-';
//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="
//                 background-color: var(--bg-secondary); 
//                 color: var(--text-secondary); 
//                 padding: 2px 8px; 
//                 border-radius: 4px; 
//                 font-family: var(--font-mono, monospace);
//                 font-size: 11px; 
//                 border: 1px solid var(--border-secondary);
//                 letter-spacing: 0.5px;
//               ">
//                 ${code}
//               </span>
//             </div>`;
//         }
//       },

//       // 3. TIMING (Start - End)
//       {
//         headerName: 'Timing',
//         width: 180,
//         valueGetter: (params: any) => {
//           if (!params.data) return '';
//           return `${params.data.startTime} - ${params.data.endTime}`;
//         },
//         cellRenderer: (params: any) => {
//           const data = params.data;
//           if (!data) return '';
//           const nightIcon = data.isNightShift 
//             ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" style="margin-right: 6px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>` 
//             : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="margin-right: 6px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

//           return `
//             <div style="display:flex; align-items:center; height:100%; font-family: var(--font-mono, monospace); font-size:12px;">
//               ${nightIcon}
//               <span style="font-weight:600; color:var(--text-primary);">${data.startTime}</span>
//               <span style="color:var(--text-tertiary); margin: 0 4px;">to</span>
//               <span style="font-weight:600; color:var(--text-primary);">${data.endTime}</span>
//             </div>`;
//         }
//       },

//       // 4. SHIFT TYPE
//       {
//         headerName: 'Type',
//         field: 'shiftType',
//         width: 120,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           const type = params.value || 'fixed';
//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="
//                 background-color: transparent; 
//                 color: var(--text-primary); 
//                 padding: 2px 8px; 
//                 border-radius: 999px; 
//                 font-size: 11px; 
//                 font-weight: 600;
//                 border: 1px solid var(--border-primary);
//                 text-transform: capitalize;
//               ">
//                 ${type}
//               </span>
//             </div>`;
//         }
//       },

//       // 5. STATUS
//       {
//         field: 'isActive',
//         headerName: 'Status',
//         width: 100,
//         sortable: true,
//         cellRenderer: (params: any) => {
//           const isActive = params.value;
          
//           const bg = isActive ? '#ecfdf5' : '#fef2f2';
//           const color = isActive ? '#15803d' : '#b91c1c';
//           const border = isActive ? '#bbf7d0' : '#fecaca';
          
//           return `
//             <div style="display:flex; align-items:center; height:100%;">
//               <span style="
//                 background-color: ${bg}; 
//                 color: ${color}; 
//                 border: 1px solid ${border}; 
//                 padding: 1px 8px; 
//                 border-radius: 4px; 
//                 font-size: 10px; 
//                 font-weight: 700; 
//                 text-transform: uppercase; 
//                 line-height: 1.2; 
//                 white-space: nowrap;
//                 letter-spacing: 0.5px;
//               ">
//                 ${isActive ? 'ACTIVE' : 'INACTIVE'}
//               </span>
//             </div>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }
