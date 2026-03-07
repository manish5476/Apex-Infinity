import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { HRMSService } from '../../hrms.service';


@Component({
  selector: 'app-shift-group-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AgShareGrid
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      <div class="themed-card list-content-area">

        <div class="se-filter-bar">
          
          <div class="se-filter-field">
            <label for="search">Search</label>
            <input id="search" type="text" [(ngModel)]="filter.search" 
              (keydown.enter)="applyFilters()" (blur)="applyFilters()" 
              placeholder="Name or Code..." class="se-input w-full" />
          </div>

          <div class="se-filter-field">
            <label for="rotationType">Rotation Rule</label>
            <div class="select-wrapper w-full">
              <select id="rotationType" [(ngModel)]="filter.rotationType" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All Rotations</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label for="status">Status</label>
            <div class="select-wrapper w-full">
              <select id="status" [(ngModel)]="filter.isActive" (change)="applyFilters()" class="se-input w-full">
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
              Create Shift Group
            </button>
          </div>
        </div>

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
      max-width: 1400px;
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

    .se-filter-actions { display: flex; align-items: flex-end; margin-bottom: 2px; }
    .se-filter-right { margin-left: auto; display: flex; align-items: flex-end; margin-bottom: 2px; }

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

    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }

    .select-wrapper { position: relative; }
    select.se-input { appearance: none; padding-right: 2.5rem; cursor: pointer; }
    .select-wrapper::after {
      content: ""; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      width: 10px; height: 6px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat; pointer-events: none;
    }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--spacing-xl); height: 38px;
      font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); font-family: var(--font-body);
      border-radius: var(--ui-border-radius); cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; outline: none;
    }

    .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover { background: var(--bg-secondary); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover { background: var(--color-primary-dark); }

    .list-grid-wrapper { flex: 1; height: 100%; min-height: 0; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease-out; }

    @media (max-width: 768px) {
      .se-filter-bar { flex-direction: column; align-items: stretch; }
      .se-filter-right { margin-left: 0; width: 100%; }
      .se-filter-right .btn { width: 100%; }
    }
  `]
})
export class ShiftGroupListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  private gridApi!: GridApi;
  private currentPage = 1;
  private isLoading = false;
  private totalCount = 0;
  private pageSize = 50;
  
  data: any[] = [];
  column: any[] = [];
  
  filter = {
    search: '',
    rotationType: null,
    isActive: null
  };

  ngOnInit(): void {
    this.setupColumns();
    this.getData(true);
  }

  applyFilters() {
    this.getData(true);
  }

  resetFilters() {
    this.filter = { search: '', rotationType: null, isActive: null };
    this.getData(true);
  }

  createNew() {
    this.router.navigate(['/shift-groups/create']);
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
      ...this.filter,
      page: this.currentPage,
      limit: this.pageSize
    };

    // Assumes getShiftGroups is updated to accept params if paginated
    // Otherwise fallback to generic standard get: this.hrmsService.get('/v1/hrms/shift-groups', params)
    this.hrmsService.getShiftGroups().subscribe({
      next: (res: any) => {
        const newData = res.data?.shiftGroups || res.data?.data || [];
        const pagination = res.pagination; 

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
        this.messageService.handleHttpError(err)
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
    const groupId = event?.row?._id || event?.row?.id;
    switch (event.type) {
      case 'cellClicked':
        // Optional: Route to details page if you have one
        // this.router.navigate(['/shift-groups/details', groupId]);
        break;
      case 'editStart':
        this.router.navigate(['/shift-groups/edit', groupId]);
        break;
      case 'delete':
        const groupName = event.row.name;
        if (window.confirm(
          `Are you sure you want to delete the shift group "${groupName}"? This action cannot be undone.`
        )) {
          this.deleteGroup(groupId);
        }
        break;
      case 'reachedBottom':
        this.onScrolledToBottom();
        break;
    }
  }

  private deleteGroup(id: string) {
    this.hrmsService.deleteShiftGroup(id).subscribe({
      next: () => {
        this.messageService.showSuccess('Shift group removed successfully');
        this.getData(true);
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  setupColumns(): void {
    this.column = [
      // 1. GROUP DETAILS
      {
        field: 'name',
        headerName: 'Group Details',
        width: 250,
        pinned: 'left',
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const name = params.value || '';
          const code = params.data?.code || '-';
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px; padding: 4px 0;">
              <span style="font-weight:700; color:var(--text-primary); font-size:13px; line-height:1;">${name}</span>
              <span style="
                background-color: var(--bg-secondary); 
                color: var(--text-secondary); 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-family: var(--font-mono, monospace);
                font-size: 10px; 
                border: 1px solid var(--border-secondary);
                letter-spacing: 0.5px;
                width: max-content;
                line-height:1;
              ">
                ${code}
              </span>
            </div>`;
        }
      },

      // 2. ROTATION RULE
      {
        headerName: 'Rotation Rule',
        field: 'rotationType',
        width: 160,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = (params.value || 'weekly').toLowerCase();
          
          let bg = '#f3f4f6', color = '#6b7280', iconPath = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'; // custom default
          
          if (type === 'daily') { bg = '#fef2f2'; color = '#ef4444'; iconPath = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="9" y1="16" x2="15" y2="16"></line>'; }
          else if (type === 'weekly') { bg = '#eff6ff'; color = '#3b82f6'; iconPath = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>'; }
          else if (type === 'monthly') { bg = '#fdf4ff'; color = '#d946ef'; iconPath = '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line>'; }

          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div style="width:28px; height:28px; border-radius:6px; background-color:${bg}; color:${color}; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
              </div>
              <span style="font-weight:500; color:var(--text-secondary); text-transform:capitalize; font-size:12px;">${type}</span>
            </div>`;
        }
      },

      // 3. INCLUDED SHIFTS (Visual Dots)
      {
        headerName: 'Included Shifts',
        width: 150,
        sortable: false,
        cellRenderer: (params: any) => {
          const shifts = params.data?.shifts || [];
          if (shifts.length === 0) {
            return `<div style="display:flex; align-items:center; height:100%;"><span style="color:var(--text-tertiary); font-size:12px;">No shifts</span></div>`;
          }

          const visibleShifts = shifts.slice(0, 3);
          const extra = shifts.length > 3 ? shifts.length - 3 : 0;

          let dotsHtml = visibleShifts.map((s: any) => {
            const color = s.color || 'var(--color-primary)';
            return `<div style="width:12px; height:12px; border-radius:50%; background-color:${color}; box-shadow:0 0 0 1px var(--bg-primary); margin-left:-4px; border:1px solid rgba(0,0,0,0.1);" title="Shift Sequence"></div>`;
          }).join('');

          let extraHtml = extra > 0 ? `<span style="font-size:11px; color:var(--text-tertiary); margin-left:6px;">+${extra} more</span>` : '';

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <div style="display:flex; padding-left:4px;">${dotsHtml}</div>
              ${extraHtml}
            </div>`;
        }
      },

      // 4. APPLICABILITY
      {
        headerName: 'Applicability',
        width: 160,
        sortable: false,
        cellRenderer: (params: any) => {
          const depts = params.data?.applicableDepartments?.length || 0;
          const desigs = params.data?.applicableDesignations?.length || 0;
          
          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:2px; padding: 4px 0;">
              <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:12px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                <span>${depts} Depts</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:12px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span>${desigs} Desigs</span>
              </div>
            </div>`;
        }
      },

      // 5. STATUS
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
                padding: 2px 8px; 
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