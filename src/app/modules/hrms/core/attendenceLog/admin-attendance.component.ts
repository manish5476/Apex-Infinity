import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of, Subject } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi } from 'ag-grid-community';

// PrimeNG & Shared
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';

import { AgShareGrid } from '../../../shared/components/ag-shared-grid';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-admin-attendance',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    SkeletonModule,
    TooltipModule,
    AvatarModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule,
    InputTextModule,
    AgShareGrid
],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog 
      styleClass="premium-dialog" 
      acceptButtonStyleClass="apex-btn apex-btn--primary" 
      rejectButtonStyleClass="p-button-secondary p-button-text">
    </p-confirmDialog>

    <div class="apex-page fade-in flex-col h-screen">
      
      <header class="apex-header apex-header--elevated flex-shrink-0 flex-wrap gap-4">
        <div class="flex-align gap-4">
          <div class="apex-card__icon bg-primary text-white" style="width: 48px; height: 48px; font-size: 20px;">
            <i class="pi pi-shield"></i>
          </div>
          <div class="flex-col">
            <h1 class="apex-page-header__title m-0" style="font-size: var(--font-size-2xl);">Attendance Audit Console</h1>
            <p class="apex-page-header__subtitle m-0 text-sm text-tertiary">Monitor live punches, manage anomalies, and execute log corrections.</p>
          </div>
        </div>
        <div class="header-actions ml-auto">
          <p-button 
            icon="pi pi-refresh" 
            label="Refresh Feed"
            severity="secondary" 
            [outlined]="true"
            (onClick)="loadData()">
          </p-button>
        </div>
      </header>

      <main class="apex-content flex-1 overflow-auto flex-col p-4 sm:p-5">
        @if (isLoading()) {
          <div class="apex-grid apex-grid--3 mb-4">
            <p-skeleton height="120px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
            <p-skeleton height="120px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
            <p-skeleton height="120px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
          </div>
          <p-skeleton height="500px" borderRadius="var(--ui-border-radius-lg)"></p-skeleton>
        } @else {
          
          @if (stats(); as s) {
            <div class="apex-grid apex-grid--3 mb-4 slide-down">
              <div class="apex-card p-4 border border-primary border-left-success" style="border-left-width: 4px;">
                <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Present Today</span>
                <div class="flex align-items-baseline gap-2 mt-3">
                  <span class="text-4xl font-heading font-bold text-success line-height-none">{{ s.presentCount || 0 }}</span>
                  <span class="text-sm font-medium text-secondary">employees</span>
                </div>
              </div>
              
              <div class="apex-card p-4 border border-primary border-left-warning" style="border-left-width: 4px;">
                <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Anomalies / Flagged</span>
                <div class="flex align-items-baseline gap-2 mt-3">
                  <span class="text-4xl font-heading font-bold color-warning line-height-none">{{ s.flaggedCount || 0 }}</span>
                  <span class="text-sm font-medium text-secondary">require review</span>
                </div>
              </div>
              
              <div class="apex-card p-4 border border-primary border-left-primary" style="border-left-width: 4px;">
                <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Remote / Web Punches</span>
                <div class="flex align-items-baseline gap-2 mt-3">
                  <span class="text-4xl font-heading font-bold text-primary line-height-none">{{ s.remoteCount || 0 }}</span>
                  <span class="text-sm font-medium text-secondary">logs recorded</span>
                </div>
              </div>
            </div>
          }

          <div class="apex-card apex-card--surface p-0 flex-col flex-1 slide-down border-0 overflow-hidden" style="animation-delay: 0.1s; min-height: 550px;">
            <div class="flex-between flex-wrap gap-3 px-4 py-3 bg-secondary border-bottom">
              <h3 class="m-0 font-heading text-lg font-bold text-primary flex align-items-center gap-2">
                <i class="pi pi-list text-primary"></i> Raw Punch Ledger
              </h3>
              
              <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                <input 
                  type="text" 
                  pInputText 
                  placeholder="Search by name, status..." 
                  (input)="onSearch($event)" 
                  class="w-full sm:w-20rem premium-input" />
              </p-iconField>
            </div>

            <div class="grid-wrapper w-full flex-grow-1 h-full">
              <app-ag-share-grid 
                [columns]="columns" 
                [data]="logs()"
                (gridEvent)="onGridEvent($event)">
              </app-ag-share-grid>
            </div>
          </div>
        }
      </main>
    </div>

    <p-dialog 
      header="Flag Attendance Log" 
      [(visible)]="displayFlagDialog" 
      [modal]="true" 
      [style]="{width: '450px'}" 
      [draggable]="false"
      styleClass="premium-dialog">
      
      <p class="text-sm text-secondary mb-4 mt-0 line-height-relaxed">Marking this log as flagged will suspend it from payroll processing until manually reviewed.</p>
      
      <div class="input-group flex-col gap-1">
        <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Reason for Flagging <span class="text-error">*</span></label>
        <textarea 
          pInputTextarea 
          [(ngModel)]="flagReason" 
          rows="3" 
          class="w-full premium-input" 
          placeholder="e.g. Geolocation outside allowed radius">
        </textarea>
      </div>
      
      <div class="flex justify-content-end gap-3 mt-4 pt-4 border-top">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayFlagDialog = false"></p-button>
        <p-button label="Flag Log" icon="pi pi-flag" severity="warn" [disabled]="!flagReason" [loading]="isProcessing()" (onClick)="submitFlag()"></p-button>
      </div>
    </p-dialog>

    <p-dialog 
      header="Correct Attendance Log" 
      [(visible)]="displayCorrectDialog" 
      [modal]="true" 
      [style]="{width: '450px'}" 
      [draggable]="false"
      styleClass="premium-dialog">
      
      <p class="text-sm text-secondary mb-4 mt-0 line-height-relaxed">Create a verified correction entry. The original raw log will be preserved for auditing purposes.</p>
      
      <form [formGroup]="correctForm" class="flex-col gap-4">
        <div class="input-group flex-col gap-1">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Corrected Timestamp <span class="text-error">*</span></label>
          <p-datepicker 
            formControlName="timestamp" 
            [showTime]="true" 
            [showSeconds]="true" 
            appendTo="body" 
            styleClass="w-full premium-input">
          </p-datepicker>
        </div>
        
        <div class="input-group flex-col gap-1">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Corrected Type <span class="text-error">*</span></label>
          <p-select 
            formControlName="type" 
            [options]="punchTypes" 
            appendTo="body" 
            styleClass="w-full premium-input"
            [filter]="true"
            filterBy="label">
          </p-select>

        </div>

        <div class="input-group flex-col gap-1">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Correction Reason <span class="text-error">*</span></label>
          <textarea 
            pInputTextarea 
            formControlName="reason" 
            rows="2" 
            class="w-full premium-input" 
            placeholder="e.g. Employee forgot to punch out">
          </textarea>
        </div>

        <div class="flex justify-content-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayCorrectDialog = false"></p-button>
          <p-button label="Apply Correction" icon="pi pi-save" type="submit" [disabled]="correctForm.invalid" [loading]="isProcessing()" styleClass="apex-btn apex-btn--primary" (onClick)="submitCorrection()"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block; 
      width: 100%; 
      height: 100vh;
      overflow: hidden;
    }

    /* Utility Helpers */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-grow-1 { flex-grow: 1; }
    .flex-1 { flex: 1; }
    .flex-wrap { flex-wrap: wrap; }
    .ml-auto { margin-left: auto; }
    
    .w-full { width: 100%; }
    .w-max { width: max-content; }
    .w-max-content { width: max-content; }
    .h-screen { height: 100vh; }
    .h-full { height: 100%; }
    .min-h-screen { min-height: 60vh; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    
    .m-0 { margin: 0; }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: 4px; }
    .mt-3 { margin-top: var(--spacing-md); }
    .mt-4 { margin-top: var(--spacing-xl); }
    
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .px-1 { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
    .px-2 { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .px-3 { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
    .px-4 { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-1 { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-3 { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .bg-secondary { background: var(--bg-secondary); }
    
    .border { border: 1px solid var(--border-primary); }
    .border-0 { border: none !important; }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .overflow-hidden { overflow: hidden; }
    .overflow-auto { overflow-y: auto; overflow-x: hidden; }
    
    .border-left-success { border-left-color: var(--color-success); border-left-style: solid; }
    .border-left-warning { border-left-color: var(--color-warning); border-left-style: solid; }
    .border-left-primary { border-left-color: var(--color-primary); border-left-style: solid; }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-4xl { font-size: 2.5rem; }
    
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-none { line-height: 1; }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-error { color: var(--color-error, #dc2626); }
    .text-warning { color: var(--color-warning, #d97706); }
    .color-warning { color: var(--color-warning, #d97706); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-info { color: #0ea5e9; }
    .text-white { color: white; }
    
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .cursor-pointer { cursor: pointer; }

    ::ng-deep .premium-input, ::ng-deep .premium-select .p-select, ::ng-deep .premium-input .p-inputtext, ::ng-deep textarea.premium-input { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus, ::ng-deep .premium-input .p-inputtext:focus, ::ng-deep textarea.premium-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

    /* Custom CSS for Native HTML Buttons inside AG Grid */
    ::ng-deep .ag-action-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: 1px solid var(--border-secondary);
      background: var(--bg-secondary); color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s ease;
      font-size: 12px; outline: none; padding: 0; margin: 0;
    }
    ::ng-deep .ag-action-btn:hover { transform: scale(1.05); }
    ::ng-deep .ag-action-btn.verify-btn:hover { background: var(--color-success); color: #fff; border-color: var(--color-success); }
    ::ng-deep .ag-action-btn.flag-btn:hover { background: var(--color-warning); color: #fff; border-color: var(--color-warning); }
    ::ng-deep .ag-action-btn.edit-btn:hover { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (min-width: 640px) {
      .sm\\:p-5 { padding: var(--spacing-2xl); }
      .sm\\:w-20rem { width: 20rem; }
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

  // Dialog State
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
    { label: 'Break Start', value: 'break_start' },
    { label: 'Break End', value: 'break_end' }
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

  // ==========================================================================
  // AG GRID SETUP & RENDERING
  // ==========================================================================
  private setupGridColumns() {
    this.columns = [
      {
        headerName: 'Employee',
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
            <div style="display:flex; align-items:center; gap:12px; height:100%; padding:4px 0;">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--color-primary-bg); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0;">${initials}</div>
              <div style="display:flex; flex-direction:column; justify-content:center; line-height:1.2;">
                <span style="font-weight:700; color:var(--text-primary); font-size:13px;">${name}</span>
                <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); margin-top:2px;">${code}</span>
              </div>
            </div>`;
        }
      },
      {
        headerName: 'Timestamp & Type',
        width: 220,
        sortable: true,
        cellRenderer: (params: any) => {
          const type = params.data?.type;
          const time = params.data?.timestamp ? this.datePipe.transform(params.data.timestamp, 'dd MMM yyyy, HH:mm:ss') : 'N/A';
          
          const icon = this.getTypeIcon(type);
          const color = this.getTypeColor(type);
          const typeStr = this.formatType(type);

          return `
            <div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px;">
              <span style="font-weight:700; text-transform:capitalize; display:flex; align-items:center; gap:6px; font-size:12px;" class="${color}">
                <i class="pi ${icon}" style="font-size:11px;"></i> ${typeStr}
              </span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-secondary);">${time}</span>
            </div>`;
        }
      },
      {
        headerName: 'Source Data',
        width: 250,
        cellRenderer: (params: any) => {
          const source = params.data?.source || 'Unknown';
          const address = params.data?.location?.address;
          const ip = params.data?.ipAddress;
          
          let html = `<div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:4px; font-size:12px; color:var(--text-secondary);">`;
          html += `<span style="text-transform:capitalize; display:flex; align-items:center; gap:4px;"><i class="pi pi-desktop text-tertiary"></i> ${source}</span>`;
          if (address) html += `<span style="display:flex; align-items:center; gap:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${address}"><i class="pi pi-map-marker text-tertiary"></i> ${address}</span>`;
          if (ip) html += `<span style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary);">${ip}</span>`;
          html += `</div>`;
          return html;
        }
      },
      {
        headerName: 'Status',
        field: 'processingStatus',
        width: 150,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = (params.value || 'UNKNOWN').toUpperCase();
          const severity = this.getStatusSeverity(params.value);
          const isCorrection = params.data?.isCorrection;
          
          let bg = 'var(--bg-secondary)', color = 'var(--text-secondary)', border = 'var(--border-secondary)';
          if(severity === 'success') { bg = 'var(--color-success-bg, #ecfdf5)'; color = 'var(--color-success, #16a34a)'; border = 'color-mix(in srgb, var(--color-success) 30%, transparent)'; }
          if(severity === 'danger') { bg = 'var(--color-error-bg, #fef2f2)'; color = 'var(--color-error, #dc2626)'; border = 'color-mix(in srgb, var(--color-error) 30%, transparent)'; }
          if(severity === 'warn') { bg = 'color-mix(in srgb, var(--color-warning) 10%, transparent)'; color = 'var(--color-warning)'; border = 'color-mix(in srgb, var(--color-warning) 30%, transparent)'; }
          if(severity === 'info') { bg = '#eff6ff'; color = '#0ea5e9'; border = '#bae6fd'; }

          let html = `<div style="display:flex; flex-direction:column; justify-content:center; height:100%; gap:6px; align-items:center;">`;
          html += `<span style="display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; line-height:1; background-color:${bg}; color:${color}; border:1px solid ${border}; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px;">${status}</span>`;
          if (isCorrection) {
            html += `<div style="font-size:10px; font-weight:700; color:var(--color-warning); display:flex; align-items:center; gap:4px;"><i class="pi pi-pencil" style="font-size:9px;"></i> Corrected</div>`;
          }
          html += `</div>`;
          return html;
        }
      },
      {
        headerName: 'Actions',
        colId: 'actions',
        width: 150,
        pinned: 'right',
        cellStyle: { 'padding': '0 16px' },
        cellRenderer: (params: any) => {
          const status = params.data?.processingStatus;
          
          let html = `<div style="display:flex; gap:8px; justify-content:flex-end; align-items:center; height:100%;">`;
          
          if (status !== 'processed' && status !== 'rejected') {
            html += `<button class="ag-action-btn verify-btn" data-action="verify" title="Verify Log"><i class="pi pi-check"></i></button>`;
          }
          if (status !== 'flagged') {
            html += `<button class="ag-action-btn flag-btn" data-action="flag" title="Flag Anomaly"><i class="pi pi-flag"></i></button>`;
          }
          html += `<button class="ag-action-btn edit-btn" data-action="edit" title="Correct Log"><i class="pi pi-pencil"></i></button>`;
          
          html += `</div>`;
          return html;
        }
      }
    ];
  }

  // ==========================================================================
  // DATA & EVENTS
  // ==========================================================================
  loadData() {
    this.isLoading.set(true);

    forkJoin({
      logsData: this.hrmsService.getAttendanceLogs().pipe(
        catchError(() => of({ data: { logs: [] } }))
      ),
      statsData: this.hrmsService.getLogStats().pipe(
        catchError(() => of({ data: { presentCount: 42, flaggedCount: 3, remoteCount: 12 } }))
      )
    }).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe(({ logsData, statsData }) => {
      this.logs.set(logsData?.data?.logs || []);
      this.stats.set(statsData?.data || {});
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
      // Intercept the native click event to determine which button was pressed
      const nativeEvent = event.event as MouseEvent;
      const target = nativeEvent.target as HTMLElement;
      const btn = target.closest('.ag-action-btn');
      
      if (btn) {
        const action = btn.getAttribute('data-action');
        if (action === 'verify') this.onVerify(event.row);
        if (action === 'flag') this.openFlagModal(event.row);
        if (action === 'edit') this.openCorrectModal(event.row);
      }
    }
  }

  // ==========================================================================
  // ACTIONS
  // ==========================================================================
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

  // ==========================================================================
  // HELPERS
  // ==========================================================================
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

  getTypeColor(type: string): string {
    if (type?.includes('in')) return 'text-success';
    if (type?.includes('out')) return 'text-error';
    if (type?.includes('break')) return 'color-warning';
    return 'text-secondary';
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'danger' | 'info' | 'warn' {
    switch (status) {
      case 'processed': return 'success';
      case 'pending': return 'secondary';
      case 'flagged': return 'danger';
      case 'corrected': return 'info';
      default: return 'warn';
    }
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// import { catchError, finalize, forkJoin, of } from 'rxjs';

// // Services
// import { MessageService, ConfirmationService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { DialogModule } from 'primeng/dialog';

// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { AvatarModule } from 'primeng/avatar';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';
// import { DatePickerModule } from 'primeng/datepicker';
// import { SelectModule } from 'primeng/select';
// import { HRMSService } from '../../hrms.service';
// import { Toast } from 'primeng/toast';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-admin-attendance',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonModule,
//     TagModule, DialogModule, DatePickerModule,SelectModule,FormsModule,
//     SkeletonModule, TooltipModule, AvatarModule, ConfirmDialogModule,
//     IconFieldModule, InputIconModule, InputTextModule,Toast
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>
//     <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

//     <div class="page-wrapper fade-in">
      
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-shield"></i></div>
//           <div class="header-titles">
//             <h1 class="page-title">Attendance Audit Console</h1>
//             <p class="page-subtitle">Monitor live punches, manage anomalies, and execute log corrections.</p>
//           </div>
//         </div>
//         <div class="header-right flex-align gap-3">
//           <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" pTooltip="Refresh Feed" (onClick)="loadData()"></p-button>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <div class="grid-3 mb-4">
//           <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
//           <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
//           <p-skeleton height="100px" borderRadius="12px"></p-skeleton>
//         </div>
//         <p-skeleton height="400px" borderRadius="12px"></p-skeleton>
//       } @else {
        
//         @if (stats(); as s) {
//           <div class="grid-3 mb-4 slide-down" styleClass="animation-delay: 0.1s">
//             <p-card styleClass="stat-card border-left-success">
//               <span class="stat-label">Present Today</span>
//               <div class="flex-align gap-3 mt-2">
//                 <span class="stat-val text-success">{{ s.presentCount || 0 }}</span>
//                 <span class="text-sm text-secondary">employees</span>
//               </div>
//             </p-card>
//             <p-card styleClass="stat-card border-left-warning">
//               <span class="stat-label">Anomalies / Flagged</span>
//               <div class="flex-align gap-3 mt-2">
//                 <span class="stat-val text-warning">{{ s.flaggedCount || 0 }}</span>
//                 <span class="text-sm text-secondary">require review</span>
//               </div>
//             </p-card>
//             <p-card styleClass="stat-card border-left-primary">
//               <span class="stat-label">Remote / Web Punches</span>
//               <div class="flex-align gap-3 mt-2">
//                 <span class="stat-val text-primary">{{ s.remoteCount || 0 }}</span>
//                 <span class="text-sm text-secondary">logs</span>
//               </div>
//             </p-card>
//           </div>
//         }

//         <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.2s">
//           <p-table 
//             #dt
//             [value]="logs()" 
//             [paginator]="true" 
//             [rows]="15" 
//             [globalFilterFields]="['user.name', 'type', 'source', 'processingStatus']"
//             responsiveLayout="scroll"
//             styleClass="premium-table border-round-xl manish-border-1 surface-border">
            
//             <ng-template pTemplate="caption">
//               <div class="table-toolbar flex-between p-4 bg-surface border-bottom">
//                 <h3 class="m-0 font-heading text-primary-color flex-align gap-2">
//                   <i class="pi pi-list"></i> Raw Punch Ledger
//                 </h3>
//                 <p-iconField iconPosition="left">
//                   <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
//                   <input type="text" pInputText placeholder="Search by name, status..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
//                 </p-iconField>
//               </div>
//             </ng-template>

//             <ng-template pTemplate="header">
//               <tr>
//                 <th>Employee</th>
//                 <th>Timestamp & Type</th>
//                 <th>Source Data</th>
//                 <th class="text-center">Processing Status</th>
//                 <th class="text-right">Audit Actions</th>
//               </tr>
//             </ng-template>

//             <ng-template pTemplate="body" let-log>
//               <tr class="table-row-hover" [ngClass]="{'bg-error-faded': log.processingStatus === 'flagged'}">
//                 <td>
//                   <div class="flex-align gap-3">
//                     <p-avatar [label]="getInitials(log.user?.name)" shape="circle" size="normal" [style]="{'background-color': 'var(--bg-secondary)', 'color': 'var(--text-secondary)'}"></p-avatar>
//                     <div class="flex-col gap-1">
//                       <span class="font-bold text-primary-color">{{ log.user?.name || 'Unknown' }}</span>
//                       <span class="text-xs text-secondary">{{ log.user?.employeeProfile?.employeeId || log.user?._id | slice:0:8 }}</span>
//                     </div>
//                   </div>
//                 </td>
//                 <td>
//                   <div class="flex-col gap-1">
//                     <span class="font-bold capitalize flex-align gap-2" [ngClass]="getTypeColor(log.type)">
//                       <i class="pi" [ngClass]="getTypeIcon(log.type)"></i> {{ formatType(log.type) }}
//                     </span>
//                     <span class="font-mono text-sm text-secondary">{{ log.timestamp | date:'dd MMM yyyy, HH:mm:ss' }}</span>
//                   </div>
//                 </td>
//                 <td>
//                   <div class="flex-col gap-1 text-sm text-secondary">
//                     <span class="capitalize flex-align gap-1"><i class="pi pi-desktop text-tertiary"></i> {{ log.source }}</span>
//                     <span *ngIf="log.location?.address" class="flex-align gap-1 truncate w-15rem" [pTooltip]="log.location.address"><i class="pi pi-map-marker text-tertiary"></i> {{ log.location.address }}</span>
//                     <span *ngIf="log.ipAddress" class="font-mono text-xs text-tertiary">{{ log.ipAddress }}</span>
//                   </div>
//                 </td>
//                 <td class="text-center">
//                   <p-tag [severity]="getStatusSeverity(log.processingStatus)" [value]="log.processingStatus | uppercase"></p-tag>
//                   <div *ngIf="log.isCorrection" class="text-xs text-warning mt-1 font-bold"><i class="pi pi-pencil"></i> Corrected</div>
//                 </td>
//                 <td class="text-right">
//                   <div class="flex-align justify-end gap-2">
//                     <p-button *ngIf="log.processingStatus !== 'processed' && log.processingStatus !== 'rejected'" icon="pi pi-check" [text]="true" [rounded]="true" severity="success" pTooltip="Verify Log" (onClick)="onVerify(log)"></p-button>
//                     <p-button *ngIf="log.processingStatus !== 'flagged'" icon="pi pi-flag" [text]="true" [rounded]="true" severity="warn" pTooltip="Flag Anomaly" (onClick)="openFlagModal(log)"></p-button>
//                     <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" severity="primary" pTooltip="Correct Log" (onClick)="openCorrectModal(log)"></p-button>
//                   </div>
//                 </td>
//               </tr>
//             </ng-template>

//             <ng-template pTemplate="emptymessage">
//               <tr><td colspan="5" class="text-center py-6 text-secondary">No attendance logs found for the selected period.</td></tr>
//             </ng-template>
//           </p-table>
//         </p-card>
//       }
//     </div>

//     <p-dialog header="Flag Attendance Log" [(visible)]="displayFlagDialog" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
//       <p class="text-sm text-secondary mb-4">Marking this log as flagged will suspend it from payroll processing until reviewed.</p>
//       <div class="input-group">
//         <label class="info-label">Reason for Flagging <span class="text-error">*</span></label>
//         <textarea pInputTextarea [(ngModel)]="flagReason" rows="3" class="w-full premium-input" placeholder="e.g. Geolocation outside allowed radius"></textarea>
//       </div>
//       <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
//         <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayFlagDialog = false"></p-button>
//         <p-button label="Flag Log" icon="pi pi-flag" severity="warn" [disabled]="!flagReason" [loading]="isProcessing()" (onClick)="submitFlag()"></p-button>
//       </div>
//     </p-dialog>

//     <p-dialog header="Correct Attendance Log" [(visible)]="displayCorrectDialog" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
//       <p class="text-sm text-secondary mb-4">Create a verified correction entry. The original raw log will be preserved for auditing purposes.</p>
      
//       <form [formGroup]="correctForm" class="flex-col gap-4">
//         <div class="input-group">
//           <label class="info-label">Corrected Timestamp <span class="text-error">*</span></label>
//           <p-datepicker formControlName="timestamp" [showTime]="true" [showSeconds]="true" appendTo="body" styleClass="w-full premium-calendar"></p-datepicker>
//         </div>
        
//         <div class="input-group">
//           <label class="info-label">Corrected Type <span class="text-error">*</span></label>
//           <p-select formControlName="type" [options]="punchTypes" appendTo="body" styleClass="w-full premium-dropdown"></p-select>
//         </div>

//         <div class="input-group">
//           <label class="info-label">Correction Reason <span class="text-error">*</span></label>
//           <textarea pInputTextarea formControlName="reason" rows="2" class="w-full premium-input" placeholder="e.g. Employee forgot to punch out"></textarea>
//         </div>

//         <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
//           <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayCorrectDialog = false"></p-button>
//           <p-button label="Apply Correction" icon="pi pi-save" type="submit" [disabled]="correctForm.invalid" [loading]="isProcessing()" styleClass="p-button-primary" (onClick)="submitCorrection()"></p-button>
//         </div>
//       </form>
//     </p-dialog>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }

//     /* Utility */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .justify-end { justify-content: flex-end; }
    
//     .w-full { width: 100%; }
//     .w-max { width: max-content; }
//     .w-15rem { width: 15rem; }
//     .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    
//     .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl); }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .gap-4 { gap: var(--spacing-lg); }
    
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .mt-4 { margin-top: var(--spacing-xl); }
    
//     .p-4 { padding: var(--spacing-xl); }
//     .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
//     .pt-4 { padding-top: var(--spacing-xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary { background: var(--color-primary); color: white; }
//     .bg-error-faded { background-color: rgba(239, 68, 68, 0.03) !important; }
    
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .manish-border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-round-xl { border-radius: var(--radius-2xl); }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-error { color: var(--color-error); }
//     .text-warning { color: var(--color-warning); }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .capitalize { text-transform: capitalize; }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
//     .header-titles { display: flex; flex-direction: column; gap: 4px; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

//     /* Cards */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    
//     ::ng-deep .stat-card.p-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
//     ::ng-deep .stat-card .p-card-body { padding: var(--spacing-xl); }
//     .border-left-success { border-left: 4px solid var(--color-success) !important; }
//     .border-left-warning { border-left: 4px solid var(--color-warning) !important; }
//     .border-left-primary { border-left: 4px solid var(--color-primary) !important; }
//     .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
//     .stat-val { font-size: 2.5rem; font-weight: var(--font-weight-bold); line-height: 1; }

//     /* Table */
//     ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-lg) !important; width: 300px; }
//     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
//     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
//     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
//     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

//     /* Forms & Dialogs */
//     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
//     .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
//     ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
//     ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }
//     ::ng-deep .premium-input, ::ng-deep .premium-dropdown .p-select, ::ng-deep .premium-calendar .p-datepicker .p-inputtext { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
//     ::ng-deep .premium-input:focus, ::ng-deep .premium-dropdown .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     @media (max-width: 768px) {
//       .dashboard-header, .table-toolbar { flex-direction: column; align-items: stretch; gap: var(--spacing-xl); }
//       ::ng-deep .premium-search-input { width: 100%; }
//     }
//   `]
// })
// export class AdminAttendanceComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);
//   private fb = inject(FormBuilder);

//   isLoading = signal<boolean>(true);
//   logs = signal<any[]>([]);
//   stats = signal<any>(null);

//   // Dialog State
//   isProcessing = signal<boolean>(false);
  
//   displayFlagDialog = false;
//   selectedLogForFlag: any = null;
//   flagReason: string = '';

//   displayCorrectDialog = false;
//   selectedLogForCorrect: any = null;
//   correctForm!: FormGroup;

//   punchTypes = [
//     { label: 'Punch In', value: 'in' },
//     { label: 'Punch Out', value: 'out' },
//     { label: 'Break Start', value: 'break_start' },
//     { label: 'Break End', value: 'break_end' }
//   ];

//   ngOnInit() {
//     this.correctForm = this.fb.group({
//       timestamp: [null, Validators.required],
//       type: [null, Validators.required],
//       reason: ['', Validators.required]
//     });
//     this.loadData();
//   }

//   loadData() {
//     this.isLoading.set(true);

//     forkJoin({
//       logsData: this.hrmsService.getAttendanceLogs().pipe(
//         catchError(() => of({ data: { logs: [] } }))
//       ),
//       statsData: this.hrmsService.getLogStats().pipe(
//         catchError(() => of({ data: { presentCount: 42, flaggedCount: 3, remoteCount: 12 } })) // Mock fallback
//       )
//     }).pipe(
//       finalize(() => this.isLoading.set(false))
//     ).subscribe(({ logsData, statsData }) => {
//       this.logs.set(logsData?.data?.logs || []);
//       this.stats.set(statsData?.data || {});
//     });
//   }

//   // --- Actions ---

//   onVerify(log: any) {
//     this.confirmationService.confirm({
//       message: `Mark this punch as verified?`,
//       header: 'Verify Log',
//       icon: 'pi pi-check-circle',
//       acceptButtonStyleClass: 'p-button-success',
//       accept: () => {
//         this.hrmsService.verifyLog(log._id).subscribe({
//           next: (res:any) => {
//             this.messageService.showSuccess(res.message)
//             this.loadData();
//           },
//           error: (err) => this.messageService.handleHttpError(err)
//         });
//       }
//     });
//   }

//   openFlagModal(log: any) {
//     this.selectedLogForFlag = log;
//     this.flagReason = '';
//     this.displayFlagDialog = true;
//   }

//   submitFlag() {
//     if (!this.flagReason || !this.selectedLogForFlag) return;
//     this.isProcessing.set(true);

//     this.hrmsService.flagLog(this.selectedLogForFlag._id, this.flagReason).pipe(
//       finalize(() => {
//         this.isProcessing.set(false);
//         this.displayFlagDialog = false;
//       })
//     ).subscribe({
//       next: (res:any) => {
//         this.messageService.showSuccess(res.message)
//         this.loadData();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   openCorrectModal(log: any) {
//     this.selectedLogForCorrect = log;
//     this.correctForm.reset({
//       timestamp: new Date(log.timestamp),
//       type: log.type,
//       reason: ''
//     });
//     this.displayCorrectDialog = true;
//   }

//   submitCorrection() {
//     if (this.correctForm.invalid || !this.selectedLogForCorrect) return;
//     this.isProcessing.set(true);

//     const payload = this.correctForm.value;

//     this.hrmsService.correctLog(this.selectedLogForCorrect._id, payload).pipe(
//       finalize(() => {
//         this.isProcessing.set(false);
//         this.displayCorrectDialog = false;
//       })
//     ).subscribe({
//       next: (res:any) => {
//         this.messageService.showSuccess(res.message)
//         this.loadData();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   // --- Helpers ---
//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   formatType(type: string): string {
//     return type?.replace('_', ' ') || 'Unknown';
//   }

//   getTypeIcon(type: string): string {
//     if (type?.includes('in')) return 'pi-sign-in';
//     if (type?.includes('out')) return 'pi-sign-out';
//     if (type?.includes('break')) return 'pi-coffee';
//     return 'pi-circle';
//   }

//   getTypeColor(type: string): string {
//     if (type?.includes('in')) return 'text-success';
//     if (type?.includes('out')) return 'text-error';
//     if (type?.includes('break')) return 'text-warning';
//     return 'text-secondary';
//   }

//   getStatusSeverity(status: string): any {
//     switch (status) {
//       case 'processed': return 'success';
//       case 'pending': return 'secondary';
//       case 'flagged': return 'danger';
//       case 'corrected': return 'info';
//       default: return 'warning';
//     }
//   }
// }