import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid, ActionColumnConfig } from '../../../shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../../../core/auth/permissions.constants';
import { HRMSService } from '../../hrms.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-shift-group-list',
  standalone: true,
  imports: [
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
              <i class="pi pi-refresh"></i>
              Reset
            </button>
          </div>

          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <i class="pi pi-plus"></i>
              Create Shift Group
            </button>
          </div>
        </div>

        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            [actionColumn]="shiftGroupActionColumn"
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
      // max-width: 1400px;
      // margin: 0 auto;
      height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
    }

    .themed-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-sm);
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

    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--accent-focus); }

    .select-wrapper { position: relative; }
    select.se-input { appearance: none; padding-right: 2.5rem; cursor: pointer; }
    .select-wrapper::after {
      content: "\\e933"; font-family: 'primeicons'; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none; font-size: var(--font-size-xs);
    }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--spacing-xl); height: 38px;
      font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); font-family: var(--font-body);
      border-radius: var(--ui-border-radius); cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; outline: none;
    }

    .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover { background: var(--bg-secondary); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: var(--color-on-primary); }
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
export class ShiftGroupListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

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

  readonly shiftGroupActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.SHIFT.GROUP_READ,
    editPermission: PERMISSIONS.SHIFT.GROUP_MANAGE,
    deletePermission: PERMISSIONS.SHIFT.GROUP_MANAGE,
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
    this.router.navigate(['/hrms/shift-groups/create']);
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

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== null && value !== '')
    );

    this.hrmsService.getShiftGroups(cleanParams).pipe(takeUntil(this.destroy$)).subscribe({
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

  eventFromGrid(event: any) {
    const groupId = event?.row?._id || event?.row?.id;
    switch (event.type) {
      case 'cellClicked':
        // Optional: Route to details page if you have one
        // this.router.navigate(['/shift-groups/details', groupId]);
        break;
      case 'editStart':
        this.router.navigate(['/hrms/shift-groups/edit', groupId]);
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
    this.hrmsService.deleteShiftGroup(id).pipe(takeUntil(this.destroy$)).subscribe({
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
          const icon = type === 'custom' ? 'pi-sliders-h' : 'pi-calendar';

          return `
            <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div style="width:28px; height:28px; border-radius:var(--ui-border-radius-sm); background-color:var(--bg-secondary); color:var(--text-tertiary); display:flex; align-items:center; justify-content:center;">
                <i class="pi ${icon}" style="font-size:12px;"></i>
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
            return `<div style="width:12px; height:12px; border-radius:50%; background-color:${color}; box-shadow:0 0 0 1px var(--bg-primary); margin-left:-4px; border:1px solid var(--border-secondary);" title="Shift Sequence"></div>`;
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
                <i class="pi pi-building" style="color:var(--text-tertiary); font-size:12px;"></i>
                <span>${depts} Depts</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:12px;">
                <i class="pi pi-id-card" style="color:var(--text-tertiary); font-size:12px;"></i>
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
          const bg = isActive ? 'var(--color-success-bg)' : 'var(--color-error-bg)';
          const color = isActive ? 'var(--color-success-text)' : 'var(--color-error-text)';
          const border = isActive ? 'var(--color-success-border)' : 'var(--color-error-border)';

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
