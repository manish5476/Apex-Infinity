import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { HRMSService } from '../../hrms.service';
import { rxResource } from '@angular/core/rxjs-interop'; // If using Angular 19+ utilities
import { of } from 'rxjs';
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
                <option [ngValue]="null">All Grades</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label for="status">Status</label>
            <div class="select-wrapper w-full">
              <select id="status" [ngModel]="filters().isActive" (change)="updateStatus($event)" class="se-input w-full">
                <option [ngValue]="null">All Statuses</option>
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
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
      color: white;
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

  constructor() {
    // Effect to auto-load data when filters or page changes
    effect(() => {
      this.loadData();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.setupColumns();
  }

  // --- Logic ---
  private loadData(isReset: boolean = true) {
    this.isLoading.set(true);
    
    const params = {
      ...this.filters(),
      page: this.currentPage(),
      limit: this.pageSize()
    };

    this.hrmsService.getDesignations(params).pipe(
      finalize(() => this.isLoading.set(false)),
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const newData = res.data?.designations || res.data?.data || [];
        this.totalCount.set(res.pagination?.totalResults || 0);
        this.data.set(isReset ? newData : [...this.data(), ...newData]);
      }
    });
  }

  // --- Filter Updates ---
  updateSearch(val: string) {
    this.filters.update(f => ({ ...f, search: val }));
    this.currentPage.set(1);
  }

  updateGrade(event: any) {
    this.filters.update(f => ({ ...f, grade: event.target.value }));
    this.currentPage.set(1);
  }

  updateStatus(event: any) {
    const val = event.target.value === 'true' ? true : event.target.value === 'false' ? false : null;
    this.filters.update(f => ({ ...f, isActive: val }));
    this.currentPage.set(1);
  }

  resetFilters() {
    this.filters.set({ search: '', grade: null, isActive: null });
    this.currentPage.set(1);
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
    this.hrmsService.deleteDesignation(id).subscribe(() => {
      this.messageService.showSuccess('Deleted');
      this.loadData(true);
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
// import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
// import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
// import { HRMSService } from '../../hrms.service';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-designation-list',
//   standalone: true,
//   imports: [
//     FormsModule,
//     RouterModule,
//     AgShareGrid
// ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="list-page-container fade-in">
      
//       <div class="list-header">
//         <div class="title-section">
//           <div class="icon-box"><i class="pi pi-id-card"></i></div>
//           <div class="text-content">
//             <h2 class="page-title">Designations</h2>
//             <p class="page-subtitle">Manage job titles, levels, and organizational grades.</p>
//           </div>
//         </div>
//         <div class="stats-badge">
//           <span class="count">{{ totalCount }}</span>
//           <span class="label">Total Records</span>
//         </div>
//       </div>

//       <div class="themed-card list-content-area">

//         <div class="se-filter-bar">
          
//           <div class="se-filter-field search-field">
//             <label for="search">Search</label>
//             <div class="input-icon-wrapper w-full">
//               <i class="pi pi-search input-icon"></i>
//               <input id="search" type="text" [(ngModel)]="desigFilter.search" 
//                 (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
//                 placeholder="Title or Code..." class="se-input w-full with-icon" />
//             </div>
//           </div>

//           <div class="se-filter-field">
//             <label for="grade">Grade</label>
//             <div class="select-wrapper w-full">
//               <select id="grade" [(ngModel)]="desigFilter.grade" (change)="applyFilters()" class="se-input w-full">
//                 <option [ngValue]="null">All Grades</option>
//                 <option value="A">Grade A</option>
//                 <option value="B">Grade B</option>
//                 <option value="C">Grade C</option>
//                 <option value="D">Grade D</option>
//                 <option value="E">Grade E</option>
//                 <option value="F">Grade F</option>
//               </select>
//             </div>
//           </div>

//           <div class="se-filter-field">
//             <label for="status">Status</label>
//             <div class="select-wrapper w-full">
//               <select id="status" [(ngModel)]="desigFilter.isActive" (change)="applyFilters()" class="se-input w-full">
//                 <option [ngValue]="null">All Statuses</option>
//                 <option [ngValue]="true">Active</option>
//                 <option [ngValue]="false">Inactive</option>
//               </select>
//             </div>
//           </div>

//           <div class="se-filter-actions">
//             <button class="btn btn-outline" (click)="resetFilters()">
//               <i class="pi pi-refresh"></i> Reset
//             </button>
//           </div>

//           <div class="se-filter-right">
//             <button class="btn btn-primary" (click)="createNew()">
//               <i class="pi pi-plus"></i> Add Designation
//             </button>
//           </div>
//         </div>

//         <div class="list-grid-wrapper">
//           <app-ag-share-grid 
//             [columns]="column" 
//             [data]="data" 
//             [actionColumn]="designationActionColumn"
//             selectionMode="single"
//             (gridEvent)="eventFromGrid($event)">
//           </app-ag-share-grid>
//         </div>

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        THEME TOKENS & LAYOUT
//        ========================================================================== */
//     :host {
//       display: block;
//       height: 100%;
//       background-color: var(--bg-secondary);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     .list-page-container {
//       padding: var(--spacing-xl) var(--spacing-3xl);
//       max-width: 1600px;
//       margin: 0 auto;
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xl);
//     }

//     /* HEADER */
//     .list-header {
//       display: flex; justify-content: space-between; align-items: center;
//       flex-shrink: 0;
//     }
//     .title-section { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-box {
//       width: 48px; height: 48px; border-radius: 12px;
//       background: var(--bg-primary); border: 1px solid var(--border-secondary);
//       display: flex; align-items: center; justify-content: center;
//       font-size: 24px; color: var(--color-primary); box-shadow: var(--shadow-sm);
//     }
//     .page-title { font-size: 24px; font-weight: 800; font-family: var(--font-heading); margin: 0; letter-spacing: -0.5px; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 4px 0 0 0; }
    
//     .stats-badge {
//       display: flex; align-items: center; gap: 8px;
//       background: var(--bg-primary); padding: 8px 16px;
//       border-radius: 20px; border: 1px solid var(--border-secondary);
//       box-shadow: var(--shadow-sm);
//     }
//     .stats-badge .count { font-weight: 800; font-size: 16px; color: var(--color-primary); }
//     .stats-badge .label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

//     /* CARD */
//     .themed-card {
//       flex: 1; background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: 20px; box-shadow: var(--shadow-lg);
//       display: flex; flex-direction: column;
//       overflow: hidden; padding: var(--spacing-2xl);
//       gap: var(--spacing-xl);
//     }

//     /* FILTER BAR */
//     .se-filter-bar {
//       display: flex; flex-wrap: wrap; align-items: flex-end;
//       gap: var(--spacing-lg); padding-bottom: var(--spacing-lg);
//     }

//     .se-filter-field { display: flex; flex-direction: column; gap: 6px; min-width: 180px; }
//     .search-field { flex: 1; max-width: 350px; }
    
//     .se-filter-field label {
//       font-size: 11px; font-weight: 700; color: var(--text-tertiary);
//       text-transform: uppercase; letter-spacing: 0.5px;
//     }

//     .se-filter-actions { display: flex; align-items: flex-end; margin-bottom: 2px; }
//     .se-filter-right { margin-left: auto; display: flex; align-items: flex-end; margin-bottom: 2px; }

//     /* INPUTS & SELECTS */
//     .w-full { width: 100%; }

//     .input-icon-wrapper { position: relative; display: flex; align-items: center; }
//     .input-icon { position: absolute; left: 12px; color: var(--text-tertiary); font-size: 14px; }
    
//     .se-input {
//       width: 100%; height: 40px; background: var(--bg-primary);
//       border: 1px solid var(--border-secondary); border-radius: 8px;
//       padding: 0 16px; font-size: 13px; color: var(--text-primary);
//       font-family: inherit; transition: all 0.2s; outline: none;
//     }
//     .se-input.with-icon { padding-left: 36px; }
//     .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

//     .select-wrapper { position: relative; }
//     select.se-input { appearance: none; padding-right: 36px; cursor: pointer; font-weight: 500; }
    
//     .select-wrapper::after {
//       content: "\\e933"; /* PrimeIcons chevron-down */
//       font-family: 'primeicons'; position: absolute; right: 14px; top: 50%;
//       transform: translateY(-50%); color: var(--text-tertiary);
//       pointer-events: none; font-size: 12px;
//     }

//     /* BUTTONS */
//     .btn {
//       display: inline-flex; align-items: center; justify-content: center; gap: 8px;
//       height: 40px; padding: 0 20px; font-size: 13px; font-weight: 600;
//       border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none;
//     }
//     .btn i { font-size: 14px; }

//     .btn-outline {
//       background: var(--bg-primary); border: 1px solid var(--border-secondary);
//       color: var(--text-primary);
//     }
//     .btn-outline:hover { background: var(--bg-secondary); border-color: var(--text-tertiary); }

//     .btn-primary { background: var(--color-primary); color: #ffffff; }
//     .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

//     /* GRID WRAPPER */
//     .list-grid-wrapper { flex: 1; min-height: 0; width: 100%; border: 1px solid var(--border-secondary); border-radius: 12px; overflow: hidden; }
//     app-ag-share-grid { height: 100%; width: 100%; display: block; }

//     /* ANIMATIONS & RESPONSIVE */
//     @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

//     @media (max-width: 768px) {
//       .list-page-container { padding: var(--spacing-lg); }
//       .se-filter-bar { flex-direction: column; align-items: stretch; }
//       .search-field { max-width: 100%; }
//       .se-filter-right { margin-left: 0; }
//       .btn { width: 100%; }
//     }
//   `]
// })
// export class DesignationListComponent implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   private cdr = inject(ChangeDetectorRef);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);

//   public currentPage = 1;
//   public isLoading = false;
//   public totalCount = 0;
//   private pageSize = 50;
  
//   data: any[] = [];
//   column: any[] = [];
  
//   desigFilter = {
//     search: '',
//     grade: null,
//     isActive: null
//   };

//   readonly designationActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: true,
//     showDelete: true,
//     viewPermission: PERMISSIONS.DESIGNATION.READ,
//     editPermission: PERMISSIONS.DESIGNATION.MANAGE,
//     deletePermission: PERMISSIONS.DESIGNATION.MANAGE,
//   };

//   ngOnInit(): void {
//     this.setupColumns();
//     this.getData(true);
//   }

//   applyFilters() {
//     this.getData(true);
//   }

//   resetFilters() {
//     this.desigFilter = { search: '', grade: null, isActive: null };
//     this.getData(true);
//   }

//   createNew() {
//     this.router.navigate(['/hrms/designation/new']);
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
//       ...this.desigFilter,
//       page: this.currentPage,
//       limit: this.pageSize
//     };

//     this.hrmsService.getDesignations(params).pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         const newData = res.data?.designations || res.data?.data || [];
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
//         this.messageService.handleHttpError(err)
//       }
//     });
//   }

//   onScrolledToBottom() {
//     if (!this.isLoading && this.data.length < this.totalCount) {
//       this.getData(false);
//     }
//   }

//   eventFromGrid(event: any) {
//     const desigId = event?.row?._id;
//     switch (event.type) {
//       case 'cellClicked':
//         this.router.navigate(['/hrms/designation/details', desigId]);
//         break;
//       case 'editStart':
//         this.router.navigate(['/hrms/designation/edit', desigId]);
//         break;
//       case 'delete':
//         const desigTitle = event.row.title;
//         if (window.confirm(`Are you sure you want to delete the designation "${desigTitle}"?`)) {
//           this.deleteDesignation(desigId);
//         }
//         break;
//       case 'reachedBottom':
//         this.onScrolledToBottom();
//         break;
//     }
//   }

//   private deleteDesignation(id: string) {
//     this.hrmsService.deleteDesignation(id).pipe(takeUntil(this.destroy$)).subscribe({
//       next: () => {
//         this.messageService.showSuccess( 'Designation removed successfully');
//         this.getData(true);
//       },
//       error: (err: any) => {
//         this.messageService.handleHttpError(err)
//       }
//     });
//   }

//   // --- Highly Polished AG Grid Columns ---
//   setupColumns(): void {
//     this.column = [
//       {
//         field: 'title',
//         headerName: 'DESIGNATION TITLE',
//         width: 280,
//         pinned: 'left',
//         sortable: true,
//         filter: true,
//         cellRenderer: (p: any) => `
//           <div style="height: 100%; display: flex; align-items: center; gap: 10px;">
//             <div style="width: 4px; height: 16px; border-radius: 2px; background: var(--accent-primary);"></div>
//             <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${p.value}</span>
//           </div>
//         `
//       },
//       {
//         headerName: 'JOB CODE',
//         field: 'code',
//         width: 130,
//         filter: true,
//         cellRenderer: (p: any) => `
//           <div style="height: 100%; display: flex; align-items: center;">
//             <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-secondary); color: var(--text-secondary); letter-spacing: 0.5px; line-height: 1;">
//               ${p.value || 'N/A'}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'LEVEL',
//         field: 'level',
//         width: 110,
//         sortable: true,
//         cellRenderer: (p: any) => `
//           <div style="height: 100%; display: flex; align-items: center;">
//             <span style="background: var(--color-primary-bg, rgba(59, 130, 246, 0.1)); color: var(--color-primary); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; line-height: 1;">
//               Lvl ${p.value || 0}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'GRADE',
//         field: 'grade',
//         width: 110,
//         sortable: true,
//         cellRenderer: (p: any) => `
//           <div style="height: 100%; display: flex; align-items: center;">
//             <span style="color: var(--text-primary); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid var(--border-secondary); background: var(--bg-primary); line-height: 1;">
//               Grade ${p.value || '-'}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'JOB FAMILY',
//         field: 'jobFamily',
//         flex: 1,
//         minWidth: 180,
//         filter: true,
//         cellRenderer: (p: any) => `
//           <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500;">
//             <i class="pi pi-briefcase" style="font-size: 12px; color: var(--text-tertiary);"></i>
//             ${p.value || 'Unspecified'}
//           </div>
//         `
//       },
//       {
//         field: 'isActive',
//         headerName: 'STATUS',
//         width: 140,
//         pinned: 'right',
//         sortable: true,
//         cellRenderer: (p: any) => {
//           const isActive = p.value;
//           const color = isActive ? 'var(--theme-success, #10b981)' : 'var(--theme-error, #ef4444)';
//           const bg = isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
//           const text = isActive ? 'ACTIVE' : 'INACTIVE';
          
//           return `
//             <div style="height: 100%; display: flex; align-items: center; justify-content: flex-end;">
//               <span style="background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; border: 1px solid ${color}; line-height: 1; letter-spacing: 0.5px;">
//                 ${text}
//               </span>
//             </div>
//           `;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }

// // import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { Router, RouterModule } from '@angular/router';
// // import { GridApi, GridReadyEvent } from 'ag-grid-community';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
// // import { HRMSService } from '../../hrms.service';
// // @Component({
// //   selector: 'app-designation-list',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     RouterModule,
// //     AgShareGrid
// //   ],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <div class="list-page-container">
// //       <div class="themed-card list-content-area">

// //         <div class="se-filter-bar">
          
// //           <div class="se-filter-field">
// //             <label for="search">Search</label>
// //             <input id="search" type="text" [(ngModel)]="desigFilter.search" 
// //               (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
// //               placeholder="Title or Code..." class="se-input w-full" />
// //           </div>

// //           <div class="se-filter-field">
// //             <label for="grade">Grade</label>
// //             <div class="select-wrapper w-full">
// //               <select id="grade" [(ngModel)]="desigFilter.grade" (change)="applyFilters()" class="se-input w-full">
// //                 <option [ngValue]="null">All Grades</option>
// //                 <option value="A">Grade A</option>
// //                 <option value="B">Grade B</option>
// //                 <option value="C">Grade C</option>
// //                 <option value="D">Grade D</option>
// //                 <option value="E">Grade E</option>
// //                 <option value="F">Grade F</option>
// //               </select>
// //             </div>
// //           </div>

// //           <div class="se-filter-field">
// //             <label for="status">Status</label>
// //             <div class="select-wrapper w-full">
// //               <select id="status" [(ngModel)]="desigFilter.isActive" (change)="applyFilters()" class="se-input w-full">
// //                 <option [ngValue]="null">All Statuses</option>
// //                 <option [ngValue]="true">Active</option>
// //                 <option [ngValue]="false">Inactive</option>
// //               </select>
// //             </div>
// //           </div>

// //           <div class="se-filter-actions">
// //             <button class="btn btn-outline" (click)="resetFilters()">
// //               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
// //               Reset
// //             </button>
// //           </div>

// //           <div class="se-filter-right">
// //             <button class="btn btn-primary" (click)="createNew()">
// //               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
// //               Add Designation
// //             </button>
// //           </div>
// //         </div>

// //         <div class="list-grid-wrapper">
// //           <app-ag-share-grid 
// //             [columns]="column" 
// //             [data]="data" 
// //             [showActions]="true" 
// //             selectionMode="single"
// //             (gridEvent)="eventFromGrid($event)">
// //           </app-ag-share-grid>
// //         </div>

// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     /* ==========================================================================
// //        THEME TOKENS: INJECTED & MAPPED
// //        ========================================================================== */
// //     :host {
// //       display: block;
// //       min-height: 100vh;
// //       background-color: var(--bg-secondary);
// //       font-family: var(--font-body);
// //       color: var(--text-primary);
// //     }

// //     .list-page-container {
// //       padding: var(--spacing-2xl) var(--spacing-3xl);
// //       max-width: 1400px;
// //       margin: 0 auto;
// //       height: calc(100vh - 80px);
// //       display: flex;
// //       flex-direction: column;
// //     }

// //     .themed-card {
// //       background: var(--bg-primary);
// //       border: 1px solid var(--border-primary);
// //       border-radius: var(--ui-border-radius-lg);
// //       box-shadow: 0 1px 3px rgba(0,0,0,0.05);
// //       display: flex;
// //       flex-direction: column;
// //       height: 100%;
// //       overflow: hidden;
// //     }

// //     .list-content-area {
// //       padding: var(--spacing-xl);
// //       gap: var(--spacing-xl);
// //     }

// //     /* Filter Bar Styles */
// //     .se-filter-bar {
// //       display: flex;
// //       flex-wrap: wrap;
// //       align-items: flex-end;
// //       gap: var(--spacing-lg);
// //       padding-bottom: var(--spacing-lg);
// //       border-bottom: 1px solid var(--border-primary);
// //     }

// //     .se-filter-field {
// //       display: flex;
// //       flex-direction: column;
// //       gap: var(--spacing-xs);
// //       min-width: 200px;
// //     }

// //     .se-filter-field label {
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-semibold);
// //       color: var(--text-label);
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //     }

// //     .se-filter-actions {
// //       display: flex;
// //       align-items: flex-end;
// //       margin-bottom: 2px;
// //     }

// //     .se-filter-right {
// //       margin-left: auto;
// //       display: flex;
// //       align-items: flex-end;
// //       margin-bottom: 2px;
// //     }

// //     /* Inputs & Selects */
// //     .w-full { width: 100%; }

// //     .se-input {
// //       width: 100%;
// //       background: var(--bg-primary);
// //       border: 1px solid var(--border-secondary);
// //       border-radius: var(--ui-border-radius);
// //       padding: var(--spacing-md) var(--spacing-lg);
// //       font-size: var(--font-size-sm);
// //       color: var(--text-primary);
// //       font-family: inherit;
// //       transition: all 0.2s;
// //       outline: none;
// //       box-sizing: border-box;
// //       height: 38px;
// //     }

// //     .se-input:focus {
// //       border-color: var(--color-primary);
// //       box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
// //     }

// //     .select-wrapper {
// //       position: relative;
// //     }
    
// //     select.se-input {
// //       appearance: none;
// //       padding-right: 2.5rem;
// //       cursor: pointer;
// //     }
    
// //     .select-wrapper::after {
// //       content: "";
// //       position: absolute;
// //       right: 1rem;
// //       top: 50%;
// //       transform: translateY(-50%);
// //       width: 10px;
// //       height: 6px;
// //       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
// //       background-repeat: no-repeat;
// //       pointer-events: none;
// //     }

// //     /* Buttons */
// //     .btn {
// //       display: inline-flex;
// //       align-items: center;
// //       justify-content: center;
// //       padding: 0 var(--spacing-xl);
// //       height: 38px;
// //       font-size: var(--font-size-sm);
// //       font-weight: var(--font-weight-medium);
// //       font-family: var(--font-body);
// //       border-radius: var(--ui-border-radius);
// //       cursor: pointer;
// //       transition: all 0.2s ease;
// //       border: 1px solid transparent;
// //       outline: none;
// //     }

// //     .btn-outline {
// //       background: var(--bg-primary);
// //       border-color: var(--border-secondary);
// //       color: var(--text-primary);
// //     }

// //     .btn-outline:hover {
// //       background: var(--bg-secondary);
// //       border-color: var(--border-primary);
// //     }

// //     .btn-primary {
// //       background: var(--color-primary);
// //       color: #ffffff;
// //     }

// //     .btn-primary:hover {
// //       background: var(--color-primary-dark);
// //     }

// //     .list-grid-wrapper {
// //       flex: 1;
// //       height: 100%;
// //       min-height: 0;
// //     }

// //     @media (max-width: 768px) {
// //       .se-filter-bar { flex-direction: column; align-items: stretch; }
// //       .se-filter-right { margin-left: 0; width: 100%; }
// //       .se-filter-right .btn { width: 100%; }
// //     }
// //   `]
// // })
// // export class DesignationListComponent implements OnInit {
// //   private cdr = inject(ChangeDetectorRef);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);
// //   private router = inject(Router);

// //   private gridApi!: GridApi;
// //   private currentPage = 1;
// //   private isLoading = false;
// //   private totalCount = 0;
// //   private pageSize = 50;
  
// //   data: any[] = [];
// //   column: any[] = [];
  
// //   desigFilter = {
// //     search: '',
// //     grade: null,
// //     isActive: null
// //   };

// //   ngOnInit(): void {
// //     this.setupColumns();
// //     this.getData(true);
// //   }

// //   applyFilters() {
// //     this.getData(true);
// //   }

// //   resetFilters() {
// //     this.desigFilter = { search: '', grade: null, isActive: null };
// //     this.getData(true);
// //   }

// //   createNew() {
// //     this.router.navigate(['/hrms/designation/new']);
// //   }

// //   getData(isReset: boolean = false) {
// //     if (this.isLoading) return;
// //     this.isLoading = true;

// //     if (isReset) {
// //       this.currentPage = 1;
// //       this.data = [];
// //       this.totalCount = 0;
// //     }

// //     const params = {
// //       ...this.desigFilter,
// //       page: this.currentPage,
// //       limit: this.pageSize
// //     };

// //     this.hrmsService.getDesignations(params).subscribe({
// //       next: (res: any) => {
// //         // Handle nested response structures gracefully
// //         const newData = res.data?.designations || res.data?.data || [];
// //         const pagination = res.pagination; 

// //         if (pagination) {
// //           this.totalCount = pagination.totalResults;
// //         }

// //         this.data = isReset ? newData : [...this.data, ...newData];

// //         if (newData.length > 0) {
// //           this.currentPage++;
// //         }

// //         this.isLoading = false;
// //         this.cdr.markForCheck();
// //       },
// //       error: (err: any) => {
// //         this.isLoading = false;
// //         this.messageService.handleHttpError(err)
// //       }
// //     });
// //   }

// //   onScrolledToBottom() {
// //     if (!this.isLoading && this.data.length < this.totalCount) {
// //       this.getData(false);
// //     }
// //   }

// //   onGridReady(params: GridReadyEvent) {
// //     this.gridApi = params.api;
// //   }

// //   eventFromGrid(event: any) {
// //     const desigId = event?.row?._id;
// //     switch (event.type) {
// //       case 'cellClicked':
// //         // Assuming you have a details route configured
// //         this.router.navigate(['/hrms/designation/details', desigId]);
// //         break;
// //       case 'editStart':
// //         this.router.navigate(['/hrms/designation/edit', desigId]);
// //         break;
// //       case 'delete':
// //         const desigTitle = event.row.title;
// //         if (window.confirm(
// //           `Are you sure you want to delete the designation "${desigTitle}"?`
// //         )) {
// //           this.deleteDesignation(desigId);
// //         }
// //         break;
// //       case 'reachedBottom':
// //         this.onScrolledToBottom();
// //         break;
// //     }
// //   }

// //   private deleteDesignation(id: string) {
// //     this.hrmsService.deleteDesignation(id).subscribe({
// //       next: () => {
// //         this.messageService.showSuccess( 'Designation removed successfully');
// //         this.getData(true);
// //       },
// //       error: (err: any) => {
// //         this.messageService.handleHttpError(err)
// //       }
// //     });
// //   }

// //   setupColumns(): void {
// //     this.column = [
// //       // 1. DESIGNATION TITLE
// //       {
// //         field: 'title',
// //         headerName: 'Designation Title',
// //         width: 250,
// //         pinned: 'left',
// //         sortable: true,
// //         filter: true,
// //         cellStyle: {
// //           'display': 'flex',
// //           'align-items': 'center',
// //           'font-weight': '600',
// //           'color': 'var(--text-primary)',
// //           'font-size': '13px'
// //         }
// //       },

// //       // 2. CODE (Badge Style)
// //       {
// //         headerName: 'Job Code',
// //         field: 'code',
// //         width: 120,
// //         filter: true,
// //         cellRenderer: (params: any) => {
// //           const code = params.value || '-';
// //           return `
// //             <div style="display:flex; align-items:center; height:100%;">
// //               <span style="
// //                 background-color: var(--bg-secondary); 
// //                 color: var(--text-secondary); 
// //                 padding: 2px 8px; 
// //                 border-radius: 4px; 
// //                 font-family: var(--font-mono, monospace);
// //                 font-size: 11px; 
// //                 border: 1px solid var(--border-secondary);
// //                 letter-spacing: 0.5px;
// //               ">
// //                 ${code}
// //               </span>
// //             </div>`;
// //         }
// //       },

// //       // 3. LEVEL
// //       {
// //         headerName: 'Level',
// //         field: 'level',
// //         width: 100,
// //         sortable: true,
// //         cellRenderer: (params: any) => {
// //           const level = params.value || 0;
// //           return `
// //             <div style="display:flex; align-items:center; height:100%;">
// //               <span style="font-weight:600; color:var(--color-primary); font-size:13px;">Lvl ${level}</span>
// //             </div>`;
// //         }
// //       },

// //       // 4. GRADE
// //       {
// //         headerName: 'Grade',
// //         field: 'grade',
// //         width: 100,
// //         sortable: true,
// //         cellRenderer: (params: any) => {
// //           const grade = params.value || '-';
// //           return `
// //             <div style="display:flex; align-items:center; height:100%;">
// //               <span style="
// //                 background-color: transparent; 
// //                 color: var(--text-primary); 
// //                 padding: 2px 8px; 
// //                 border-radius: 999px; 
// //                 font-size: 11px; 
// //                 font-weight: 600;
// //                 border: 1px solid var(--border-primary);
// //               ">
// //                 Grade ${grade}
// //               </span>
// //             </div>`;
// //         }
// //       },

// //       // 5. JOB FAMILY
// //       {
// //         headerName: 'Job Family',
// //         field: 'jobFamily',
// //         width: 180,
// //         filter: true,
// //         valueFormatter: (p: any) => p.value || 'Unspecified',
// //         cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-secondary)', 'font-size': '12px' }
// //       },

// //       // 6. STATUS (Refined Compact Style)
// //       {
// //         field: 'isActive',
// //         headerName: 'Status',
// //         width: 100,
// //         sortable: true,
// //         cellRenderer: (params: any) => {
// //           const isActive = params.value;
          
// //           const bg = isActive ? '#ecfdf5' : '#fef2f2';
// //           const color = isActive ? '#15803d' : '#b91c1c';
// //           const border = isActive ? '#bbf7d0' : '#fecaca';
          
// //           return `
// //             <div style="display:flex; align-items:center; height:100%;">
// //               <span style="
// //                 background-color: ${bg}; 
// //                 color: ${color}; 
// //                 border: 1px solid ${border}; 
// //                 padding: 1px 8px; 
// //                 border-radius: 4px; 
// //                 font-size: 10px; 
// //                 font-weight: 700; 
// //                 text-transform: uppercase; 
// //                 line-height: 1.2; 
// //                 white-space: nowrap;
// //                 letter-spacing: 0.5px;
// //               ">
// //                 ${isActive ? 'ACTIVE' : 'INACTIVE'}
// //               </span>
// //             </div>`;
// //         }
// //       }
// //     ];
// //     this.cdr.detectChanges();
// //   }
// // }
