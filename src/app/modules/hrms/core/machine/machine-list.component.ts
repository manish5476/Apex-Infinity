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
  selector: 'app-machine-list',
  standalone: true,
  imports: [FormsModule, RouterModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container">
      <div class="themed-card list-content-area">

        <div class="se-filter-bar">
          <div class="se-filter-field">
            <label>Search</label>
            <input type="text" [(ngModel)]="filter.search" (keydown.enter)="applyFilters()" (blur)="applyFilters()" placeholder="Name, Serial or IP..." class="se-input w-full" />
          </div>

          <div class="se-filter-field">
            <label>Connection Status</label>
            <div class="select-wrapper w-full">
              <select [(ngModel)]="filter.connectionStatus" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="connecting">Connecting</option>
              </select>
            </div>
          </div>

          <div class="se-filter-field">
            <label>Device State</label>
            <div class="select-wrapper w-full">
              <select [(ngModel)]="filter.status" (change)="applyFilters()" class="se-input w-full">
                <option [ngValue]="null">All States</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div class="se-filter-actions">
            <button class="btn btn-outline" (click)="resetFilters()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Reset
            </button>
          </div>

          <div class="se-filter-right">
            <button class="btn btn-primary" (click)="createNew()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Device
            </button>
          </div>
        </div>

        <div class="list-grid-wrapper">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            [actionColumn]="machineActionColumn"
            selectionMode="single"
            (gridEvent)="eventFromGrid($event)">
          </app-ag-share-grid>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Using shared List Layout */
    :host { display: block; min-height: 100vh; background-color: var(--bg-secondary); font-family: var(--font-body); color: var(--text-primary); }
    .list-page-container { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; height: calc(100vh - 80px); display: flex; flex-direction: column; }
    .themed-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .list-content-area { padding: var(--spacing-xl); gap: var(--spacing-xl); }
    
    .se-filter-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--spacing-lg); padding-bottom: var(--spacing-lg); border-bottom: 1px solid var(--border-primary); }
    .se-filter-field { display: flex; flex-direction: column; gap: var(--spacing-xs); min-width: 180px; }
    .se-filter-field label { font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .se-filter-actions { display: flex; align-items: flex-end; margin-bottom: 2px; }
    .se-filter-right { margin-left: auto; display: flex; align-items: flex-end; margin-bottom: 2px; }
    
    .w-full { width: 100%; }
    .se-input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: var(--spacing-md) var(--spacing-lg); font-size: var(--font-size-sm); color: var(--text-primary); outline: none; box-sizing: border-box; height: 38px; }
    .se-input:focus { border-color: var(--color-primary); }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0 var(--spacing-xl); height: 38px; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; border: 1px solid transparent; }
    .btn-outline { background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    
    .list-grid-wrapper { flex: 1; height: 100%; min-height: 0; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2.5rem; cursor: pointer; }
    .select-wrapper::after { content: ""; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); width: 10px; height: 6px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; pointer-events: none; }
  `]
})
export class MachineListComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);

  data: any[] = [];
  column: any[] = [];
  
  filter = { search: '', connectionStatus: null, status: null };
  isLoading = false;

  readonly machineActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: true,
    showDelete: true,
    viewPermission: PERMISSIONS.ATTENDANCE.MACHINE_READ,
    editPermission: PERMISSIONS.ATTENDANCE.MACHINE_MANAGE,
    deletePermission: PERMISSIONS.ATTENDANCE.MACHINE_MANAGE,
  };

  ngOnInit() {
    this.setupColumns();
    this.getData();
  }

  getData() {
    this.isLoading = true;
    this.hrmsService.getMachines(this.filter).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res.data?.machines || res.data || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => this.isLoading = false
    });
  }

  applyFilters() { this.getData(); }
  resetFilters() { this.filter = { search: '', connectionStatus: null, status: null }; this.getData(); }
  createNew() { this.router.navigate(['/hrms/attendance/machines/new']); }

  eventFromGrid(event: any) {
    const id = event?.row?._id;
    if (event.type === 'editStart') this.router.navigate(['/hrms/attendance/machines/edit', id]);
    else if (event.type === 'cellClicked') this.router.navigate(['/hrms/attendance/machines/details', id]);
    else if (event.type === 'delete') this.deleteMachine(id, event.row.name);
  }

  deleteMachine(id: string, name: string) {
    if(confirm(`Delete machine ${name}?`)) {
      this.hrmsService.deleteMachine(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.messageService.showSuccess('Machine removed'); this.getData(); },
        error: (err) => this.messageService.handleHttpError(err)
      });
    }
  }

  setupColumns() {
    this.column = [
      {
        field: 'name', headerName: 'Device Info', width: 250, pinned: 'left',
        cellRenderer: (params: any) => {
          const d = params.data;
          const statusColor = d.connectionStatus === 'online' ? '#22c55e' : '#ef4444';
          return `
            <div style="display:flex; align-items:center; gap:10px; height:100%;">
              <div style="width:8px; height:8px; border-radius:50%; background-color:${statusColor}; box-shadow:0 0 0 2px ${statusColor}33;"></div>
              <div>
                <div style="font-weight:600; color:var(--text-primary); line-height:1.2;">${d.name}</div>
                <div style="font-size:11px; color:var(--text-tertiary); font-family:var(--font-mono);">${d.serialNumber}</div>
              </div>
            </div>`;
        }
      },
      { headerName: 'Branch', field: 'branchId.name', width: 150, valueFormatter: (p: any) => p.value || '-' },
      { headerName: 'Provider', field: 'providerType', width: 120, cellStyle: { textTransform: 'capitalize' } },
      { headerName: 'IP Address', field: 'ipAddress', width: 140, cellStyle: { fontFamily: 'var(--font-mono)', fontSize: '12px' } },
      {
        headerName: 'Status', field: 'status', width: 120,
        cellRenderer: (params: any) => {
          const s = params.value;
          const bg = s === 'active' ? '#ecfdf5' : '#fef2f2';
          const color = s === 'active' ? '#15803d' : '#b91c1c';
          return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; text-transform:uppercase;">${s}</span>`;
        }
      },
      { 
        headerName: 'Last Sync', field: 'lastSyncAt', width: 150,
        valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleString() : 'Never'
      }
    ];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}