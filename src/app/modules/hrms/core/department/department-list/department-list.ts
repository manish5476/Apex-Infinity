import { ChangeDetectorRef, Component, OnInit, effect, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from "rxjs";

import { MasterListService } from '../../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';
import { AgShareGrid, ActionColumnConfig } from '../../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../../core/auth/permissions.constants';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      
      <!-- ════════ HEADER ════════ -->
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

      <!-- ════════ WORKSPACE CARD ════════ -->
      <div class="premium-card list-content-area">

        <!-- ── FILTER BAR ── -->
        <div class="se-filter-bar">
          
          <!-- Search -->
          <div class="se-filter-field search-field">
            <div class="input-icon-wrapper w-full">
              <i class="pi pi-search input-icon"></i>
              <input id="search" type="text" [(ngModel)]="deptFilter.search" 
                (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
                placeholder="Search department or code..." class="se-input w-full with-icon" />
            </div>
          </div>

          <!-- Branch Filter -->
          <div class="se-filter-field">
            <div class="select-wrapper w-full">
              <select id="branch" [(ngModel)]="deptFilter.branchId" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Branches</option>
                @for (branch of branchOptions(); track branch._id) {
                  <option [value]="branch._id">{{ branch.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Status Filter -->
          <div class="se-filter-field">
            <div class="select-wrapper w-full">
              <select id="status" [(ngModel)]="deptFilter.isActive" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Statuses</option>
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Reset Button -->
          <div class="se-filter-actions">
            <button class="btn btn-ghost" (click)="resetFilters()" title="Reset Filters">
              <i class="pi pi-filter-slash"></i>
            </button>
          </div>

          <div class="se-filter-spacer"></div>

          <!-- Add Button -->
          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <i class="pi pi-plus"></i> Add Department
            </button>
          </div>
        </div>

        <!-- ── DATA GRID ── -->
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
    /* ══════════════════════════════════════════════════════
       THEME TOKENS & FULL-WIDTH LAYOUT
    ══════════════════════════════════════════════════════ */
    :host {
      display: block;
      height: 100vh;
      background-color: var(--bg-secondary);
      font-family: var(--font-body);
      color: var(--text-primary);
      overflow: hidden; /* Prevent body scroll, let grid scroll */
    }

    .list-page-container {
      padding: var(--spacing-2xl);
      width: 100%;  /* True Full Width */
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    /* ── HEADER ────────────────────────────────────────── */
    .list-header {
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      flex-shrink: 0;
    }

    .title-section { 
      display: flex; 
      align-items: center; 
      gap: var(--spacing-xl); 
    }

    .icon-box {
      width: 48px; height: 48px; 
      border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent); 
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xl); 
      color: var(--accent-primary); 
    }

    .page-title { 
      font-size: var(--font-size-2xl); 
      font-weight: var(--font-weight-bold); 
      font-family: var(--font-heading); 
      margin: 0; 
      letter-spacing: -0.02em; 
      color: var(--text-primary);
    }

    .page-subtitle { 
      font-size: var(--font-size-sm); 
      color: var(--text-secondary); 
      margin: 4px 0 0 0; 
    }
    
    .stats-badge {
      display: inline-flex; 
      align-items: center; 
      gap: var(--spacing-md);
      background: var(--bg-primary); 
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-pill); 
      border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--shadow-xs);
    }
    
    .stats-badge .count { 
      font-weight: var(--font-weight-bold); 
      font-size: var(--font-size-lg); 
      color: var(--accent-primary); 
      font-family: var(--font-mono);
    }
    
    .stats-badge .label { 
      font-size: var(--font-size-xs); 
      font-weight: var(--font-weight-semibold); 
      color: var(--text-tertiary); 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
    }

    /* ── WORKSPACE CARD ────────────────────────────────── */
    .premium-card {
      flex: 1; 
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); 
      box-shadow: var(--shadow-sm);
      display: flex; 
      flex-direction: column;
      overflow: hidden; 
    }

    /* ── FILTER BAR ────────────────────────────────────── */
    .se-filter-bar {
      display: flex; 
      flex-wrap: wrap; 
      align-items: center;
      gap: var(--spacing-lg); 
      padding: var(--spacing-xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .se-filter-field { 
      display: flex; 
      flex-direction: column; 
      min-width: 200px; 
    }
    
    .search-field { 
      flex: 1; 
      max-width: 400px; 
    }

    .se-filter-spacer { flex: 1; }

    .se-filter-right { 
      display: flex; 
      align-items: center; 
    }

    /* INPUTS & SELECTS */
    .w-full { width: 100%; }

    .input-icon-wrapper { 
      position: relative; 
      display: flex; 
      align-items: center; 
    }
    
    .input-icon { 
      position: absolute; 
      left: 14px; 
      color: var(--text-tertiary); 
      font-size: var(--font-size-md); 
    }
    
    .se-input {
      width: 100%; 
      height: 40px; 
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary); 
      border-radius: var(--ui-border-radius-sm);
      padding: 0 16px; 
      font-size: var(--font-size-sm); 
      color: var(--text-primary);
      font-family: var(--font-body); 
      transition: var(--transition-fast); 
      outline: none;
    }
    
    .se-input.with-icon { padding-left: 40px; }
    .se-input::placeholder { color: var(--text-tertiary); }
    
    .se-input:focus { 
      border-color: var(--accent-primary); 
      box-shadow: 0 0 0 var(--focus-ring-width) color-mix(in srgb, var(--accent-primary) 15%, transparent); 
    }

    .select-wrapper { position: relative; }
    select.se-input { 
      appearance: none; 
      padding-right: 40px; 
      cursor: pointer; 
      font-weight: var(--font-weight-medium); 
      color: var(--text-secondary);
    }
    
    .select-wrapper::after {
      content: "\\e933"; /* PrimeIcons chevron-down */
      font-family: 'primeicons'; 
      position: absolute; 
      right: 14px; top: 50%;
      transform: translateY(-50%); 
      color: var(--text-tertiary);
      pointer-events: none; 
      font-size: 12px;
    }

    /* BUTTONS */
    .btn {
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      gap: var(--spacing-sm);
      height: 40px; 
      padding: 0 var(--spacing-xl); 
      font-size: var(--font-size-sm); 
      font-weight: var(--font-weight-semibold);
      border-radius: var(--ui-border-radius-sm); 
      cursor: pointer; 
      transition: var(--transition-base); 
      border: var(--ui-border-width) solid transparent;
      font-family: var(--font-body);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border-primary);
      padding: 0;
      width: 40px; /* Square icon button */
    }
    .btn-ghost:hover {
      background: var(--bg-primary);
      color: var(--text-primary);
      border-color: var(--text-tertiary);
    }

    .btn-primary { 
      background: var(--accent-primary); 
      color: #ffffff; 
      box-shadow: 0 2px 4px color-mix(in srgb, var(--accent-primary) 20%, transparent);
    }
    .btn-primary:hover { 
      background: var(--accent-hover); 
      transform: translateY(-1px); 
      box-shadow: 0 4px 6px color-mix(in srgb, var(--accent-primary) 30%, transparent);
    }

    /* ── GRID WRAPPER ──────────────────────────────────── */
    .list-grid-wrapper { 
      flex: 1; 
      min-height: 0; 
      width: 100%; 
      background: var(--bg-primary);
      /* Ag-Grid overrides to blend with our premium card */
    }
    
    app-ag-share-grid { 
      height: 100%; 
      width: 100%; 
      display: block; 
    }
    
    ::ng-deep .list-grid-wrapper .ag-root-wrapper {
      border: none !important;
      border-radius: 0 0 var(--ui-border-radius-xl) var(--ui-border-radius-xl) !important;
    }

    /* ── ANIMATIONS & RESPONSIVE ───────────────────────── */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }

    @media (max-width: 1024px) {
      .se-filter-spacer { display: none; }
      .se-filter-right { margin-left: auto; }
    }

    @media (max-width: 768px) {
      .list-page-container { padding: var(--spacing-lg); }
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .search-field { max-width: 100%; }
      .se-filter-right { margin-left: 0; }
      .se-filter-actions { justify-content: flex-end; }
      .btn { width: 100%; }
      .btn-ghost { width: 100%; }
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
          <div style="height: 100%; display: flex; align-items: center; gap: 12px;">
            <div style="width: 4px; height: 18px; border-radius: 2px; background: var(--accent-primary);"></div>
            <span style="font-weight: var(--font-weight-bold); color: var(--text-primary); font-size: var(--font-size-sm);">${p.value}</span>
          </div>
        `
      },
      {
        headerName: 'CODE',
        field: 'code',
        width: 130,
        cellRenderer: (p: any) => `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="font-family: var(--font-mono); font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); background: var(--bg-secondary); padding: 4px 10px; border-radius: var(--ui-border-radius-sm); border: var(--ui-border-width) solid var(--border-secondary); color: var(--text-secondary); letter-spacing: 0.05em; line-height: 1;">
              ${p.value || 'N/A'}
            </span>
          </div>
        `
      },
      {
        headerName: 'BRANCH',
        field: 'branchId.name',
        flex: 1,
        minWidth: 160,
        cellRenderer: (p: any) => `
          <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);">
            <i class="pi pi-map-marker" style="font-size: var(--font-size-sm); color: var(--text-tertiary);"></i>
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
          <div style="height: 100%; display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);">
              <i class="pi pi-user" style="font-size: 10px;"></i>
            </div>
            <span>${p.value}</span>
          </div>
        ` : `
          <div style="height: 100%; display: flex; align-items: center;">
            <span style="color: var(--text-disabled); font-style: italic; font-size: var(--font-size-xs);">Unassigned</span>
          </div>
        `
      },
      {
        headerName: 'STATUS',
        field: 'isActive',
        width: 140,
        pinned: 'right',
        cellRenderer: (p: any) => {
          const isActive = p.value;
          const color = isActive ? 'var(--color-success-dark, #059669)' : 'var(--color-error-dark, #dc2626)';
          const bg = isActive ? 'var(--color-success-bg, rgba(16, 185, 129, 0.1))' : 'var(--color-error-bg, rgba(239, 68, 68, 0.1))';
          const border = isActive ? 'var(--color-success-border, rgba(16, 185, 129, 0.2))' : 'var(--color-error-border, rgba(239, 68, 68, 0.2))';

          return `
            <div style="height: 100%; display: flex; align-items: center; justify-content: flex-end;">
              <span style="background: ${bg}; color: ${color}; padding: 4px 12px; border-radius: var(--ui-border-radius-pill); font-size: 10px; font-weight: var(--font-weight-bold); border: var(--ui-border-width) solid ${border}; line-height: 1; letter-spacing: 0.05em;">
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