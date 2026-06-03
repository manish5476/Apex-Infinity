import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GridApi } from 'ag-grid-community';
import { AppMessageService } from '../../../../core/services/message.service';
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { HRMSService } from '../../hrms.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-machine-logs',
  standalone: true,
  imports: [CommonModule, AgShareGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-page-container fade-in">
      <div class="themed-card list-content-area" style="padding: 0;">
        
        <div class="log-header" style="padding: var(--spacing-xl); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; background: var(--component-surface-raised);">
          <div style="display: flex; gap: 16px; align-items: center;">
            <button class="icon-btn" (click)="goBack()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
            <div>
              <h2 style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Device Transaction Logs</h2>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); font-family: monospace;">ID: {{ machineId }}</span>
                @if (machineStatus) {
                  <span class="status-indicator" [class.online]="machineStatus.connectionStatus === 'online'">
                    {{ machineStatus.connectionStatus | titlecase }}
                  </span>
                }
              </div>
            </div>
          </div>
          <button class="icon-btn" (click)="getData()" title="Refresh Logs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>

        <div class="list-grid-wrapper" style="padding: var(--spacing-lg); height: calc(100% - 85px);">
          <app-ag-share-grid 
            [columns]="column" 
            [data]="data" 
            selectionMode="single">
          </app-ag-share-grid>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background-color: var(--bg-secondary); font-family: var(--font-body); }
    .list-page-container { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; height: calc(100vh - 80px); display: flex; flex-direction: column; }
    .themed-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .icon-btn { background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-secondary); width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    
    .status-indicator { padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: bold; text-transform: uppercase; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .status-indicator.online { background: #ecfdf5; color: #15803d; border-color: #bbf7d0; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class MachineLogsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  machineId: string | null = null;
  machineStatus: any = null;
  data: any[] = [];
  column: any[] = [];

  ngOnInit() {
    this.setupColumns();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.machineId = params.get('id');
      if (this.machineId) {
        this.getStatus();
        this.getData();
      }
    });
  }

  getStatus() {
    this.hrmsService.getMachineStatus(this.machineId!).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.machineStatus = res.data?.machine || null;
      this.cdr.markForCheck();
    });
  }

  getData() {
    this.hrmsService.getMachineLogs(this.machineId!).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res.data?.logs || res.data || [];
        this.cdr.markForCheck();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  goBack() { this.router.navigate(['/hrms/attendance/machines']); }

  setupColumns() {
    this.column = [
      {
        headerName: 'Timestamp', field: 'timestamp', width: 220, sortable: true, sort: 'desc',
        valueFormatter: (p: any) => p.value ? new Date(p.value).toLocaleString() : '-'
      },
      {
        headerName: 'User Details', field: 'user.name', width: 220,
        cellRenderer: (p: any) => {
          const name = p.data?.user?.name || 'Unmapped User';
          const hardwareId = p.data?.user?.employee?.employeeId || '-';
          return `<div style="line-height:1.2; padding-top:6px;">
                    <div style="font-weight:600; color:var(--text-primary);">${name}</div>
                    <div style="font-size:11px; color:var(--text-tertiary); font-family:monospace;">EMP ID: ${hardwareId}</div>
                  </div>`;
        }
      },
      {
        headerName: 'Verification Mode', field: 'biometricData.method', width: 160,
        cellRenderer: (p: any) => {
          const mode = (p.value || p.data?.source || 'unknown').toLowerCase();
          let icon = '<circle cx="12" cy="12" r="10"></circle>';
          if(mode.includes('face')) icon = '<circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line>';
          if(mode.includes('finger')) icon = '<path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z"></path>';
          return `<div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); text-transform:capitalize;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icon}</svg>
                    <span>${mode}</span>
                  </div>`;
        }
      },
      {
        headerName: 'Punch Type', field: 'type', width: 140,
        cellRenderer: (p: any) => {
          const t = p.value || 'in';
          const color = t.toLowerCase().includes('in') ? '#15803d' : '#b91c1c';
          return `<span style="font-weight:600; font-size:12px; color:${color};">${t}</span>`;
        }
      },
      {
        headerName: 'Status', field: 'processingStatus', width: 120,
        cellRenderer: (p: any) => {
          const isSuccess = p.value !== 'rejected' && p.value !== 'flagged';
          const bg = isSuccess ? '#ecfdf5' : '#fef2f2';
          const color = isSuccess ? '#15803d' : '#b91c1c';
          return `<span style="background:${bg}; color:${color}; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold; text-transform:uppercase;">${p.value || 'unknown'}</span>`;
        }
      }
    ];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
