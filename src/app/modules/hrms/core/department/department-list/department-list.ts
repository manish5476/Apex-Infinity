import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';

import { MasterListService } from '../../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';
import { AgShareGrid, ActionColumnConfig } from '../../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../../core/auth/permissions.constants';
import { Subject } from "rxjs";

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      
      <div class="list-header">
        <div class="title-section">
          <div class="icon-box"><i class="pi pi-building"></i></div>
          <div class="text-content">
            <h2 class="page-title">Departments</h2>
            <p class="page-subtitle">Manage organizational structure, branches, and leadership.</p>
          </div>
        </div>
        <div class="stats-badge">
          <span class="count">{{ totalCount }}</span>
          <span class="label">Total Records</span>
        </div>
      </div>

      <div class="themed-card list-content-area">

        <div class="se-filter-bar">
          
          <div class="se-filter-field search-field">
            <label for="search">Search</label>
            <div class="input-icon-wrapper w-full">
              <i class="pi pi-search input-icon"></i>
              <input id="search" type="text" [(ngModel)]="deptFilter.search" 
                (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
                placeholder="Department name or code..." class="se-input w-full with-icon" />
            </div>
          </div>

          <div class="se-filter-field">
            <label for="branch">Branch</label>
            <div class="select-wrapper w-full">
              <select id="branch" [(ngModel)]="deptFilter.branchId" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Branches</option>
                @for (branch of branchOptions(); track branch._id) {
                  <option [value]="branch._id">{{ branch.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label for="status">Status</label>
            <div class="select-wrapper w-full">
              <select id="status" [(ngModel)]="deptFilter.isActive" (change)="applyFilters()" class="se-input w-full">
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
              <i class="pi pi-plus"></i> Add Department
            </button>
          </div>
        </div>

        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            [actionColumn]="departmentActionColumn"
            selectionMode="single"
            (gridEvent)="eventFromGrid($event)">
          </app-ag-share-grid>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME TOKENS & LAYOUT
       ========================================================================== */
    :host {
      display: block;
      height: 100%;
      background-color: var(--bg-secondary);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .list-page-container {
      padding: var(--spacing-xl) var(--spacing-3xl);
      max-width: 1600px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    /* HEADER */
    .list-header {
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .title-section { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-box {
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--bg-primary); border: 1px solid var(--border-secondary);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: var(--color-primary); box-shadow: var(--shadow-sm);
    }
    .page-title { font-size: 24px; font-weight: 800; font-family: var(--font-heading); margin: 0; letter-spacing: -0.5px; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 4px 0 0 0; }
    
    .stats-badge {
      display: flex; align-items: center; gap: 8px;
      background: var(--bg-primary); padding: 8px 16px;
      border-radius: 20px; border: 1px solid var(--border-secondary);
      box-shadow: var(--shadow-sm);
    }
    .stats-badge .count { font-weight: 800; font-size: 16px; color: var(--color-primary); }
    .stats-badge .label { font-size: 12px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

    /* CARD */
    .themed-card {
      flex: 1; background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: 20px; box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column;
      overflow: hidden; padding: var(--spacing-2xl);
      gap: var(--spacing-xl);
    }

    /* FILTER BAR */
    .se-filter-bar {
      display: flex; flex-wrap: wrap; align-items: flex-end;
      gap: var(--spacing-lg); padding-bottom: var(--spacing-lg);
    }

    .se-filter-field { display: flex; flex-direction: column; gap: 6px; min-width: 180px; }
    .search-field { flex: 1; max-width: 350px; }
    
    .se-filter-field label {
      font-size: 11px; font-weight: 700; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    .se-filter-actions { display: flex; align-items: flex-end; margin-bottom: 2px; }
    .se-filter-right { margin-left: auto; display: flex; align-items: flex-end; margin-bottom: 2px; }

    /* INPUTS & SELECTS */
    .w-full { width: 100%; }

    .input-icon-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 12px; color: var(--text-tertiary); font-size: 14px; }
    
    .se-input {
      width: 100%; height: 40px; background: var(--bg-primary);
      border: 1px solid var(--border-secondary); border-radius: 8px;
      padding: 0 16px; font-size: 13px; color: var(--text-primary);
      font-family: inherit; transition: all 0.2s; outline: none;
    }
    .se-input.with-icon { padding-left: 36px; }
    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

    .select-wrapper { position: relative; }
    select.se-input { appearance: none; padding-right: 36px; cursor: pointer; font-weight: 500; }
    
    .select-wrapper::after {
      content: "\\e933"; /* PrimeIcons chevron-down */
      font-family: 'primeicons'; position: absolute; right: 14px; top: 50%;
      transform: translateY(-50%); color: var(--text-tertiary);
      pointer-events: none; font-size: 12px;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: 40px; padding: 0 20px; font-size: 13px; font-weight: 600;
      border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none;
    }
    .btn i { font-size: 14px; }

    .btn-outline {
      background: var(--bg-primary); border: 1px solid var(--border-secondary);
      color: var(--text-primary);
    }
    .btn-outline:hover { background: var(--bg-secondary); border-color: var(--text-tertiary); }

    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

    /* GRID WRAPPER */
    .list-grid-wrapper { flex: 1; min-height: 0; width: 100%; border: 1px solid var(--border-secondary); border-radius: 12px; overflow: hidden; }
    app-ag-share-grid { height: 100%; width: 100%; display: block; }

    /* ANIMATIONS & RESPONSIVE */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

    @media (max-width: 768px) {
      .list-page-container { padding: var(--spacing-lg); }
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
      .se-filter-right { margin-left: 0; }
      .btn { width: 100%; }
    }
  `]
})
export class DepartmentListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  public masterList = inject(MasterListService);

  data: any[] = [];
  column: any[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 50;
  isLoading = false;
  branchOptions = signal<any[]>([]);
  
  deptFilter = { search: '', branchId: null, isActive: null };

  readonly departmentActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: false,
    viewPermission: PERMISSIONS.DEPARTMENT.READ,
    editPermission: PERMISSIONS.DEPARTMENT.MANAGE,
  };

  constructor() {
    effect(() => this.branchOptions.set(this.masterList.branches()));
  }

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  setupColumns(): void {
    this.column = [
      {
        headerName: 'DEPARTMENT',
        field: 'name',
        flex: 2,
        minWidth: 220,
        cellRenderer: (p: any) => `
          <div style="height: 100%; display: flex; align-items: center; gap: 10px;">
            <div style="width: 4px; height: 16px; border-radius: 2px; background: var(--accent-primary);"></div>
            <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${p.value}</span>
          </div>
        `
      },
      {
        headerName: 'CODE',
        field: 'code',
        width: 120,
        cellRenderer: (p: any) => `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 600; background: var(--bg-secondary); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-secondary); color: var(--text-secondary); letter-spacing: 0.5px; line-height: 1;">
              ${p.value || 'N/A'}
            </span>
          </div>
        `
      },
      {
        headerName: 'BRANCH',
        field: 'branchId.name',
        flex: 1,
        minWidth: 150,
        cellRenderer: (p: any) => `
          <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500;">
            <i class="pi pi-map-marker" style="font-size: 12px; color: var(--text-tertiary);"></i>
            ${p.value || 'Head Office'}
          </div>
        `
      },
      {
        headerName: 'HEAD OF DEPT',
        field: 'headOfDepartment.name',
        flex: 1.5,
        minWidth: 200,
        cellRenderer: (p: any) => p.value ? `
          <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px;">
            <i class="pi pi-user" style="font-size: 14px; color: var(--text-tertiary);"></i>
            <span style="font-weight: 500;">${p.value}</span>
          </div>
        ` : `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="color: var(--text-disabled); font-style: italic; font-size: 12px;">Unassigned</span>
          </div>
        `
      },
      {
        headerName: 'STATUS',
        field: 'isActive',
        width: 120,
        pinned: 'right',
        cellRenderer: (p: any) => {
          const isActive = p.value;
          const color = isActive ? 'var(--theme-success, #10b981)' : 'var(--theme-error, #ef4444)';
          const bg = isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          
          return `
            <div style="height: 100%; display: flex; align-items: center; justify-content: flex-end;">
              <span style="background: ${bg}; color: ${color}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; border: 1px solid ${color}; line-height: 1; letter-spacing: 0.5px;">
                ${isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          `;
        }
      }
    ];
    this.cdr.detectChanges();
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    
    if (isReset) { 
      this.currentPage = 1; 
      this.data = []; 
    }

    const params = { ...this.deptFilter, page: this.currentPage, limit: this.pageSize };

    this.hrmsService.getDepartments(params)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }), takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const newData = res.data?.data || [];
          this.totalCount = res.pagination?.totalResults || 0;
          this.data = isReset ? newData : [...this.data, ...newData];
          if (newData.length > 0) this.currentPage++;
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  applyFilters() { this.getData(true); }
  resetFilters() { this.deptFilter = { search: '', branchId: null, isActive: null }; this.getData(true); }
  createNew() { this.router.navigate(['/hrms/department/new']); }

  eventFromGrid(event: any) {
    const id = event?.row?._id;
    switch (event.type) {
      case 'cellClicked':
        this.router.navigate(['/hrms/department/details', id]);
        break;
      case 'editStart':
        this.router.navigate(['/hrms/department/edit', id]);
        break;
      case 'reachedBottom':
        this.getData(false);
        break;
    }
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
// import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { GridApi, GridReadyEvent } from 'ag-grid-community';

// import { MasterListService } from '../../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../../core/services/message.service';
// import { HRMSService } from '../../../hrms.service';
// import { AgShareGrid } from '../../../../shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-department-list',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule, AgShareGrid],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="viewport-wrapper">
//       <div class="top-section">
//         <div class="header-flex">
//           <div class="brand">
//             <h1>Departments</h1>
//             <span class="count-pill">{{totalCount}} Total</span>
//           </div>
          
//           <div class="actions">
//             <button class="btn-primary" (click)="createNew()">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
//               Add Department
//             </button>
//           </div>
//         </div>

//         <div class="filter-strip">
//           <div class="search-box">
//             <input type="text" [(ngModel)]="deptFilter.search" (keyup.enter)="applyFilters()" placeholder="Filter by name or code..." />
//           </div>
          
//           <select [(ngModel)]="deptFilter.branchId" (change)="applyFilters()">
//             <option [ngValue]="null">All Branches</option>
//             @for (branch of branchOptions(); track branch._id) {
//               <option [value]="branch._id">{{ branch.name }}</option>
//             }
//           </select>

//           <select [(ngModel)]="deptFilter.isActive" (change)="applyFilters()">
//             <option [ngValue]="null">All Status</option>
//             <option [ngValue]="true">Active</option>
//             <option [ngValue]="false">Inactive</option>
//           </select>

//           <button class="btn-reset" (click)="resetFilters()">
//             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
//           </button>
//         </div>
//       </div>

//       <div class="grid-main-area">
//         <app-ag-share-grid 
//           [columns]="column" 
//           [data]="data" 
//           [showActions]="true" 
//           selectionMode="single"
//           (gridEvent)="eventFromGrid($event)">
//         </app-ag-share-grid>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .viewport-wrapper {
//       display: flex;
//       flex-direction: column;
//       height: 100vh;
//       width: 100vw; /* Force full screen width */
//       background: var(--bg-primary);
//       overflow: hidden;
//     }

//     .top-section {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       border-bottom: 1px solid var(--border-primary);
//     }

//     .header-flex {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .brand { display: flex; align-items: center; gap: var(--spacing-md); }
//     .brand h1 { 
//       font-size: var(--font-size-xl); 
//       font-weight: var(--font-weight-bold); 
//       margin: 0; 
//       color: var(--text-primary);
//     }

//     .count-pill {
//       background: var(--bg-secondary);
//       color: var(--text-tertiary);
//       padding: 2px 8px;
//       border-radius: 12px;
//       font-size: var(--font-size-xs);
//       border: 1px solid var(--border-secondary);
//     }

//     .filter-strip {
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//     }

//     .search-box { flex: 1; max-width: 300px; }
    
//     input, select {
//       height: 32px;
//       width: 100%;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       padding: 0 var(--spacing-md);
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       outline: none;
//     }

//     input:focus { border-color: var(--accent-primary); }

//     .btn-primary {
//       background: var(--accent-primary);
//       color: white;
//       border: none;
//       height: 32px;
//       padding: 0 var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       display: flex;
//       align-items: center;
//       gap: 6px;
//       font-weight: var(--font-weight-medium);
//       cursor: pointer;
//     }

//     .btn-reset {
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: transparent;
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-tertiary);
//       cursor: pointer;
//     }

//     .grid-main-area {
//       flex: 1;
//       width: 100%; /* Full width */
//       background: var(--bg-secondary);
//     }
//   `]
// })
// export class DepartmentListComponent implements OnInit {
//   private cdr = inject(ChangeDetectorRef);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   public masterList = inject(MasterListService);

//   data: any[] = [];
//   column: any[] = [];
//   totalCount = 0;
//   currentPage = 1;
//   pageSize = 50;
//   isLoading = false;
//   branchOptions = signal<any[]>([]);
  
//   deptFilter = { search: '', branchId: null, isActive: null };

//   constructor() {
//     effect(() => this.branchOptions.set(this.masterList.branches()));
//   }

//   ngOnInit(): void {
//     this.setupColumns();
//     this.getData(true);
//   }

//   setupColumns(): void {
//     this.column = [
//       {
//         headerName: 'DEPARTMENT',
//         field: 'name',
//         flex: 2,
//         minWidth: 200,
//         cellRenderer: (p: any) => `
//           <div style="height:100%; display:flex; align-items:center; gap:8px;">
//             <div style="width:4px; height:16px; border-radius:2px; background:var(--accent-primary);"></div>
//             <span style="font-weight:600; color:var(--text-primary);">${p.value}</span>
//           </div>
//         `
//       },
//       {
//         headerName: 'CODE',
//         field: 'code',
//         width: 100,
//         cellRenderer: (p: any) => `
//           <div style="height:100%; display:flex; align-items:center;">
//             <span style="font-family:var(--font-mono); font-size:10px; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; border:1px solid var(--border-secondary); line-height:1;">
//               ${p.value || 'N/A'}
//             </span>
//           </div>
//         `
//       },
//       {
//         headerName: 'BRANCH',
//         field: 'branchId.name',
//         flex: 1,
//         valueFormatter: (p: any) => p.value || 'Head Office'
//       },
//       {
//         headerName: 'HEAD OF DEPT',
//         field: 'headOfDepartment.name',
//         flex: 1.5,
//         cellRenderer: (p: any) => p.value ? `
//           <div style="height:100%; display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
//             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
//             ${p.value}
//           </div>
//         ` : '<span style="color:var(--text-disabled); font-style:italic;">Unassigned</span>'
//       },
//       {
//         headerName: 'STATUS',
//         field: 'isActive',
//         width: 100,
//         cellRenderer: (p: any) => {
//           const color = p.value ? 'var(--theme-success)' : 'var(--theme-error)';
//           const bg = p.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
//           return `
//             <div style="height:100%; display:flex; align-items:center;">
//               <span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; border:1px solid ${color}; line-height:1;">
//                 ${p.value ? 'ACTIVE' : 'INACTIVE'}
//               </span>
//             </div>
//           `;
//         }
//       }
//     ];
//   }

//   getData(isReset: boolean = false) {
//     if (this.isLoading) return;
//     this.isLoading = true;
//     if (isReset) { this.currentPage = 1; this.data = []; }

//     const params = { ...this.deptFilter, page: this.currentPage, limit: this.pageSize };

//     this.hrmsService.getDepartments(params).subscribe({
//       next: (res: any) => {
//         const newData = res.data?.data || [];
//         this.totalCount = res.pagination?.totalResults || 0;
//         this.data = isReset ? newData : [...this.data, ...newData];
//         if (newData.length > 0) this.currentPage++;
//         this.isLoading = false;
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.isLoading = false;
//         this.messageService.handleHttpError(err)
//       }
//     });
//   }

//   applyFilters() { this.getData(true); }
//   resetFilters() { this.deptFilter = { search: '', branchId: null, isActive: null }; this.getData(true); }
//   createNew() { this.router.navigate(['/hrms/department/new']); }

//   eventFromGrid(event: any) {
//     const id = event?.row?._id;
//     if (event.type === 'cellClicked') this.router.navigate(['/hrms/department/details', id]);
//     if (event.type === 'reachedBottom') this.getData(false);
//   }
// }