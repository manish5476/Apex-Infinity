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
  imports: [CommonModule, FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="viewport-wrapper">
      <div class="top-section">
        <div class="header-flex">
          <div class="brand">
            <h1>Departments</h1>
            <span class="count-pill">{{totalCount}} Total</span>
          </div>
          
          <div class="actions">
            <button class="btn-primary" (click)="createNew()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Department
            </button>
          </div>
        </div>

        <div class="filter-strip">
          <div class="search-box">
            <input type="text" [(ngModel)]="deptFilter.search" (keyup.enter)="applyFilters()" placeholder="Filter by name or code..." />
          </div>
          
          <select [(ngModel)]="deptFilter.branchId" (change)="applyFilters()">
            <option [ngValue]="null">All Branches</option>
            @for (branch of branchOptions(); track branch._id) {
              <option [value]="branch._id">{{ branch.name }}</option>
            }
          </select>

          <select [(ngModel)]="deptFilter.isActive" (change)="applyFilters()">
            <option [ngValue]="null">All Status</option>
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
          </select>

          <button class="btn-reset" (click)="resetFilters()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </div>

      <div class="grid-main-area">
        <app-ag-share-grid 
          [columns]="column" 
          [data]="data" 
          [showActions]="true" 
          selectionMode="single"
          (gridEvent)="eventFromGrid($event)">
        </app-ag-share-grid>
      </div>
    </div>
  `,
  styles: [`
    .viewport-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw; /* Force full screen width */
      background: var(--bg-primary);
      overflow: hidden;
    }

    .top-section {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-primary);
    }

    .header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .brand { display: flex; align-items: center; gap: var(--spacing-md); }
    .brand h1 { 
      font-size: var(--font-size-xl); 
      font-weight: var(--font-weight-bold); 
      margin: 0; 
      color: var(--text-primary);
    }

    .count-pill {
      background: var(--bg-secondary);
      color: var(--text-tertiary);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: var(--font-size-xs);
      border: 1px solid var(--border-secondary);
    }

    .filter-strip {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .search-box { flex: 1; max-width: 300px; }
    
    input, select {
      height: 32px;
      width: 100%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: 0 var(--spacing-md);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      outline: none;
    }

    input:focus { border-color: var(--accent-primary); }

    .btn-primary {
      background: var(--accent-primary);
      color: white;
      border: none;
      height: 32px;
      padding: 0 var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: var(--font-weight-medium);
      cursor: pointer;
    }

    .btn-reset {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-tertiary);
      cursor: pointer;
    }

    .grid-main-area {
      flex: 1;
      width: 100%; /* Full width */
      background: var(--bg-secondary);
    }
  `]
})
export class DepartmentListComponent implements OnInit {
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
        minWidth: 200,
        cellRenderer: (p: any) => `
          <div style="height:100%; display:flex; align-items:center; gap:8px;">
            <div style="width:4px; height:16px; border-radius:2px; background:var(--accent-primary);"></div>
            <span style="font-weight:600; color:var(--text-primary);">${p.value}</span>
          </div>
        `
      },
      {
        headerName: 'CODE',
        field: 'code',
        width: 100,
        cellRenderer: (p: any) => `
          <div style="height:100%; display:flex; align-items:center;">
            <span style="font-family:var(--font-mono); font-size:10px; background:var(--bg-secondary); padding:2px 6px; border-radius:4px; border:1px solid var(--border-secondary); line-height:1;">
              ${p.value || 'N/A'}
            </span>
          </div>
        `
      },
      {
        headerName: 'BRANCH',
        field: 'branchId.name',
        flex: 1,
        valueFormatter: (p: any) => p.value || 'Head Office'
      },
      {
        headerName: 'HEAD OF DEPT',
        field: 'headOfDepartment.name',
        flex: 1.5,
        cellRenderer: (p: any) => p.value ? `
          <div style="height:100%; display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ${p.value}
          </div>
        ` : '<span style="color:var(--text-disabled); font-style:italic;">Unassigned</span>'
      },
      {
        headerName: 'STATUS',
        field: 'isActive',
        width: 100,
        cellRenderer: (p: any) => {
          const color = p.value ? 'var(--theme-success)' : 'var(--theme-error)';
          const bg = p.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          return `
            <div style="height:100%; display:flex; align-items:center;">
              <span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:700; border:1px solid ${color}; line-height:1;">
                ${p.value ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          `;
        }
      }
    ];
  }

  getData(isReset: boolean = false) {
    if (this.isLoading) return;
    this.isLoading = true;
    if (isReset) { this.currentPage = 1; this.data = []; }

    const params = { ...this.deptFilter, page: this.currentPage, limit: this.pageSize };

    this.hrmsService.getDepartments(params).subscribe({
      next: (res: any) => {
        const newData = res.data?.data || [];
        this.totalCount = res.pagination?.totalResults || 0;
        this.data = isReset ? newData : [...this.data, ...newData];
        if (newData.length > 0) this.currentPage++;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.handleHttpError(err)
      }
    });
  }

  applyFilters() { this.getData(true); }
  resetFilters() { this.deptFilter = { search: '', branchId: null, isActive: null }; this.getData(true); }
  createNew() { this.router.navigate(['/hrms/department/new']); }

  eventFromGrid(event: any) {
    const id = event?.row?._id;
    if (event.type === 'cellClicked') this.router.navigate(['/hrms/department/details', id]);
    if (event.type === 'reachedBottom') this.getData(false);
  }
}