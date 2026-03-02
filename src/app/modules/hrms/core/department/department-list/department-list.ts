
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { GridApi, GridReadyEvent } from 'ag-grid-community';

import { MasterListService } from '../../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';
import { AgShareGrid } from '../../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AgShareGrid
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container">
      <div class="themed-card list-content-area">

        <!-- Filter Bar -->
        <div class="se-filter-bar">
          
          <div class="se-filter-field">
            <label for="search">Search</label>
            <input id="search" type="text" [(ngModel)]="deptFilter.search" 
              (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
              placeholder="Name or Code..." class="se-input w-full" />
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Reset
            </button>
          </div>

          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Department
            </button>
          </div>
        </div>

        <!-- Grid Wrapper -->
        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            [showActions]="true" 
            selectionMode="single"
            (gridEvent)="eventFromGrid($event)">
          </app-ag-share-grid>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME TOKENS: INJECTED & MAPPED
       ========================================================================== */
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--bg-secondary);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .list-page-container {
      padding: var(--spacing-2xl) var(--spacing-3xl);
      max-width: 100%;
      margin: 0 auto;
      height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .themed-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .list-content-area {
      padding: var(--spacing-xl);
      gap: var(--spacing-xl);
    }

    /* Filter Bar Styles */
    .se-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--spacing-lg);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
    }

    .se-filter-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      min-width: 200px;
    }

    .se-filter-field label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-label);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .se-filter-actions {
      display: flex;
      align-items: flex-end;
      margin-bottom: 2px;
    }

    .se-filter-right {
      margin-left: auto;
      display: flex;
      align-items: flex-end;
      margin-bottom: 2px;
    }

    /* Inputs & Selects */
    .w-full { width: 100%; }

    .se-input {
      width: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-family: inherit;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
      height: 38px;
    }

    .se-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .select-wrapper {
      position: relative;
    }
    
    select.se-input {
      appearance: none;
      padding-right: 2.5rem;
      cursor: pointer;
    }
    
    .select-wrapper::after {
      content: "";
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 6px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      pointer-events: none;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--spacing-xl);
      height: 38px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      font-family: var(--font-body);
      border-radius: var(--ui-border-radius);
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      outline: none;
    }

    .btn-outline {
      background: var(--bg-primary);
      border-color: var(--border-secondary);
      color: var(--text-primary);
    }

    .btn-outline:hover {
      background: var(--bg-secondary);
      border-color: var(--border-primary);
    }

    .btn-primary {
      background: var(--color-primary);
      color: #ffffff;
    }

    .btn-primary:hover {
      background: var(--color-primary-dark);
    }

    .list-grid-wrapper {
      flex: 1;
      height: 100%;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .se-filter-right { margin-left: 0; width: 100%; }
      .se-filter-right .btn { width: 100%; }
    }
  `]
})
export class DepartmentListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  public masterList = inject(MasterListService);
  
  // Mock router for preview
private router = inject(Router);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  data: any[] = [];
  column: any[] = [];
  branchOptions = signal<any[]>([]);
  deptFilter = {
    search: '',
    branchId: null,
    isActive: null
  };

  constructor() {
    effect(() => {
      this.branchOptions.set(this.masterList.branches());
    });
  }

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.deptFilter = { search: '', branchId: null, isActive: null };
    this.getData(true);
  }

createNew() {
  this.router.navigate(['/hrms/department/new']);
}


  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (isReset) {
      this.currentPage = 1;
      this.data = [];
      this.totalCount = 0;
    }

    const params = {
      ...this.deptFilter,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.hrmsService.getDepartments(params).subscribe({
      next: (res: any) => {
        // UPDATED RESPONSE STRUCTURE HANDLING
        // New API returns:
        // {
        //   status, results, pagination (top-level), data: { data: [...] }
        // }
        const newData = res.data?.data || [];           // departments array
        const pagination = res.pagination;              // pagination object (top level)

        if (pagination) {
          this.totalCount = pagination.totalResults;
        }

        this.data = isReset ? newData : [...this.data, ...newData];

        if (newData.length > 0) {
          this.currentPage++;
        }

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.messageService.showError('Error', 'Failed to fetch departments.');
      }
    });
  }

  onScrolledToBottom() {
    if (!this.isLoading && this.data.length < this.totalCount) {
      this.getData(false);
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

eventFromGrid(event: any) {
  const deptId = event?.row?._id;
  switch (event.type) {
    case 'cellClicked':
      this.router.navigate(['/hrms/department/details', deptId]);
      break;
    case 'editStart':
      this.router.navigate(['/hrms/department/edit', deptId]);
      break;
    case 'delete':
      const deptName = event.row.name;
      if (window.confirm(
        `Are you sure you want to delete the department ${deptName}?`
      )) {
        this.deleteDepartment(deptId);
      }
      break;

    case 'reachedBottom':
      this.onScrolledToBottom();
      break;
  }
}


  private deleteDepartment(id: string) {
    this.hrmsService.deleteDepartment(id).subscribe({
      next: () => {
        this.messageService.showSuccess('Deleted', 'Department removed successfully');
        this.getData(true);
      },
      error: (err: any) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to delete department');
      }
    });
  }

  setupColumns(): void {
    this.column = [
      // 1. DEPARTMENT NAME
      {
        field: 'name',
        headerName: 'Department Name',
        width: 220,
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

      // 2. CODE (Badge Style)
      {
        headerName: 'Code',
        field: 'code',
        width: 100,
        filter: true,
        cellRenderer: (params: any) => {
          const code = params.value || '-';
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: var(--bg-secondary); 
                color: var(--text-secondary); 
                padding: 2px 8px; 
                border-radius: 4px; 
                font-family: var(--font-mono, monospace);
                font-size: 11px; 
                border: 1px solid var(--border-secondary);
                letter-spacing: 0.5px;
              ">
                ${code}
              </span>
            </div>`;
        }
      },

      // 3. BRANCH
      {
        headerName: 'Branch',
        field: 'branchId.name',
        width: 150,
        valueFormatter: (p: any) => p.value || 'Global / HQ',
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'color': 'var(--text-secondary)', 'font-size': '12px' }
      },

      // 4. HEAD OF DEPARTMENT
      {
        headerName: 'Head of Dept',
        field: 'headOfDepartment.name',
        width: 180,
        cellRenderer: (params: any) => {
          const hod = params.value;
          if (hod) {
            return `<div style="display:flex; align-items:center; height:100%; color:var(--text-primary); font-size:12px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" style="margin-right:6px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${hod}
                    </div>`;
          }
          return `<div style="display:flex; align-items:center; height:100%; color:var(--text-tertiary); font-style:italic; font-size:12px;">Unassigned</div>`;
        }
      },

      // 5. EMPLOYEE COUNT
      {
        headerName: 'Employees',
        field: 'employeeCount',
        width: 120,
        sortable: true,
        cellRenderer: (params: any) => {
          const count = params.value || 0;
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="font-weight:600; color:var(--color-primary); font-size:13px;">${count}</span>
            </div>`;
        }
      },

      // 6. STATUS (Refined Compact Style)
      {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        sortable: true,
        cellRenderer: (params: any) => {
          const isActive = params.value;
          
          const bg = isActive ? '#ecfdf5' : '#fef2f2';
          const color = isActive ? '#15803d' : '#b91c1c';
          const border = isActive ? '#bbf7d0' : '#fecaca';
          
          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="
                background-color: ${bg}; 
                color: ${color}; 
                border: 1px solid ${border}; 
                padding: 1px 8px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: 700; 
                text-transform: uppercase; 
                line-height: 1.2; 
                white-space: nowrap;
                letter-spacing: 0.5px;
              ">
                ${isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }
}
