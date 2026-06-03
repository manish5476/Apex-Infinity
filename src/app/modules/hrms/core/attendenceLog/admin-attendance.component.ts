import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of, Subject, takeUntil } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi } from 'ag-grid-community';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

// Shared
import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    SkeletonModule,
    TooltipModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog 
      styleClass="crextio-dialog" 
      acceptButtonStyleClass="btn-primary" 
      rejectButtonStyleClass="btn-text">
    </p-confirmDialog>

    <div class="crextio-theme-wrapper fade-in">
      
      <!-- Header -->
      <header class="crextio-header mb-5 slide-down">
        <div class="flex-align gap-4">
          <div class="header-icon bg-yellow text-main">
            <i class="pi pi-shield"></i>
          </div>
          <div class="header-titles">
            <h1 class="page-title">Attendance Audit</h1>
            <p class="page-subtitle text-secondary">Monitor live punches and execute log corrections</p>
          </div>
        </div>
        
        <div class="header-controls">
          <button class="time-pill" (click)="loadData()">
            <i class="pi pi-refresh text-muted"></i>
            <span class="font-bold">Sync Feed</span>
          </button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="grid-layout mb-4">
          <p-skeleton height="80px" borderRadius="50px"></p-skeleton>
          <p-skeleton height="80px" borderRadius="50px"></p-skeleton>
        </div>
        <p-skeleton height="500px" borderRadius="24px"></p-skeleton>
      } @else {
        
        <!-- Stats Bar -->
        @if (stats(); as s) {
          <div class="summary-bar mb-5 slide-down" style="animation-delay: 0.1s">
            <div class="stat-group">
              <div class="stat-item text-center">
                <span class="stat-label">Present Today</span>
                <div class="stat-circle active" pTooltip="Unique Users">{{ s.presentCount || 0 }}</div>
              </div>
              
              <div class="stat-divider"></div>
              
              <div class="stat-item text-center">
                <span class="stat-label">Anomalies</span>
                <div class="stat-circle" [ngClass]="{'status-red': s.flaggedCount > 0}">{{ s.flaggedCount || 0 }}</div>
              </div>

              <div class="stat-divider"></div>

              <div class="stat-item text-center">
                <span class="stat-label">Remote / Web</span>
                <div class="stat-circle" [ngClass]="{'status-yellow': s.remoteCount > 0}">{{ s.remoteCount || 0 }}</div>
              </div>
            </div>

            <div class="stat-group ml-auto">
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search text-muted"></p-inputIcon>
                <input type="text" pInputText placeholder="Search ledger..." (input)="onSearch($event)" class="pill-input" style="width: 250px;" />
              </p-iconField>
            </div>
          </div>
        }

        <!-- AG Grid Container -->
        <div class="table-container slide-down" style="animation-delay: 0.2s">
          <div class="grid-wrapper w-full h-full" style="min-height: 550px;">
            <app-ag-share-grid 
              [columns]="columns" 
              [data]="logs()"
              (gridEvent)="onGridEvent($event)">
            </app-ag-share-grid>
          </div>
        </div>
      }
    </div>

    <!-- Flag Dialog -->
    <p-dialog header="Flag Attendance Log" [(visible)]="displayFlagDialog" [modal]="true" [style]="{width: '450px'}" [draggable]="false" styleClass="crextio-dialog">
      <p class="text-sm text-secondary mb-4">Marking this log as flagged will suspend it from payroll processing until manually reviewed.</p>
      
      <div class="input-group">
        <label class="info-label">Reason for Flagging</label>
        <textarea pInputTextarea [(ngModel)]="flagReason" rows="3" class="w-full pill-input" placeholder="e.g. Geolocation outside allowed radius"></textarea>
      </div>
      
      <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top-dashed">
        <button class="btn-text" (click)="displayFlagDialog = false">Cancel</button>
        <button class="btn-primary bg-red" [disabled]="!flagReason" (click)="submitFlag()">
          {{ isProcessing() ? 'Flagging...' : 'Flag Log' }}
        </button>
      </div>
    </p-dialog>

    <!-- Correct Dialog -->
    <p-dialog header="Correct Attendance Log" [(visible)]="displayCorrectDialog" [modal]="true" [style]="{width: '450px'}" [draggable]="false" styleClass="crextio-dialog">
      <p class="text-sm text-secondary mb-4">Create a verified correction entry. The original raw log will be preserved for auditing purposes.</p>
      
      <form [formGroup]="correctForm" class="flex-col gap-4">
        <div class="input-group">
          <label class="info-label">Corrected Timestamp</label>
          <p-datepicker formControlName="timestamp" [showTime]="true" [showSeconds]="true" appendTo="body" styleClass="w-full pill-datepicker"></p-datepicker>
        </div>
        
        <div class="input-group mt-2">
          <label class="info-label">Corrected Type</label>
          <p-select formControlName="type" [options]="punchTypes" appendTo="body" styleClass="w-full pill-select" [filter]="true" filterBy="label"></p-select>
        </div>

        <div class="input-group mt-2">
          <label class="info-label">Correction Reason</label>
          <textarea pInputTextarea formControlName="reason" rows="2" class="w-full pill-input" placeholder="e.g. Employee forgot to punch out"></textarea>
        </div>

        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top-dashed">
          <button type="button" class="btn-text" (click)="displayCorrectDialog = false">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="correctForm.invalid" (click)="submitCorrection()">
            {{ isProcessing() ? 'Applying...' : 'Apply Correction' }}
          </button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    /* =========================================================
       THEME TOKENS 
       ========================================================= */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background-color: #9AA3AD; 
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      
      --c-bg-app: #F5F6F8;
      --c-bg-card: #FFFFFF;
      --c-text-main: #1A1A1A;
      --c-text-muted: #8E8E93;
      --c-text-light: #BDBDBD;
      --c-accent-yellow: #FCDA68;
      --c-border: #E5E5EA;
      
      --c-status-green-bg: #E8F5E9;
      --c-status-green-dot: #4CAF50;
      --c-status-green-text: #2E7D32;
      
      --c-status-gray-bg: #F0F0F0;
      --c-status-gray-dot: #9E9E9E;
      --c-status-gray-text: #616161;
      
      --c-status-red-bg: #FFEBEE;
      --c-status-red-dot: #F44336;
      --c-status-red-text: #C62828;

      --c-status-yellow-bg: #FFF8E1;
      --c-status-yellow-dot: #FFC107;
      --c-status-yellow-text: #F57F17;

      --radius-app: 32px;
      --radius-card: 24px;
      --radius-pill: 50px;
    }

    /* =========================================================
       LAYOUT & UTILITIES 
       ========================================================= */
    .crextio-theme-wrapper {
      background: var(--c-bg-app);
      border-radius: var(--radius-app);
      padding: 3rem;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      min-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .crextio-theme-wrapper::before {
      content: '';
      position: absolute;
      top: -20%;
      right: -10%;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(252,218,104,0.2) 0%, rgba(245,246,248,0) 60%);
      z-index: 0;
      pointer-events: none;
    }

    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-5 { margin-bottom: 32px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .pt-4 { padding-top: 16px; }
    .ml-auto { margin-left: auto; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-main { color: var(--c-text-main); }
    .text-secondary { color: var(--c-text-muted); }
    .text-muted { color: var(--c-text-muted); }
    .font-bold { font-weight: 600; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 0.5px; }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 14px; }
    .capitalize { text-transform: capitalize; }
    .border-top-dashed { border-top: 1px dashed var(--c-border); }

    /* =========================================================
       HEADER 
       ========================================================= */
    .crextio-header {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .bg-yellow { background: var(--c-accent-yellow); color: var(--c-text-main); }

    .page-title { font-size: 28px; font-weight: 500; color: var(--c-text-main); margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .page-subtitle { margin: 0; font-size: 14px; }

    .time-pill {
      background: var(--c-bg-card);
      border: 1px dashed var(--c-border);
      padding: 10px 20px;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--c-text-main);
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      cursor: pointer;
      transition: all 0.2s;
    }
    .time-pill:hover { border-color: var(--c-text-main); }

    /* =========================================================
       SUMMARY BARS
       ========================================================= */
    .summary-bar {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-end;
      padding: 0 10px;
    }

    .stat-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .stat-label { font-size: 12px; color: var(--c-text-muted); }

    .stat-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      border: 1px dashed var(--c-border);
      background: transparent;
      color: var(--c-text-muted);
    }
    
    .stat-circle.active { background: var(--c-accent-yellow); border-color: var(--c-accent-yellow); color: var(--c-text-main); }
    .stat-circle.status-red { background: var(--c-status-red-bg); border-color: var(--c-status-red-dot); color: var(--c-status-red-text); }
    .stat-circle.status-yellow { background: var(--c-status-yellow-bg); border-color: var(--c-status-yellow-dot); color: var(--c-status-yellow-text); }

    .stat-divider { width: 40px; height: 4px; background: var(--c-border); border-radius: 4px; margin-bottom: 20px; }

    /* =========================================================
       AG GRID CONTAINER 
       ========================================================= */
    .table-container {
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      padding: 20px;
      position: relative;
      z-index: 1;
      flex-grow: 1;
      box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    }

    /* Target AG Grid internals to match Crextio Theme */
    ::ng-deep .table-container .ag-theme-alpine {
      --ag-background-color: transparent;
      --ag-header-background-color: transparent;
      --ag-border-color: transparent;
      --ag-row-border-color: dashed var(--c-border);
      --ag-header-foreground-color: var(--c-text-light);
      --ag-header-column-separator-display: none;
      font-family: inherit;
    }

    ::ng-deep .table-container .ag-header-cell-text {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    ::ng-deep .table-container .ag-row {
      transition: background-color 0.2s;
    }
    ::ng-deep .table-container .ag-row:hover {
      background-color: #FAFAFA !important;
    }

    /* Renderers Deep CSS */
    ::ng-deep .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--c-accent-yellow); color: var(--c-text-main);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 12px; flex-shrink: 0;
    }

    ::ng-deep .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: var(--radius-pill);
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; border: 1px solid transparent;
    }
    ::ng-deep .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    
    ::ng-deep .status-green { background: var(--c-status-green-bg); color: var(--c-status-green-text); }
    ::ng-deep .status-green .status-dot { background: var(--c-status-green-dot); }
    ::ng-deep .status-gray { background: var(--c-bg-app); color: var(--c-status-gray-text); border-color: var(--c-border); }
    ::ng-deep .status-gray .status-dot { background: var(--c-status-gray-dot); }
    ::ng-deep .status-red { background: var(--c-status-red-bg); color: var(--c-status-red-text); }
    ::ng-deep .status-red .status-dot { background: var(--c-status-red-dot); }
    ::ng-deep .status-info { background: #eff6ff; color: #0ea5e9; border-color: #bae6fd; }
    ::ng-deep .status-info .status-dot { background: #0ea5e9; }

    ::ng-deep .action-btn {
      background: transparent; border: 1px solid var(--c-border);
      border-radius: 8px; width: 32px; height: 32px;
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--c-text-muted); cursor: pointer; transition: 0.2s;
    }
    ::ng-deep .action-btn:hover { background: var(--c-border); color: var(--c-text-main); }
    ::ng-deep .action-btn.verify-btn:hover { background: var(--c-status-green-bg); color: var(--c-status-green-text); border-color: transparent; }
    ::ng-deep .action-btn.flag-btn:hover { background: var(--c-status-red-bg); color: var(--c-status-red-text); border-color: transparent; }

    /* =========================================================
       INPUTS & DIALOGS 
       ========================================================= */
    ::ng-deep .pill-datepicker .p-inputtext, ::ng-deep .pill-select .p-select, .pill-input {
      background: var(--c-bg-card);
      border: 1px solid var(--c-border);
      border-radius: var(--radius-pill);
      padding: 10px 16px;
      color: var(--c-text-main);
      font-family: inherit;
      transition: all 0.2s;
      width: 100%;
    }
    .pill-input { border-radius: 16px; resize: none; }
    ::ng-deep .pill-datepicker .p-inputtext:focus, ::ng-deep .pill-select .p-select:focus, .pill-input:focus {
      border-color: var(--c-text-muted);
      outline: none;
      box-shadow: none;
    }

    ::ng-deep .crextio-dialog .p-dialog-header { background: var(--c-bg-card); border-bottom: 1px dashed var(--c-border); border-top-left-radius: var(--radius-card); border-top-right-radius: var(--radius-card); }
    ::ng-deep .crextio-dialog .p-dialog-content { background: var(--c-bg-card); border-bottom-left-radius: var(--radius-card); border-bottom-right-radius: var(--radius-card); padding-top: 20px; }

    .info-label { font-size: 12px; color: var(--c-text-muted); margin-left: 12px; }

    .btn-text { background: transparent; border: none; color: var(--c-text-muted); cursor: pointer; font-weight: 500; }
    .btn-primary { background: var(--c-text-main); color: #FFF; border: none; border-radius: var(--radius-pill); padding: 10px 24px; font-weight: 500; cursor: pointer; }
    .bg-red { background: var(--c-status-red-dot); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .slide-down { animation: slideDown 0.4s ease forwards; opacity: 0; }
    
    @media (max-width: 768px) {
      .hidden-mobile { display: none !important; }
      :host { padding: 1rem; }
      .crextio-theme-wrapper { padding: 1.5rem; }
    }
  `]
})
export class AdminAttendanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  private gridApi!: GridApi;

  isLoading = signal<boolean>(true);
  logs = signal<any[]>([]);
  stats = signal<any>(null);
  columns: any[] = [];

  isProcessing = signal<boolean>(false);
  
  displayFlagDialog = false;
  selectedLogForFlag: any = null;
  flagReason: string = '';

  displayCorrectDialog = false;
  selectedLogForCorrect: any = null;
  correctForm!: FormGroup;

  punchTypes = [
    { label: 'Punch In', value: 'in' },
    { label: 'Punch Out', value: 'out' },
    { label: 'Remote In', value: 'remote_in' }
  ];

  ngOnInit() {
    this.correctForm = this.fb.group({
      timestamp: [null, Validators.required],
      type: [null, Validators.required],
      reason: ['', Validators.required]
    });
    
    this.setupGridColumns();
    this.loadData();
  }

  private setupGridColumns() {
    this.columns = [
      {
        headerName: 'EMPLOYEE',
        field: 'user.name',
        width: 250,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const user = params.data?.user || {};
          const name = user.name || 'Unknown';
          const code = user.employeeProfile?.employeeId || user._id?.substring(0, 8) || 'N/A';
          const initials = this.getInitials(name);
          
          return `
            <div style="display:flex; align-items:center; gap:12px; height:100%;">
              <div class="user-avatar">${initials}</div>
              <div style="display:flex; flex-direction:column; line-height:1.2;">
                <span style="font-weight:600; color:var(--c-text-main); font-size:14px;">${name}</span>
                <span style="font-family:var(--font-mono); font-size:11px; color:var(--c-text-muted); margin-top:2px;">${code}</span>
              </div>
            </div>`;
        }
      },
      {
        headerName: 'LOG TIMESTAMP',
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = params.data?.type;
          const time = params.data?.timestamp ? this.datePipe.transform(params.data.timestamp, 'HH:mm:ss') : '--:--:--';
          const date = params.data?.timestamp ? this.datePipe.transform(params.data.timestamp, 'dd MMM yyyy') : '--';
          
          const icon = this.getTypeIcon(type);
          const colorClass = this.getTypeColorClass(type);
          const typeStr = this.formatType(type);

          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:2px;">
              <span style="font-weight:600; font-size:14px; color:var(--c-text-main); display:flex; align-items:center; gap:6px;">
                ${time} <i class="pi ${icon} ${colorClass}" style="font-size:12px;" title="${typeStr}"></i>
              </span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--c-text-muted);">${date}</span>
            </div>`;
        }
      },
      {
        headerName: 'CONTEXT / DEVICE',
        width: 280,
        cellRenderer: (params: any) => {
          const source = params.data?.source || 'Unknown';
          const address = params.data?.location?.address || 'Geo-Logged';
          const ip = params.data?.ipAddress;
          const hasGeo = !!params.data?.location?.geoJson?.coordinates;
          
          let html = `<div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px; font-size:12px; color:var(--c-text-muted);">`;
          html += `<span style="text-transform:capitalize; display:flex; align-items:center; gap:6px; color:var(--c-text-main); font-weight:500;"><i class="pi pi-desktop"></i> ${source} <span style="font-family:var(--font-mono); font-size:10px; color:var(--c-text-light); font-weight:normal;">(${ip || 'N/A'})</span></span>`;
          if (hasGeo) {
            html += `<span style="display:flex; align-items:center; gap:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${address}"><i class="pi pi-map-marker"></i> ${address}</span>`;
          }
          html += `</div>`;
          return html;
        }
      },
      {
        headerName: 'STATUS',
        field: 'processingStatus',
        width: 160,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = (params.value || 'pending');
          const isCorrection = params.data?.isCorrection;
          const statusClass = this.getStatusClass(status, isCorrection);

          let html = `<div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px; align-items:flex-start;">`;
          html += `<div class="status-pill status-${statusClass}"><span class="status-dot"></span> ${status}</div>`;
          if (isCorrection) {
            html += `<div style="font-size:10px; font-weight:600; color:var(--c-accent-yellow-dark); display:flex; align-items:center; gap:4px; padding-left:4px;"><i class="pi pi-pencil" style="font-size:9px;"></i> Corrected</div>`;
          }
          html += `</div>`;
          return html;
        }
      },
      {
        headerName: 'ACTION',
        colId: 'actions',
        width: 140,
        pinned: 'right',
        cellRenderer: (params: any) => {
          const status = params.data?.processingStatus;
          
          let html = `<div style="display:flex; gap:8px; align-items:center; height:100%;">`;
          
          if (status !== 'processed' && status !== 'rejected') {
            html += `<button class="action-btn verify-btn" data-action="verify" title="Verify Log"><i class="pi pi-check"></i></button>`;
          }
          if (status !== 'flagged') {
            html += `<button class="action-btn flag-btn" data-action="flag" title="Flag Anomaly"><i class="pi pi-flag"></i></button>`;
          }
          html += `<button class="action-btn" data-action="edit" title="Correct Log"><i class="pi pi-pencil"></i></button>`;
          
          html += `</div>`;
          return html;
        }
      }
    ];
  }

  loadData() {
    this.isLoading.set(true);

    forkJoin({
      logsData: this.hrmsService.getAttendanceLogs().pipe(
        catchError(() => of({ data: { data: [] } })) // Maps to standard list paginated response
      ),
      statsData: this.hrmsService.getLogStats().pipe(
        catchError(() => of({ data: { total: [], byStatus: [], byType: [] } }))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe(({ logsData, statsData }) => {
      // 1. Assign logs
      this.logs.set(logsData?.data?.data || logsData?.data || []);
      
      // 2. Parse accurate stats from provided JSON format
      const st = statsData?.data || {};
      const presentCount = st.total?.[0]?.uniqueUsers || 0;
      const flaggedCount = st.byStatus?.find((s: any) => s._id === 'flagged')?.count || 0;
      const remoteCount = st.byType?.find((s: any) => s._id === 'remote_in')?.count || 0;
      
      this.stats.set({ presentCount, flaggedCount, remoteCount });
    });
  }

  onSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (this.gridApi) this.gridApi.setGridOption('quickFilterText', val);
  }

  onGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.gridApi = event.api;
    } else if (event.type === 'cellClicked' && event.colId === 'actions') {
      const nativeEvent = event.event as MouseEvent;
      const target = nativeEvent.target as HTMLElement;
      const btn = target.closest('.action-btn');
      
      if (btn) {
        const action = btn.getAttribute('data-action');
        if (action === 'verify') this.onVerify(event.data);
        if (action === 'flag') this.openFlagModal(event.data);
        if (action === 'edit') this.openCorrectModal(event.data);
      }
    }
  }

  onVerify(log: any) {
    this.confirmationService.confirm({
      message: `Mark this punch as verified?`,
      header: 'Verify Log',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.hrmsService.verifyLog(log._id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message || 'Log Verified');
            this.loadData();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  openFlagModal(log: any) {
    this.selectedLogForFlag = log;
    this.flagReason = '';
    this.displayFlagDialog = true;
  }

  submitFlag() {
    if (!this.flagReason || !this.selectedLogForFlag) return;
    this.isProcessing.set(true);

    this.hrmsService.flagLog(this.selectedLogForFlag._id, this.flagReason).pipe(
      finalize(() => {
        this.isProcessing.set(false);
        this.displayFlagDialog = false;
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (res:any) => {
        this.messageService.showSuccess(res.message || 'Log Flagged');
        this.loadData();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  openCorrectModal(log: any) {
    this.selectedLogForCorrect = log;
    this.correctForm.reset({
      timestamp: new Date(log.timestamp),
      type: log.type,
      reason: ''
    });
    this.displayCorrectDialog = true;
  }

  submitCorrection() {
    if (this.correctForm.invalid || !this.selectedLogForCorrect) return;
    this.isProcessing.set(true);

    const payload = this.correctForm.value;

    this.hrmsService.correctLog(this.selectedLogForCorrect._id, payload).pipe(
      finalize(() => {
        this.isProcessing.set(false);
        this.displayCorrectDialog = false;
      }), takeUntil(this.destroy$)
    ).subscribe({
      next: (res:any) => {
        this.messageService.showSuccess(res.message || 'Correction Applied');
        this.loadData();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatType(type: string): string {
    return type?.replace('_', ' ') || 'Unknown';
  }

  getTypeIcon(type: string): string {
    if (type?.includes('in')) return 'pi-sign-in';
    if (type?.includes('out')) return 'pi-sign-out';
    if (type?.includes('break')) return 'pi-coffee';
    return 'pi-circle';
  }

  getTypeColorClass(type: string): string {
    if (type === 'remote_in') return 'var(--c-status-yellow-text)';
    if (type?.includes('in')) return 'var(--c-status-green-text)';
    if (type?.includes('out')) return 'var(--c-status-red-text)';
    return 'var(--c-text-muted)';
  }

  getStatusClass(status: string, isCorrection: boolean): string {
    if (isCorrection || status === 'corrected') return 'info';
    switch (status) {
      case 'processed': return 'green';
      case 'flagged': return 'red';
      default: return 'gray';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
