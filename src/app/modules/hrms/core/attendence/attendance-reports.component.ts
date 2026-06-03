import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi } from 'ag-grid-community';

// PrimeNG & Shared Components
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    ButtonModule,
    TagModule, 
    SelectModule, 
    DatePickerModule, 
    DrawerModule, 
    DialogModule,
    SkeletonModule, 
    TooltipModule, 
    TabsModule, 
    ToastModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TextareaModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="crextio-theme-wrapper fade-in">
      
      <!-- Header -->
      <header class="crextio-header mb-5 slide-down">
        <div class="flex-align gap-4">
          <div class="header-icon bg-yellow text-main">
            <i class="pi pi-file-excel"></i>
          </div>
          <div class="header-titles">
            <h1 class="page-title">Advanced Reporting</h1>
            <p class="page-subtitle text-secondary">Generate cross-department reports and view aggregated metrics.</p>
          </div>
        </div>
      </header>

      <!-- Main Tabs Content -->
      <div class="crextio-card flex-col flex-grow-1 p-0 overflow-hidden slide-down" style="animation-delay: 0.1s;">
        <p-tabs value="0">
          
          <p-tablist>
            <p-tab value="0">
              <div class="flex-align gap-2 font-medium px-2 py-1">
                <i class="pi pi-calendar-times"></i> Attendance Report
              </div>
            </p-tab>
            <p-tab value="1">
              <div class="flex-align gap-2 font-medium px-2 py-1">
                <i class="pi pi-wallet"></i> Leave Liability
              </div>
            </p-tab>
          </p-tablist>

          <p-tabpanels styleClass="p-0">
            
            <!-- TAB 0: ATTENDANCE REPORT -->
            <p-tabpanel value="0">
              <div class="panel-content p-4 flex-col h-full">
                
                <!-- Filter Bar -->
                <div class="filter-bar bg-light p-4 border-radius-card border-dashed mb-4 flex-align justify-between flex-wrap gap-4">
                  <div class="flex-align flex-wrap gap-4">
                    <div class="input-group">
                      <label class="info-label">Date Range</label>
                      <p-datepicker 
                        [(ngModel)]="dateRange" 
                        selectionMode="range" 
                        [readonlyInput]="true" 
                        [showIcon]="true" 
                        placeholder="Select Range" 
                        appendTo="body"
                        styleClass="pill-datepicker w-15rem">
                      </p-datepicker>
                    </div>
                    <div class="input-group">
                      <label class="info-label">Department</label>
                      <p-select 
                        [options]="departments" 
                        [(ngModel)]="selectedDept" 
                        placeholder="All Departments" 
                        [showClear]="true" 
                        appendTo="body"
                        styleClass="pill-select w-15rem"
                        [filter]="true"
                        filterBy="label">
                      </p-select>
                    </div>
                  </div>
                  
                  <button class="btn-primary" [disabled]="isLoadingReport()" (click)="loadAttendanceReport()">
                    <i class="pi pi-bolt mr-2"></i> Generate
                  </button>
                </div>

                <!-- Aggregated Stats Bar -->
                @if (attendanceSummary(); as s) {
                  <div class="summary-bar mb-4 slide-down">
                    <div class="stat-group">
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Emp.</span>
                        <div class="stat-circle active">{{ s.totalEmployees || 0 }}</div>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Absent</span>
                        <div class="stat-circle status-red">{{ s.totalAbsent || 0 }}</div>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Late</span>
                        <div class="stat-circle status-yellow">{{ s.totalLate || 0 }}</div>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item text-center">
                        <span class="stat-label">Half Days</span>
                        <div class="stat-circle status-gray">{{ s.totalHalfDay || 0 }}</div>
                      </div>
                    </div>

                    <div class="stat-group ml-auto">
                      <div class="stat-item text-center">
                        <span class="stat-label">Avg Attendance</span>
                        <div class="stat-pill-wide status-green">{{ s.avgAttendancePercentage || 0 }}%</div>
                      </div>
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Work Hours</span>
                        <div class="stat-pill-wide status-gray">{{ s.totalWorkHours || 0 }}h</div>
                      </div>
                    </div>
                  </div>
                }

                <div class="flex-between mb-3">
                  <h3 class="font-bold text-lg text-main m-0">Generated Report</h3>
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search text-muted"></p-inputIcon>
                    <input type="text" pInputText placeholder="Search records..." (input)="onAttendanceSearch($event)" class="pill-input w-20rem" />
                  </p-iconField>
                </div>

                <div class="table-container flex-grow-1" style="min-height: 450px;">
                  <app-ag-share-grid 
                    [columns]="attendanceColumns" 
                    [data]="attendanceReportData()"
                    (gridEvent)="onAttendanceGridEvent($event)">
                  </app-ag-share-grid>
                </div>

              </div>
            </p-tabpanel>

            <!-- TAB 1: LEAVE LIABILITY -->
            <p-tabpanel value="1">
              <div class="panel-content p-4 bg-light h-full flex-col">
                
                <div class="filter-bar bg-card p-4 border-radius-card border-dashed mb-4 flex-align flex-wrap gap-4">
                  <div class="input-group">
                    <label class="info-label">Financial Year</label>
                    <p-select 
                      [options]="financialYears" 
                      [(ngModel)]="selectedFy" 
                      appendTo="body"
                      styleClass="pill-select w-15rem"
                      [filter]="true"
                      filterBy="label">
                    </p-select>
                  </div>
                  <button class="btn-primary mt-auto" (click)="loadLeaveReport()">
                    <i class="pi pi-chart-pie mr-2"></i> Fetch Liability
                  </button>
                </div>

                @if (leaveReportSummary(); as summary) {
                  <div class="summary-bar mb-4 slide-down">
                    <div class="stat-group">
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Employees</span>
                        <div class="stat-circle active">{{ summary.totalEmployees || 0 }}</div>
                      </div>
                      <div class="stat-divider"></div>
                      <div class="stat-item text-center">
                        <span class="stat-label">Total Enterprise Liability</span>
                        <div class="stat-pill-wide status-red font-bold">{{ summary.totalLeaveBalance || 0 }} Days</div>
                      </div>
                    </div>
                  </div>
                }

                <div class="flex-between mb-3">
                  <h3 class="font-bold text-lg text-main m-0">Leave Balances</h3>
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search text-muted"></p-inputIcon>
                    <input type="text" pInputText placeholder="Search employees..." (input)="onLeaveSearch($event)" class="pill-input w-20rem" />
                  </p-iconField>
                </div>

                <div class="table-container flex-grow-1" style="min-height: 450px;">
                  <app-ag-share-grid 
                    [columns]="leaveColumns" 
                    [data]="leaveReportData()"
                    (gridEvent)="onLeaveGridEvent($event)">
                  </app-ag-share-grid>
                </div>

              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
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
      display: flex;
      flex-direction: column;
      min-height: 85vh;
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
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-wrap { flex-wrap: wrap; }
    .flex-grow-1 { flex-grow: 1; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .w-15rem { width: 15rem; }
    .w-20rem { width: 20rem; }
    
    .p-0 { padding: 0 !important; }
    .p-4 { padding: 24px; }
    .px-2 { padding-left: 12px; padding-right: 12px; }
    .py-1 { padding-top: 6px; padding-bottom: 6px; }
    .gap-2 { gap: 8px; }
    .gap-4 { gap: 16px; }
    .m-0 { margin: 0; }
    .mb-3 { margin-bottom: 16px; }
    .mb-4 { margin-bottom: 24px; }
    .mb-5 { margin-bottom: 32px; }
    .mt-auto { margin-top: auto; }
    .ml-auto { margin-left: auto; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-main { color: var(--c-text-main); }
    .text-secondary { color: var(--c-text-muted); }
    .text-muted { color: var(--c-text-muted); }
    .font-bold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 0.5px; }
    .text-xs { font-size: 12px; }
    .text-sm { font-size: 14px; }
    .text-lg { font-size: 18px; }

    .bg-light { background: #FCFCFC; }
    .bg-card { background: var(--c-bg-card); }
    .border-radius-card { border-radius: var(--radius-card); }
    .border-dashed { border: 1px dashed var(--c-border); }
    .crextio-card { background: var(--c-bg-card); border-radius: var(--radius-card); border: 1px solid var(--c-border); box-shadow: 0 4px 15px rgba(0,0,0,0.02); z-index: 1; }

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

    /* =========================================================
       SUMMARY BARS
       ========================================================= */
    .summary-bar {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-end;
      padding: 0 10px;
      flex-wrap: wrap;
      gap: 20px;
    }
    .stat-group { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .stat-label { font-size: 12px; color: var(--c-text-muted); }

    .stat-circle {
      width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 14px; border: 1px dashed var(--c-border); background: var(--c-bg-app); color: var(--c-text-muted);
    }
    .stat-pill-wide {
      padding: 0 24px; height: 44px; border-radius: var(--radius-pill); display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 14px; border: 1px dashed var(--c-border); background: var(--c-bg-app); color: var(--c-text-muted);
    }

    .stat-circle.active { background: var(--c-accent-yellow); border-color: var(--c-accent-yellow); color: var(--c-text-main); }
    .stat-circle.status-red, .stat-pill-wide.status-red { background: var(--c-status-red-bg); border-color: var(--c-status-red-dot); color: var(--c-status-red-text); }
    .stat-circle.status-yellow, .stat-pill-wide.status-yellow { background: var(--c-status-yellow-bg); border-color: var(--c-status-yellow-dot); color: var(--c-status-yellow-text); }
    .stat-circle.status-green, .stat-pill-wide.status-green { background: var(--c-status-green-bg); border-color: var(--c-status-green-dot); color: var(--c-status-green-text); }
    .stat-circle.status-gray, .stat-pill-wide.status-gray { background: var(--c-status-gray-bg); border-color: var(--c-status-gray-dot); color: var(--c-status-gray-text); }

    .stat-divider { width: 40px; height: 4px; background: var(--c-border); border-radius: 4px; margin-bottom: 20px; }

    /* =========================================================
       AG GRID CONTAINER 
       ========================================================= */
    .table-container {
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      position: relative;
      z-index: 1;
      flex-grow: 1;
    }

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

    ::ng-deep .table-container .ag-row { transition: background-color 0.2s; }
    ::ng-deep .table-container .ag-row:hover { background-color: #FAFAFA !important; }

    ::ng-deep .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--c-accent-yellow); color: var(--c-text-main);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 12px; flex-shrink: 0;
    }

    /* =========================================================
       INPUTS & BUTTONS
       ========================================================= */
    ::ng-deep .pill-datepicker .p-inputtext, ::ng-deep .pill-select .p-select, .pill-input {
      background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: var(--radius-pill);
      padding: 10px 16px; color: var(--c-text-main); font-family: inherit; transition: all 0.2s; width: 100%;
    }
    ::ng-deep .pill-datepicker .p-inputtext:focus, ::ng-deep .pill-select .p-select:focus, .pill-input:focus {
      border-color: var(--c-text-muted); outline: none; box-shadow: none;
    }

    .info-label { font-size: 12px; color: var(--c-text-muted); margin-left: 12px; font-weight: 500; }
    
    .btn-primary {
      background: var(--c-text-main); color: #FFF; border: none; border-radius: var(--radius-pill);
      padding: 10px 24px; font-weight: 500; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { background: #000; }

    /* PrimeNG Tabs overrides */
    ::ng-deep .p-tablist { border-bottom: 1px dashed var(--c-border); background: transparent; }
    ::ng-deep .p-tab { padding: 16px; color: var(--c-text-muted); border: none; font-family: inherit; transition: 0.2s; }
    ::ng-deep .p-tab.p-tab-active { color: var(--c-text-main); font-weight: 600; border-bottom: 2px solid var(--c-text-main); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .slide-down { animation: slideDown 0.4s ease forwards; opacity: 0; }
  `]
})
export class AttendanceReportsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  // Filters
  dateRange: Date[] | null = null;
  departments = [{ label: 'Administration', value: '69eef9935011d1bea4120a26' }, { label: 'Engineering', value: 'dept_eng' }];
  selectedDept: string | null = null;
  financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
  selectedFy = '2024-2025';

  // AG Grid Instances
  private attendanceGridApi!: GridApi;
  private leaveGridApi!: GridApi;

  // Tab 0 Data (Attendance Aggregated Report)
  isLoadingReport = signal(false);
  attendanceReportData = signal<any[]>([]);
  attendanceSummary = signal<any>(null);
  attendanceColumns: any[] = [];

  // Tab 1 Data (Leave Liability)
  leaveReportData = signal<any[]>([]);
  leaveReportSummary = signal<any>(null);
  leaveColumns: any[] = [];

  ngOnInit() {
    const date = new Date();
    // Defaulting to the context of the provided API response
    this.dateRange = [new Date(2026, 4, 31), new Date(2026, 5, 29)]; 
    
    this.setupGridColumns();
    this.loadAttendanceReport();
    this.loadLeaveReport();
  }

  private setupGridColumns() {
    // 1. Attendance Report Columns (Aggregated per employee)
    this.attendanceColumns = [
      {
        headerName: 'EMPLOYEE',
        field: 'employeeName',
        width: 250,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const name = params.data?.employeeName || 'Unknown';
          const code = params.data?.employeeId || 'N/A';
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
        headerName: 'DEPARTMENT',
        field: 'departmentName',
        width: 180,
        sortable: true,
        cellRenderer: (params: any) => `<span style="color:var(--c-text-muted); font-size:13px;">${params.value || 'N/A'}</span>`
      },
      {
        headerName: 'TOTAL DAYS',
        field: 'totalDays',
        width: 120,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600;">${params.value || 0}</span>`
      },
      {
        headerName: 'PRESENT',
        field: 'present',
        width: 100,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; color:var(--c-status-green-text);">${params.value || 0}</span>`
      },
      {
        headerName: 'ABSENT',
        field: 'absent',
        width: 100,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; color:var(--c-status-red-text);">${params.value || 0}</span>`
      },
      {
        headerName: 'LATE',
        field: 'late',
        width: 100,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; color:var(--c-status-yellow-text);">${params.value || 0}</span>`
      },
      {
        headerName: 'WORK HRS',
        field: 'totalWorkHours',
        width: 120,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600;">${(params.value || 0).toFixed(1)}h</span>`
      },
      {
        headerName: 'ATTENDANCE %',
        field: 'attendancePercentage',
        width: 150,
        pinned: 'right',
        cellStyle: { 'text-align': 'right', 'padding-right': '1.5rem' },
        cellRenderer: (params: any) => {
          const val = params.value || 0;
          const color = val >= 90 ? 'var(--c-status-green-text)' : val < 75 ? 'var(--c-status-red-text)' : 'var(--c-status-yellow-text)';
          return `<span style="font-family:var(--font-heading); font-weight:700; font-size:16px; color:${color};">${val}%</span>`;
        }
      }
    ];

    // 2. Leave Liability Columns
    this.leaveColumns = [
      {
        headerName: 'EMPLOYEE',
        field: 'user.name',
        width: 250,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => `<span style="font-weight:600; color:var(--c-text-main); font-size:14px;">${params.value || 'Unknown'}</span>`
      },
      {
        headerName: 'DEPARTMENT',
        field: 'department.name',
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => `<span style="color:var(--c-text-muted); font-size:13px;">${params.value || 'N/A'}</span>`
      },
      {
        headerName: 'CL REMAINING',
        width: 140,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.casualLeave?.total || 0) - (params.data?.casualLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px;">${params.value}</span>`
      },
      {
        headerName: 'SL REMAINING',
        width: 140,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.sickLeave?.total || 0) - (params.data?.sickLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px; color:var(--c-status-red-text);">${params.value}</span>`
      },
      {
        headerName: 'EL REMAINING',
        width: 140,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.earnedLeave?.total || 0) - (params.data?.earnedLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px; color:var(--c-status-yellow-text);">${params.value}</span>`
      },
      {
        headerName: 'TOTAL LIABILITY',
        field: 'availableLeaves.total',
        width: 160,
        pinned: 'right',
        cellStyle: { 'text-align': 'right', 'padding-right': '1.5rem' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-heading); font-weight:700; font-size:18px; color:var(--c-text-main);">${params.value || 0}</span>`
      }
    ];
  }

  loadAttendanceReport() {
    if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
      this.messageService.showWarn('Please select a valid date range.');
      return;
    }

    this.isLoadingReport.set(true);

    const params = {
      fromDate: this.dateRange[0],
      toDate: this.dateRange[1],
      ...(this.selectedDept && { departmentId: this.selectedDept })
    };

    this.hrmsService.getAttendanceReport(params).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of({ data: { report: [], summary: null } });
      }),
      finalize(() => this.isLoadingReport.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.attendanceReportData.set(res?.data?.report || []);
      this.attendanceSummary.set(res?.data?.summary || null);
    });
  }

  loadLeaveReport() {
    this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
      catchError(() => of({ data: { report: [], summary: null } })), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.leaveReportData.set(res?.data?.report || []);
      this.leaveReportSummary.set(res?.data?.summary || null);
    });
  }

  onAttendanceGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.attendanceGridApi = event.api;
    }
  }

  onLeaveGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.leaveGridApi = event.api;
    }
  }

  onAttendanceSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if(this.attendanceGridApi) this.attendanceGridApi.setGridOption('quickFilterText', val);
  }

  onLeaveSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if(this.leaveGridApi) this.leaveGridApi.setGridOption('quickFilterText', val);
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
