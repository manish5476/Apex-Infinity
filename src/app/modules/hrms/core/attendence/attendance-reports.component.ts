import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { GridApi, GridReadyEvent } from 'ag-grid-community';

// PrimeNG & Shared Components
import { CardModule } from 'primeng/card';
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
// import { InputTextareaModule } from 'primeng/inputtextarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

import { AgShareGrid } from '../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    CardModule, 
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
    InputTextModule,
    AgShareGrid
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <div class="icon-brand flex-center bg-primary text-white border-radius-lg flex-shrink-0 shadow-md">
            <i class="pi pi-file-excel text-3xl"></i>
          </div>
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Advanced Reporting & Bulk Actions</h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Generate cross-department reports and override attendance statuses in bulk.</p>
          </div>
        </div>
      </header>

      <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0">
        <p-tabs value="0">
          
          <p-tablist>
            <p-tab value="0">
              <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                <i class="pi pi-calendar-times"></i> Attendance Report
              </div>
            </p-tab>
            <p-tab value="1">
              <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                <i class="pi pi-wallet"></i> Leave Liability Report
              </div>
            </p-tab>
          </p-tablist>

          <p-tabpanels styleClass="p-0">
            
            <p-tabpanel value="0">
              <div class="panel-content p-xl flex-col h-full">
                
                <div class="filter-bar bg-secondary p-xl border-radius-lg border-1 border-solid border-secondary mb-xl flex align-items-end gap-xl flex-wrap">
                  <div class="input-group flex-col gap-xs">
                    <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Date Range</label>
                    <p-datepicker 
                      [(ngModel)]="dateRange" 
                      selectionMode="range" 
                      [readonlyInput]="true" 
                      [showIcon]="true" 
                      placeholder="Select Range" 
                      appendTo="body"
                      styleClass="w-full">
                    </p-datepicker>
                  </div>
                  <div class="input-group flex-col gap-xs">
                    <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Department</label>
                    <p-select 
                      [options]="departments" 
                      [(ngModel)]="selectedDept" 
                      placeholder="All Departments" 
                      [showClear]="true" 
                      appendTo="body"
                      styleClass="w-full"
                      [filter]="true"
                      filterBy="label">
                    </p-select>

                  </div>
                  <p-button 
                    label="Generate Report" 
                    icon="pi pi-bolt" 
                    styleClass="p-button-primary" 
                    [loading]="isLoadingReport()" 
                    (onClick)="loadAttendanceReport()">
                  </p-button>
                </div>

                <div class="flex-between flex-wrap gap-md mb-md">
                  <h3 class="font-heading m-0 text-xl font-bold text-primary">Generated Results</h3>
                  <div class="flex align-items-center gap-md">
                    <p-iconField iconPosition="left">
                      <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                      <input type="text" pInputText placeholder="Search records..." (input)="onAttendanceSearch($event)" class="w-full sm:w-20rem" />
                    </p-iconField>

                    <p-button 
                      label="Bulk Update Status ({{ selectedRecords.length }})" 
                      icon="pi pi-pencil" 
                      severity="warn" 
                      [disabled]="selectedRecords.length === 0"
                      (onClick)="openBulkUpdateDialog()">
                    </p-button>
                  </div>
                </div>

                <div class="grid-wrapper border-radius-lg border-1 border-solid border-primary overflow-hidden w-full flex-grow-1" style="min-height: 550px;">
                  <app-ag-share-grid 
                    [columns]="attendanceColumns" 
                    [data]="attendanceReportData()" 
                    [showActions]="false"
                    rowSelection="multiple"
                    (gridEvent)="onAttendanceGridEvent($event)">
                  </app-ag-share-grid>
                </div>

              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="panel-content p-xl bg-secondary h-full flex-col">
                
                <div class="filter-bar glass-inset p-xl border-radius-lg border-1 border-solid border-secondary mb-xl flex align-items-end gap-xl flex-wrap">
                  <div class="input-group flex-col gap-xs">
                    <label class="info-label text-xs font-bold text-primary uppercase tracking-widest">Financial Year</label>
                    <p-select 
                      [options]="financialYears" 
                      [(ngModel)]="selectedFy" 
                      appendTo="body"
                      styleClass="w-full"
                      [filter]="true"
                      filterBy="label">
                    </p-select>

                  </div>
                  <p-button 
                    label="Fetch Liability Report" 
                    icon="pi pi-chart-pie" 
                    styleClass="p-button-primary" 
                    (onClick)="loadLeaveReport()">
                  </p-button>
                </div>

                @if (leaveReportSummary(); as summary) {
                  <div class="grid-2 mb-xl">
                    <div class="glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-primary">
                      <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Total Employees</span>
                      <div class="text-3xl font-heading font-bold text-primary mt-sm">{{ summary.totalEmployees }}</div>
                    </div>
                    <div class="glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-warning">
                      <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Total Enterprise Liability</span>
                      <div class="text-3xl font-heading font-bold color-warning mt-sm">{{ summary.totalLeaveBalance }} Days</div>
                    </div>
                  </div>
                }

                <div class="flex-between flex-wrap gap-md mb-md">
                  <h3 class="font-heading m-0 text-xl font-bold text-primary">Leave Balances</h3>
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                    <input type="text" pInputText placeholder="Search employees..." (input)="onLeaveSearch($event)" class="w-full sm:w-20rem" />
                  </p-iconField>
                </div>

                <div class="grid-wrapper border-radius-lg border-1 border-solid border-primary overflow-hidden w-full flex-grow-1" style="min-height: 450px;">
                  <app-ag-share-grid 
                    [columns]="leaveColumns" 
                    [data]="leaveReportData()" 
                    [showActions]="false"
                    (gridEvent)="onLeaveGridEvent($event)">
                  </app-ag-share-grid>
                </div>

              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </p-card>
    </div>

    <p-dialog 
      header="Bulk Update Attendance Status" 
      [(visible)]="displayBulkDialog" 
      [modal]="true" 
      [style]="{width: '500px'}" 
      [draggable]="false"
      styleClass="glass-panel border-radius-xl shadow-xl">
      
      <div class="flex align-items-start gap-md mb-xl p-md bg-secondary border-radius-md border-1 border-solid border-secondary">
        <i class="pi pi-info-circle text-primary text-xl mt-1"></i>
        <p class="m-0 text-sm text-secondary line-height-relaxed">You are about to override the daily status for <strong class="text-primary">{{ selectedRecords.length }}</strong> selected records.</p>
      </div>
      
      <form [formGroup]="bulkUpdateForm" class="flex-col gap-xl">
        <div class="input-group flex-col gap-xs">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Override Status <span class="text-error">*</span></label>
          <p-select 
            formControlName="status" 
            [options]="attendanceStatuses" 
            placeholder="Select New Status" 
            appendTo="body" 
            styleClass="w-full"
            [filter]="true"
            filterBy="label">
          </p-select>

        </div>
        <div class="input-group flex-col gap-xs">
          <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Admin Reason <span class="text-error">*</span></label>
          <textarea 
            pInputTextarea 
            formControlName="reason" 
            rows="3" 
            class="w-full" 
            placeholder="e.g. Office closed for maintenance">
          </textarea>
        </div>

        <div class="flex justify-content-end gap-md mt-xl pt-xl border-top-subtle">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
          <p-button 
            label="Apply to {{ selectedRecords.length }} Records" 
            icon="pi pi-check" 
            type="submit" 
            [disabled]="bulkUpdateForm.invalid" 
            [loading]="isProcessing()" 
            severity="warn" 
            (onClick)="submitBulkUpdate()">
          </p-button>
        </div>
      </form>
    </p-dialog>

    <p-drawer 
      [(visible)]="displayDetails" 
      position="right" 
      styleClass="glass-panel w-full md:w-30rem">
      
      <ng-template pTemplate="header">
        <h2 class="font-heading m-0 flex align-items-center gap-sm text-primary text-xl font-bold">
          <i class="pi pi-search-plus"></i> Daily Record Inspector
        </h2>
      </ng-template>
      
      <div class="p-xl h-full flex-col">
        @if (isInspecting()) {
          <div class="flex-col gap-xl">
            <p-skeleton width="100%" height="100px" borderRadius="12px"></p-skeleton>
            <p-skeleton width="100%" height="250px" borderRadius="12px"></p-skeleton>
          </div>
        } @else if (dailyDetails(); as details) {
          
          <div class="glass-inset p-xl border-radius-lg border-1 border-solid border-secondary flex-between mb-4xl">
            <div class="flex-col gap-xs">
              <span class="text-xs text-tertiary uppercase font-bold tracking-widest">{{ details.date | date:'EEEE, dd MMM yyyy' }}</span>
              <span class="font-heading font-bold text-2xl text-primary">{{ details.user?.name }}</span>
            </div>
            <p-tag [severity]="getStatusSeverity(details.status)" [value]="(details.status || 'UNKNOWN') | uppercase"></p-tag>
          </div>

          <div class="flex-col gap-xl mb-4xl">
            <h4 class="m-0 font-heading text-sm font-bold text-tertiary uppercase tracking-widest border-bottom-subtle pb-sm flex align-items-center gap-sm">
              <i class="pi pi-cog"></i> Calculation Engine Specs
            </h4>
            
            <div class="grid-2 gap-xl">
              <div class="flex-col gap-xs">
                <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Shift Expected</span>
                <span class="font-mono font-bold text-secondary">{{ details.scheduledInTime || '--:--' }} to {{ details.scheduledOutTime || '--:--' }}</span>
              </div>
              <div class="flex-col gap-xs">
                <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Multiplier Applied</span>
                <span class="font-mono font-bold text-secondary">{{ details.payoutMultiplier }}x</span>
              </div>
              <div class="flex-col gap-xs col-span-full">
                <span class="text-xs text-tertiary font-bold tracking-widest uppercase">System Flags Triggered</span>
                <div class="flex flex-wrap gap-sm mt-xs">
                  @if (details.isLate) { <p-tag severity="warn" value="Late In"></p-tag> }
                  @if (details.isEarlyDeparture) { <p-tag severity="warn" value="Early Out"></p-tag> }
                  @if (details.isOvertime) { <p-tag severity="success" value="Overtime"></p-tag> }
                  @if (details.isHalfDay) { <p-tag severity="info" value="Half Day"></p-tag> }
                  @if (!details.isLate && !details.isEarlyDeparture && !details.isOvertime && !details.isHalfDay) {
                    <span class="text-sm font-medium text-secondary">No flags triggered</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="bg-primary-light p-xl border-radius-lg border-1 border-solid border-primary mt-auto">
            <div class="flex-between mb-sm">
              <span class="text-md font-bold text-primary">Gross Work Hours</span>
              <span class="font-mono font-bold text-primary">{{ details.totalWorkHours }}h</span>
            </div>
            <div class="flex-between mb-md text-error">
              <span class="text-md font-bold">- Break Deductions</span>
              <span class="font-mono font-bold">{{ details.breakHours }}h</span>
            </div>
            <div class="border-top-primary my-md"></div>
            <div class="flex-between mt-md">
              <span class="font-heading text-lg font-bold text-primary">Net Payable Hours</span>
              <span class="font-mono font-bold text-2xl text-success">{{ details.netWorkHours }}h</span>
            </div>
          </div>
        }
      </div>
    </p-drawer>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
    .page-container { max-width: 1600px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; }
    .align-items-center { align-items: center; }
    .align-items-end { align-items: flex-end; }
    .align-items-start { align-items: flex-start; }
    .justify-content-end { justify-content: flex-end; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-grow-1 { flex-grow: 1; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .min-h-screen { min-height: 60vh; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .col-span-full { grid-column: 1 / -1; }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-xs { margin-top: var(--spacing-xs); }
    .mt-sm { margin-top: var(--spacing-sm); }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-xl { margin-top: var(--spacing-xl); }
    .mt-auto { margin-top: auto; }
    
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }
    .gap-xl { gap: var(--spacing-xl); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-md { font-size: var(--font-size-md); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-2xl { font-size: var(--font-size-2xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-relaxed { line-height: var(--line-height-relaxed); }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    .color-warning { color: var(--color-warning, #d97706); }
    .text-white { color: #ffffff; }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    .border-radius-full { border-radius: 9999px; }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-bottom-primary { border-bottom: 2px solid var(--border-primary); }
    .border-top-primary { border-top: 2px solid var(--color-primary); }
    .border-top-warning { border-top: 2px solid var(--color-warning); }
    
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Component specific */
    .icon-brand { width: 56px; height: 56px; }
    
    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    /* Responsive */
    @media (min-width: 640px) {
      .sm\\:w-20rem { width: 20rem; }
    }
    @media (max-width: 768px) {
      .page-container { padding: var(--spacing-xl); }
      .grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class AttendanceReportsComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // Filters
  dateRange: Date[] | null = null;
  departments = [{ label: 'Engineering', value: 'dept_eng' }, { label: 'Sales', value: 'dept_sales' }];
  selectedDept: string | null = null;
  financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
  selectedFy = '2024-2025';

  // AG Grid Instances
  private attendanceGridApi!: GridApi;
  private leaveGridApi!: GridApi;

  // Tab 0 Data (Attendance)
  isLoadingReport = signal(false);
  attendanceReportData = signal<any[]>([]);
  attendanceColumns: any[] = [];
  selectedRecords: any[] = [];
  
  // Bulk Edit
  displayBulkDialog = false;
  isProcessing = signal(false);
  bulkUpdateForm!: FormGroup;
  attendanceStatuses = [
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'On Duty', value: 'on_duty' },
    { label: 'Holiday', value: 'holiday' }
  ];

  // Tab 1 Data (Leave Liability)
  leaveReportData = signal<any[]>([]);
  leaveReportSummary = signal<any>(null);
  leaveColumns: any[] = [];

  // Sidebar Inspector
  displayDetails = false;
  isInspecting = signal(false);
  dailyDetails = signal<any>(null);

  ngOnInit() {
    this.bulkUpdateForm = this.fb.group({
      status: [null, Validators.required],
      reason: ['', Validators.required]
    });

    const date = new Date();
    this.dateRange = [new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0)];
    
    this.setupGridColumns();
    this.loadAttendanceReport();
    this.loadLeaveReport();
  }

  // ==========================================================================
  // AG GRID SETUP & RENDERING
  // ==========================================================================
  private setupGridColumns() {
    // 1. Attendance Report Columns
    this.attendanceColumns = [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        pinned: 'left'
      },
      {
        headerName: 'Date',
        field: 'date',
        width: 140,
        sortable: true,
        valueFormatter: (params: any) => this.datePipe.transform(params.value, 'dd MMM yyyy') || '',
        cellStyle: { 'font-weight': '500', 'color': 'var(--text-secondary)' }
      },
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
        headerName: 'In / Out',
        width: 160,
        cellRenderer: (params: any) => {
          const firstIn = params.data?.firstIn ? this.datePipe.transform(params.data.firstIn, 'HH:mm') : '--:--';
          const lastOut = params.data?.lastOut ? this.datePipe.transform(params.data.lastOut, 'HH:mm') : '--:--';
          return `<span style="font-family:var(--font-mono); font-size:13px; color:var(--text-secondary);">${firstIn} - ${lastOut}</span>`;
        }
      },
      {
        headerName: 'Hrs',
        field: 'netWorkHours',
        width: 100,
        cellStyle: { 'text-align': 'center' },
        cellRenderer: (params: any) => {
          const hrs = params.value || 0;
          const color = hrs === 0 ? 'var(--color-error)' : 'var(--text-primary)';
          return `<span style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:${color};">${hrs.toFixed(1)}</span>`;
        }
      },
      {
        headerName: 'Status',
        field: 'status',
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => {
          const status = (params.value || 'UNKNOWN').toUpperCase();
          const severity = this.getStatusSeverity(params.value);
          
          let bg = 'var(--bg-secondary)', color = 'var(--text-secondary)', border = 'var(--border-secondary)';
          if(severity === 'success') { bg = 'var(--color-success-bg, #ecfdf5)'; color = 'var(--color-success, #16a34a)'; border = 'color-mix(in srgb, var(--color-success) 30%, transparent)'; }
          if(severity === 'danger') { bg = 'var(--color-error-bg, #fef2f2)'; color = 'var(--color-error, #dc2626)'; border = 'color-mix(in srgb, var(--color-error) 30%, transparent)'; }
          if(severity === 'warn') { bg = 'color-mix(in srgb, var(--color-warning) 10%, transparent)'; color = 'var(--color-warning)'; border = 'color-mix(in srgb, var(--color-warning) 30%, transparent)'; }

          return `
            <div style="display:flex; align-items:center; height:100%;">
              <span style="display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; line-height:1; background-color:${bg}; color:${color}; border:1px solid ${border}; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px;">
                ${status}
              </span>
            </div>`;
        }
      },
      {
        headerName: 'Action',
        colId: 'action',
        width: 100,
        pinned: 'right',
        cellStyle: { 'text-align': 'right', 'padding-right': '1rem' },
        cellRenderer: () => {
          // Using a simple icon wrapper. Will be caught via cellClicked event
          return `
            <div style="display:flex; align-items:center; justify-content:flex-end; height:100%; cursor:pointer;">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--bg-secondary); color:var(--text-secondary); display:flex; align-items:center; justify-content:center; border:1px solid var(--border-secondary);">
                <i class="pi pi-search" style="font-size:12px;"></i>
              </div>
            </div>`;
        }
      }
    ];

    // 2. Leave Liability Columns
    this.leaveColumns = [
      {
        headerName: 'Employee',
        field: 'user.name',
        width: 250,
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          return `<span style="font-weight:700; color:var(--text-primary); font-size:13px;">${name}</span>`;
        }
      },
      {
        headerName: 'Department',
        field: 'department.name',
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => `<span style="color:var(--text-secondary); font-size:13px;">${params.value || 'N/A'}</span>`
      },
      {
        headerName: 'CL Rem.',
        width: 120,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.casualLeave?.total || 0) - (params.data?.casualLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px;">${params.value}</span>`
      },
      {
        headerName: 'SL Rem.',
        width: 120,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.sickLeave?.total || 0) - (params.data?.sickLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px; color:var(--color-error);">${params.value}</span>`
      },
      {
        headerName: 'EL Rem.',
        width: 120,
        cellStyle: { 'text-align': 'center' },
        valueGetter: (params: any) => (params.data?.earnedLeave?.total || 0) - (params.data?.earnedLeave?.used || 0),
        cellRenderer: (params: any) => `<span style="font-family:var(--font-mono); font-weight:600; font-size:14px; color:var(--color-warning);">${params.value}</span>`
      },
      {
        headerName: 'Total Liability',
        field: 'availableLeaves.total',
        width: 150,
        pinned: 'right',
        cellStyle: { 'text-align': 'right', 'padding-right': '1.5rem' },
        cellRenderer: (params: any) => `<span style="font-family:var(--font-heading); font-weight:700; font-size:18px; color:var(--color-primary);">${params.value || 0}</span>`
      }
    ];
  }

  // ==========================================================================
  // API & ACTIONS
  // ==========================================================================
  loadAttendanceReport() {
    if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
      this.messageService.showWarn('Please select a valid date range.');
      return;
    }

    this.isLoadingReport.set(true);
    this.selectedRecords = [];

    const params = {
      fromDate: this.dateRange[0],
      toDate: this.dateRange[1],
      ...(this.selectedDept && { departmentId: this.selectedDept })
    };

    this.hrmsService.getAttendanceReport(params).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of({ data: [] });
      }),
      finalize(() => this.isLoadingReport.set(false))
    ).subscribe((res: any) => {
      this.attendanceReportData.set(res?.data || []);
    });
  }

  loadLeaveReport() {
    this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
      catchError(() => of({ data: { report: [], summary: null } }))
    ).subscribe((res: any) => {
      this.leaveReportData.set(res?.data?.report || []);
      this.leaveReportSummary.set(res?.data?.summary || null);
    });
  }

  // Grid Events
  onAttendanceGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.attendanceGridApi = event.api;
    } else if (event.type === 'selectionChanged') {
      this.selectedRecords = this.attendanceGridApi.getSelectedRows();
    } else if (event.type === 'cellClicked' && event.colId === 'action') {
      this.inspectDailyRecord(event.row._id);
    }
  }

  onLeaveGridEvent(event: any) {
    if (event.type === 'gridReady') {
      this.leaveGridApi = event.api;
    }
  }

  // Quick Filters
  onAttendanceSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if(this.attendanceGridApi) this.attendanceGridApi.setGridOption('quickFilterText', val);
  }

  onLeaveSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if(this.leaveGridApi) this.leaveGridApi.setGridOption('quickFilterText', val);
  }

  // Bulk Actions
  openBulkUpdateDialog() {
    this.bulkUpdateForm.reset();
    this.displayBulkDialog = true;
  }

  submitBulkUpdate() {
    if (this.bulkUpdateForm.invalid || this.selectedRecords.length === 0) return;
    
    this.isProcessing.set(true);
    const formVal = this.bulkUpdateForm.value;
    
    const updates = this.selectedRecords.map(rec => ({
      recordId: rec._id,
      status: formVal.status,
      reason: formVal.reason
    }));

    this.hrmsService.bulkUpdateAttendance(updates).pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.isProcessing.set(false);
        this.displayBulkDialog = false;
      })
    ).subscribe(res => {
      if (res) {
        this.loadAttendanceReport(); 
      }
    });
  }

  // Inspection
  inspectDailyRecord(id: string) {
    this.displayDetails = true;
    this.isInspecting.set(true);
    
    this.hrmsService.getDailyAttendance(id).pipe(
      catchError(() => {
        this.displayDetails = false;
        return of(null);
      }),
      finalize(() => this.isInspecting.set(false))
    ).subscribe((res: any) => {
      if (res?.data?.daily) {
        this.dailyDetails.set(res.data.daily);
      }
    });
  }

  // Helpers
  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    switch (status) {
      case 'present': case 'on_duty': return 'success';
      case 'absent': return 'danger';
      case 'late': case 'half_day': return 'warn';
      default: return 'secondary';
    }
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// import { catchError, finalize } from 'rxjs/operators';
// import { of } from 'rxjs';

// // Services
// import { MessageService, ConfirmationService } from 'primeng/api';
// import { AppMessageService } from '@core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { DialogModule } from 'primeng/dialog';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { TabsModule } from 'primeng/tabs';
// import { AvatarModule } from 'primeng/avatar';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DrawerModule } from 'primeng/drawer';
// import { ToastModule } from 'primeng/toast';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';

// @Component({
//   selector: 'app-attendance-reports',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule, 
//     FormsModule,
//     CardModule, 
//     TableModule, 
//     ButtonModule,
//     TagModule, 
//     SelectModule, 
//     DatePickerModule, 
//     DrawerModule, 
//     DialogModule,
//     SkeletonModule, 
//     TooltipModule, 
//     TabsModule, 
//     AvatarModule,
//     ToastModule,
//     InputTextModule,
//     IconFieldModule,
//     InputIconModule,
//     InputTextModule
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>

//     <div class="page-container fade-in">
      
//       <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
//         <div class="flex align-items-center gap-xl">
//           <div class="icon-brand flex-center bg-primary text-white border-radius-lg flex-shrink-0 shadow-md">
//             <i class="pi pi-file-excel text-3xl"></i>
//           </div>
//           <div class="header-titles flex-col gap-xs">
//             <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Advanced Reporting & Bulk Actions</h1>
//             <p class="subtitle text-secondary text-md m-0 max-w-prose">Generate cross-department reports and override attendance statuses in bulk.</p>
//           </div>
//         </div>
//       </header>

//       <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0">
//         <p-tabs value="0">
          
//           <p-tablist>
//             <p-tab value="0">
//               <div class="flex align-items-center gap-sm font-medium px-md py-sm">
//                 <i class="pi pi-calendar-times"></i> Attendance Report
//               </div>
//             </p-tab>
//             <p-tab value="1">
//               <div class="flex align-items-center gap-sm font-medium px-md py-sm">
//                 <i class="pi pi-wallet"></i> Leave Liability Report
//               </div>
//             </p-tab>
//           </p-tablist>

//           <p-tabpanels styleClass="p-0">
            
//             <p-tabpanel value="0">
//               <div class="panel-content p-xl">
                
//                 <div class="filter-bar bg-secondary p-xl border-radius-lg border-1 border-solid border-secondary mb-4xl flex align-items-end gap-xl flex-wrap">
//                   <div class="input-group flex-col gap-xs">
//                     <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Date Range</label>
//                     <p-datepicker 
//                       [(ngModel)]="dateRange" 
//                       selectionMode="range" 
//                       [readonlyInput]="true" 
//                       [showIcon]="true" 
//                       placeholder="Select Range" 
//                       appendTo="body"
//                       styleClass="w-full">
//                     </p-datepicker>
//                   </div>
//                   <div class="input-group flex-col gap-xs">
//                     <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Department</label>
//                     <p-select 
//                       [options]="departments" 
//                       [(ngModel)]="selectedDept" 
//                       placeholder="All Departments" 
//                       [showClear]="true" 
//                       appendTo="body"
//                       styleClass="w-full">
//                     </p-select>
//                   </div>
//                   <p-button 
//                     label="Generate Report" 
//                     icon="pi pi-bolt" 
//                     styleClass="p-button-primary" 
//                     [loading]="isLoadingReport()" 
//                     (onClick)="loadAttendanceReport()">
//                   </p-button>
//                 </div>

//                 <div class="flex-between flex-wrap gap-md mb-lg">
//                   <h3 class="font-heading m-0 text-xl font-bold text-primary">Generated Results</h3>
//                   <div class="flex align-items-center gap-md">
//                     <p-button 
//                       label="Bulk Update Status ({{ selectedRecords.length }})" 
//                       icon="pi pi-pencil" 
//                       severity="warn" 
//                       [disabled]="selectedRecords.length === 0"
//                       (onClick)="openBulkUpdateDialog()">
//                     </p-button>
//                   </div>
//                 </div>

//                 <div class="border-radius-xl border-1 border-solid border-primary overflow-hidden shadow-sm">
//                   <p-table 
//                     [value]="attendanceReportData()" 
//                     [(selection)]="selectedRecords" 
//                     dataKey="_id"
//                     [paginator]="true" 
//                     [rows]="10" 
//                     responsiveLayout="scroll"
//                     styleClass="w-full p-datatable-sm">
                    
//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th class="bg-primary border-bottom-primary px-lg py-md" style="width: 4rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary">Date</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary">Employee</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary">In / Out</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary text-center">Calculated Hrs</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary">Status</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-lg py-md border-bottom-primary text-right">Inspection</th>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="body" let-record>
//                       <tr class="hover-bg-secondary transition-colors">
//                         <td class="px-lg py-md border-bottom-subtle"><p-tableCheckbox [value]="record"></p-tableCheckbox></td>
//                         <td class="px-lg py-md border-bottom-subtle font-medium text-secondary">{{ record.date | date:'dd MMM yyyy' }}</td>
//                         <td class="px-lg py-md border-bottom-subtle">
//                           <div class="flex-col gap-xs">
//                             <span class="font-bold text-primary">{{ record.user?.name || 'Unknown' }}</span>
//                             <span class="text-xs font-mono text-secondary">{{ record.user?.employeeProfile?.employeeId || record.user?._id | slice:0:8 }}</span>
//                           </div>
//                         </td>
//                         <td class="px-lg py-md border-bottom-subtle font-mono text-sm text-secondary">
//                           {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }} - {{ record.lastOut ? (record.lastOut | date:'HH:mm') : '--:--' }}
//                         </td>
//                         <td class="px-lg py-md border-bottom-subtle text-center font-heading font-bold text-lg" [ngClass]="{'text-error': record.totalWorkHours === 0}">
//                           {{ record.netWorkHours | number:'1.1-1' }}
//                         </td>
//                         <td class="px-lg py-md border-bottom-subtle">
//                           <p-tag [severity]="getStatusSeverity(record.status)" [value]="(record.status || 'UNKNOWN') | uppercase"></p-tag>
//                         </td>
//                         <td class="px-lg py-md border-bottom-subtle text-right">
//                           <p-button icon="pi pi-search" [text]="true" [rounded]="true" severity="secondary" pTooltip="Deep Dive" (onClick)="inspectDailyRecord(record._id)"></p-button>
//                         </td>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="emptymessage">
//                       <tr>
//                         <td colspan="7" class="text-center py-5xl text-secondary">
//                           <div class="flex-col flex-center">
//                             <i class="pi pi-file-excel text-4xl text-tertiary mb-md"></i>
//                             <span class="font-medium">Use the filters above to generate an attendance report.</span>
//                           </div>
//                         </td>
//                       </tr>
//                     </ng-template>
//                   </p-table>
//                 </div>
//               </div>
//             </p-tabpanel>

//             <p-tabpanel value="1">
//               <div class="panel-content p-xl bg-secondary min-h-screen">
                
//                 <div class="filter-bar glass-inset p-xl border-radius-lg border-1 border-solid border-secondary mb-4xl flex align-items-end gap-xl flex-wrap">
//                   <div class="input-group flex-col gap-xs">
//                     <label class="info-label text-xs font-bold text-primary uppercase tracking-widest">Financial Year</label>
//                     <p-select 
//                       [options]="financialYears" 
//                       [(ngModel)]="selectedFy" 
//                       appendTo="body"
//                       styleClass="w-full">
//                     </p-select>
//                   </div>
//                   <p-button 
//                     label="Fetch Liability Report" 
//                     icon="pi pi-chart-pie" 
//                     styleClass="p-button-primary" 
//                     (onClick)="loadLeaveReport()">
//                   </p-button>
//                 </div>

//                 <div class="border-radius-xl border-1 border-solid border-primary overflow-hidden shadow-sm">
//                   <p-table 
//                     [value]="leaveReportData()" 
//                     [paginator]="true" 
//                     [rows]="10" 
//                     styleClass="w-full p-datatable-sm">
                    
//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Employee</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Department</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-center">CL Remaining</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-center">SL Remaining</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-center">EL Remaining</th>
//                         <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-right">Total Liability (Days)</th>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="body" let-bal>
//                       <tr class="hover-bg-secondary transition-colors">
//                         <td class="px-xl py-md border-bottom-subtle font-bold text-primary">{{ bal.user?.name }}</td>
//                         <td class="px-xl py-md border-bottom-subtle text-secondary">{{ bal.department?.name || 'N/A' }}</td>
//                         <td class="px-xl py-md border-bottom-subtle text-center font-mono font-medium">{{ bal.casualLeave?.total - bal.casualLeave?.used }}</td>
//                         <td class="px-xl py-md border-bottom-subtle text-center font-mono font-medium text-error">{{ bal.sickLeave?.total - bal.sickLeave?.used }}</td>
//                         <td class="px-xl py-md border-bottom-subtle text-center font-mono font-medium color-warning">{{ bal.earnedLeave?.total - bal.earnedLeave?.used }}</td>
//                         <td class="px-xl py-md border-bottom-subtle text-right font-heading font-bold text-xl text-primary">{{ bal.availableLeaves?.total || 0 }}</td>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="emptymessage">
//                       <tr>
//                         <td colspan="6" class="text-center py-5xl text-secondary">
//                           <div class="flex-col flex-center">
//                             <i class="pi pi-wallet text-4xl text-tertiary mb-md"></i>
//                             <span class="font-medium">No leave balance data generated.</span>
//                           </div>
//                         </td>
//                       </tr>
//                     </ng-template>
//                   </p-table>
//                 </div>
//               </div>
//             </p-tabpanel>

//           </p-tabpanels>
//         </p-tabs>
//       </p-card>
//     </div>

//     <p-dialog 
//       header="Bulk Update Attendance Status" 
//       [(visible)]="displayBulkDialog" 
//       [modal]="true" 
//       [style]="{width: '500px'}" 
//       [draggable]="false"
//       styleClass="glass-panel border-radius-xl shadow-xl">
      
//       <div class="flex align-items-start gap-md mb-xl p-md bg-secondary border-radius-md border-1 border-solid border-secondary">
//         <i class="pi pi-info-circle text-primary text-xl mt-1"></i>
//         <p class="m-0 text-sm text-secondary line-height-relaxed">You are about to override the daily status for <strong class="text-primary">{{ selectedRecords.length }}</strong> selected records.</p>
//       </div>
      
//       <form [formGroup]="bulkUpdateForm" class="flex-col gap-xl">
//         <div class="input-group flex-col gap-xs">
//           <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Override Status <span class="text-error">*</span></label>
//           <p-select 
//             formControlName="status" 
//             [options]="attendanceStatuses" 
//             placeholder="Select New Status" 
//             appendTo="body" 
//             styleClass="w-full">
//           </p-select>
//         </div>
//         <div class="input-group flex-col gap-xs">
//           <label class="info-label text-xs font-bold text-tertiary uppercase tracking-widest">Admin Reason <span class="text-error">*</span></label>
//           <textarea 
//             pInputTextarea 
//             formControlName="reason" 
//             rows="3" 
//             class="w-full" 
//             placeholder="e.g. Office closed for maintenance">
//           </textarea>
//         </div>

//         <div class="flex justify-content-end gap-md mt-xl pt-xl border-top-subtle">
//           <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
//           <p-button 
//             label="Apply to {{ selectedRecords.length }} Records" 
//             icon="pi pi-check" 
//             type="submit" 
//             [disabled]="bulkUpdateForm.invalid" 
//             [loading]="isProcessing()" 
//             severity="warn" 
//             (onClick)="submitBulkUpdate()">
//           </p-button>
//         </div>
//       </form>
//     </p-dialog>

//     <p-drawer 
//       [(visible)]="displayDetails" 
//       position="right" 
//       styleClass="glass-panel w-full md:w-30rem">
      
//       <ng-template pTemplate="header">
//         <h2 class="font-heading m-0 flex align-items-center gap-sm text-primary text-xl font-bold">
//           <i class="pi pi-search-plus"></i> Daily Record Inspector
//         </h2>
//       </ng-template>
      
//       <div class="p-xl h-full flex-col">
//         @if (isInspecting()) {
//           <div class="flex-col gap-xl">
//             <p-skeleton width="100%" height="100px" borderRadius="12px"></p-skeleton>
//             <p-skeleton width="100%" height="250px" borderRadius="12px"></p-skeleton>
//           </div>
//         } @else if (dailyDetails(); as details) {
          
//           <div class="glass-inset p-xl border-radius-lg border-1 border-solid border-secondary flex-between mb-4xl">
//             <div class="flex-col gap-xs">
//               <span class="text-xs text-tertiary uppercase font-bold tracking-widest">{{ details.date | date:'EEEE, dd MMM yyyy' }}</span>
//               <span class="font-heading font-bold text-2xl text-primary">{{ details.user?.name }}</span>
//             </div>
//             <p-tag [severity]="getStatusSeverity(details.status)" [value]="(details.status || 'UNKNOWN') | uppercase"></p-tag>
//           </div>

//           <div class="flex-col gap-xl mb-4xl">
//             <h4 class="m-0 font-heading text-sm font-bold text-tertiary uppercase tracking-widest border-bottom-subtle pb-sm flex align-items-center gap-sm">
//               <i class="pi pi-cog"></i> Calculation Engine Specs
//             </h4>
            
//             <div class="grid-2 gap-xl">
//               <div class="flex-col gap-xs">
//                 <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Shift Expected</span>
//                 <span class="font-mono font-bold text-secondary">{{ details.scheduledInTime || '--:--' }} to {{ details.scheduledOutTime || '--:--' }}</span>
//               </div>
//               <div class="flex-col gap-xs">
//                 <span class="text-xs text-tertiary font-bold tracking-widest uppercase">Multiplier Applied</span>
//                 <span class="font-mono font-bold text-secondary">{{ details.payoutMultiplier }}x</span>
//               </div>
//               <div class="flex-col gap-xs col-span-full">
//                 <span class="text-xs text-tertiary font-bold tracking-widest uppercase">System Flags Triggered</span>
//                 <div class="flex flex-wrap gap-sm mt-xs">
//                   @if (details.isLate) { <p-tag severity="warn" value="Late In"></p-tag> }
//                   @if (details.isEarlyDeparture) { <p-tag severity="warn" value="Early Out"></p-tag> }
//                   @if (details.isOvertime) { <p-tag severity="success" value="Overtime"></p-tag> }
//                   @if (details.isHalfDay) { <p-tag severity="info" value="Half Day"></p-tag> }
//                   @if (!details.isLate && !details.isEarlyDeparture && !details.isOvertime && !details.isHalfDay) {
//                     <span class="text-sm font-medium text-secondary">No flags triggered</span>
//                   }
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="bg-primary-light p-xl border-radius-lg border-1 border-solid border-primary mt-auto">
//             <div class="flex-between mb-sm">
//               <span class="text-md font-bold text-primary">Gross Work Hours</span>
//               <span class="font-mono font-bold text-primary">{{ details.totalWorkHours }}h</span>
//             </div>
//             <div class="flex-between mb-md text-error">
//               <span class="text-md font-bold">- Break Deductions</span>
//               <span class="font-mono font-bold">{{ details.breakHours }}h</span>
//             </div>
//             <div class="border-top-primary my-md"></div>
//             <div class="flex-between mt-md">
//               <span class="font-heading text-lg font-bold text-primary">Net Payable Hours</span>
//               <span class="font-mono font-bold text-2xl text-success">{{ details.netWorkHours }}h</span>
//             </div>
//           </div>
//         }
//       </div>
//     </p-drawer>
//   `,
//   styles: [`
//     /* ==========================================================================
//        BASE & LAYOUT UTILITIES
//        ========================================================================== */
//     :host { display: block; font-family: var(--font-body); color: var(--text-primary); min-height: 100vh; background-color: var(--bg-secondary); }
    
//     .page-container { max-width: 1600px; margin: 0 auto; padding: var(--spacing-2xl) var(--spacing-xl); }
    
//     .flex { display: flex; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-center { display: flex; align-items: center; justify-content: center; }
//     .flex-wrap { display: flex; flex-wrap: wrap; }
//     .align-items-center { align-items: center; }
//     .align-items-end { align-items: flex-end; }
//     .align-items-start { align-items: flex-start; }
//     .justify-content-end { justify-content: flex-end; }
//     .flex-shrink-0 { flex-shrink: 0; }
    
//     .w-full { width: 100%; }
//     .w-max-content { width: max-content; }
//     .h-full { height: 100%; }
//     .min-h-screen { min-height: 60vh; }
    
//     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
//     .col-span-full { grid-column: 1 / -1; }

//     /* Spacing */
//     .m-0 { margin: 0 !important; }
//     .p-0 { padding: 0 !important; }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .mb-lg { margin-bottom: var(--spacing-lg); }
//     .mb-xl { margin-bottom: var(--spacing-xl); }
//     .mb-4xl { margin-bottom: var(--spacing-4xl); }
//     .mt-1 { margin-top: 4px; }
//     .mt-xs { margin-top: var(--spacing-xs); }
//     .mt-md { margin-top: var(--spacing-md); }
//     .mt-xl { margin-top: var(--spacing-xl); }
//     .mt-auto { margin-top: auto; }
    
//     .p-md { padding: var(--spacing-md); }
//     .p-xl { padding: var(--spacing-xl); }
//     .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
//     .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
//     .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
//     .px-lg { padding-left: var(--spacing-lg); padding-right: var(--spacing-lg); }
//     .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
//     .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
//     .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
//     .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
//     .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-xl { gap: var(--spacing-xl); }

//     /* Typography & Colors */
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-medium { font-weight: var(--font-weight-medium); }
//     .font-bold { font-weight: var(--font-weight-bold); }
    
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-md { font-size: var(--font-size-md); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-xl { font-size: var(--font-size-xl); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-3xl { font-size: var(--font-size-3xl); }
//     .text-4xl { font-size: 2.5rem; }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .uppercase { text-transform: uppercase; }
//     .tracking-widest { letter-spacing: 0.05em; }
//     .line-height-tight { line-height: var(--line-height-tight); }
//     .line-height-relaxed { line-height: var(--line-height-relaxed); }
//     .max-w-prose { max-width: 65ch; }

//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-success { color: var(--color-success, #16a34a); }
//     .text-error { color: var(--color-error, #dc2626); }
//     .color-warning { color: var(--color-warning, #d97706); }
//     .text-info { color: #0ea5e9; }
//     .text-white { color: #ffffff; }
    
//     .bg-primary { background: var(--bg-primary); }
//     .bg-secondary { background: var(--bg-secondary); }
//     .bg-primary-light { background: var(--color-primary-bg); }

//     /* Borders & Glassmorphism */
//     .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
//     .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
//     .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
//     .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
//     .border-radius-xl { border-radius: var(--radius-2xl); }
//     .border-radius-full { border-radius: 9999px; }
    
//     .border-top-subtle { border-top: 1px solid var(--border-secondary); }
//     .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
//     .border-bottom-primary { border-bottom: 2px solid var(--border-primary); }
//     .border-top-primary { border-top: 2px solid var(--border-primary); }
//     .border-1 { border-width: 1px; }
//     .border-solid { border-style: solid; }
//     .border-primary { border-color: var(--border-primary); }
//     .border-secondary { border-color: var(--border-secondary); }
    
//     .shadow-sm { box-shadow: var(--shadow-sm); }
//     .shadow-md { box-shadow: var(--shadow-md); }
//     .shadow-xl { box-shadow: var(--shadow-xl); }
//     .overflow-hidden { overflow: hidden; }

//     /* Component specific */
//     .icon-brand { width: 56px; height: 56px; }
    
//     /* Interactive States (No ng-deep needed) */
//     .hover-bg-secondary:hover { background-color: var(--bg-secondary) !important; transition: background-color 0.2s ease; }
//     .transition-colors { transition: background-color 0.2s ease; }
    
//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

//     /* Responsive */
//     @media (min-width: 640px) {
//       .sm\\:w-20rem { width: 20rem; }
//     }
//     @media (max-width: 768px) {
//       .page-container { padding: var(--spacing-xl); }
//       .header-actions { margin-top: var(--spacing-md); width: 100%; justify-content: flex-start; }
//     }
//   `]
// })
// export class AttendanceReportsComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private fb = inject(FormBuilder);

//   // Filters
//   dateRange: Date[] | null = null;
//   departments = [{ label: 'Engineering', value: 'dept_eng' }, { label: 'Sales', value: 'dept_sales' }];
//   selectedDept: string | null = null;
//   financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
//   selectedFy = '2024-2025';

//   // Tab 0 Data
//   isLoadingReport = signal(false);
//   attendanceReportData = signal<any[]>([]);
//   selectedRecords: any[] = [];
  
//   // Bulk Edit
//   displayBulkDialog = false;
//   isProcessing = signal(false);
//   bulkUpdateForm!: FormGroup;
//   attendanceStatuses = [
//     { label: 'Present', value: 'present' },
//     { label: 'Absent', value: 'absent' },
//     { label: 'Half Day', value: 'half_day' },
//     { label: 'On Duty (Site Visit)', value: 'on_duty' },
//     { label: 'Holiday', value: 'holiday' }
//   ];

//   // Tab 1 Data
// // Tab 1 Data
//   leaveReportData = signal<any[]>([]);
//   leaveReportSummary = signal<any>(null); // <-- Add this to catch the summary object
//   // Sidebar Inspector
//   displayDetails = false;
//   isInspecting = signal(false);
//   dailyDetails = signal<any>(null);

//   ngOnInit() {
//     this.bulkUpdateForm = this.fb.group({
//       status: [null, Validators.required],
//       reason: ['', Validators.required]
//     });

//     const date = new Date();
//     this.dateRange = [new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0)];
    
//     this.loadAttendanceReport();
//     this.loadLeaveReport();
//   }

//   loadAttendanceReport() {
//     if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
//       this.messageService.showWarn('Please select a valid date range.');
//       return;
//     }

//     this.isLoadingReport.set(true);
//     this.selectedRecords = [];

//     const params = {
//       fromDate: this.dateRange[0],
//       toDate: this.dateRange[1],
//       ...(this.selectedDept && { departmentId: this.selectedDept })
//     };

//     this.hrmsService.getAttendanceReport(params).pipe(
//       catchError((err) => {
//         this.messageService.handleHttpError(err)
//         return of({ data: [] });
//       }),
//       finalize(() => this.isLoadingReport.set(false))
//     ).subscribe((res: any) => {
//       this.attendanceReportData.set(res?.data || []);
//     });
//   }

//   openBulkUpdateDialog() {
//     this.bulkUpdateForm.reset();
//     this.displayBulkDialog = true;
//   }

//   submitBulkUpdate() {
//     if (this.bulkUpdateForm.invalid || this.selectedRecords.length === 0) return;
    
//     this.isProcessing.set(true);
//     const formVal = this.bulkUpdateForm.value;
    
//     const updates = this.selectedRecords.map(rec => ({
//       recordId: rec._id,
//       status: formVal.status,
//       reason: formVal.reason
//     }));

//     this.hrmsService.bulkUpdateAttendance(updates).pipe(
//       catchError(() => {
//         return of(null);
//       }),
//       finalize(() => {
//         this.isProcessing.set(false);
//         this.displayBulkDialog = false;
//       })
//     ).subscribe(res => {
//       if (res) {
//         this.loadAttendanceReport(); 
//       }
//     });
//   }

//   inspectDailyRecord(id: string) {
//     this.displayDetails = true;
//     this.isInspecting.set(true);
    
//     this.hrmsService.getDailyAttendance(id).pipe(
//       catchError(() => {
//         this.displayDetails = false;
//         return of(null);
//       }),
//       finalize(() => this.isInspecting.set(false))
//     ).subscribe((res: any) => {
//       if (res?.data?.daily) {
//         this.dailyDetails.set(res.data.daily);
//       }
//     });
//   }

// loadLeaveReport() {
//     this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
//       catchError(() => of({ data: { report: [], summary: null } }))
//     ).subscribe((res: any) => {
      
//       this.leaveReportData.set(res?.data?.report || []);
//       this.leaveReportSummary.set(res?.data?.summary || null);
      
//     });
//   }

//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
//     switch (status) {
//       case 'present': case 'on_duty': return 'success';
//       case 'absent': return 'danger';
//       case 'late': case 'half_day': return 'warn';
//       default: return 'secondary';
//     }
//   }
// }

// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { catchError, finalize } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // Services
// // import { MessageService, ConfirmationService } from 'primeng/api';

// // // PrimeNG
// // import { CardModule } from 'primeng/card';
// // import { TableModule } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { DialogModule,  } from 'primeng/dialog';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { TabsModule } from 'primeng/tabs';
// // import { AvatarModule } from 'primeng/avatar';
// // import { SelectModule } from 'primeng/select';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { DrawerModule } from 'primeng/drawer';
// // import { HRMSService } from '../../hrms.service';
// // import { AppMessageService } from '@core/services/message.service';
// // @Component({
// //   selector: 'app-attendance-reports',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonModule,
// //     TagModule, SelectModule, DatePickerModule, DrawerModule, DialogModule,
// //     SkeletonModule, TooltipModule, TabsModule, AvatarModule,FormsModule
// //   ],
// //   providers: [MessageService, ConfirmationService],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <div class="page-wrapper fade-in">
// //       <header class="dashboard-header slide-down mb-4">
// //         <div class="header-left">
// //           <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-file-excel"></i></div>
// //           <div class="header-titles">
// //             <h1 class="page-title m-0">Advanced Reporting & Bulk Actions</h1>
// //             <p class="page-subtitle mt-1">Generate cross-department reports and override attendance statuses in bulk.</p>
// //           </div>
// //         </div>
// //       </header>

// //       <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
// //         <p-tabs value="0">
// //           <p-tablist styleClass="hub-tablist">
// //             <p-tab value="0"><div class="tab-label"><i class="pi pi-datepicker-times"></i> Attendance Report</div></p-tab>
// //             <p-tab value="1"><div class="tab-label"><i class="pi pi-wallet"></i> Leave Liability Report</div></p-tab>
// //           </p-tablist>

// //           <p-tabpanels styleClass="hub-tabpanels p-0">
            
// //             <p-tabpanel value="0">
// //               <div class="panel-inner p-4">
                
// //                 <div class="filter-bar bg-surface p-3 border-radius-md border-1 surface-border mb-4 flex-align gap-4 flex-wrap">
// //                   <div class="input-group">
// //                     <label class="info-label">Date Range</label>
// //                     <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" [showIcon]="true" placeholder="Select Range" styleClass="premium-datepicker"></p-datepicker>
// //                   </div>
// //                   <div class="input-group">
// //                     <label class="info-label">Department</label>
// //                     <p-select [options]="departments" [(ngModel)]="selectedDept" placeholder="All Departments" [showClear]="true" styleClass="premium-select"></p-select>
// //                   </div>
// //                   <p-button label="Generate Report" icon="pi pi-bolt" styleClass="p-button-primary mt-auto" [loading]="isLoadingReport()" (onClick)="loadAttendanceReport()"></p-button>
// //                 </div>

// //                 <div class="flex-between mb-3">
// //                   <h3 class="font-heading m-0 text-primary-color">Generated Results</h3>
// //                   <div class="flex-align gap-2">
// //                     <p-button 
// //                       label="Bulk Update Status ({{ selectedRecords.length }})" 
// //                       icon="pi pi-pencil" 
// //                       severity="warn" 
// //                       [disabled]="selectedRecords.length === 0"
// //                       (onClick)="openBulkUpdateDialog()">
// //                     </p-button>
// //                   </div>
// //                 </div>

// //                 <p-table 
// //                   [value]="attendanceReportData()" 
// //                   [(selection)]="selectedRecords" 
// //                   dataKey="_id"
// //                   [paginator]="true" 
// //                   [rows]="10" 
// //                   responsiveLayout="scroll"
// //                   styleClass="premium-table border-round-xl border-1 surface-border">
                  
// //                   <ng-template pTemplate="header">
// //                     <tr>
// //                       <th style="width: 4rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
// //                       <th>Date</th>
// //                       <th>Employee</th>
// //                       <th>In / Out</th>
// //                       <th class="text-center">Calculated Hrs</th>
// //                       <th>Status</th>
// //                       <th class="text-right">Inspection</th>
// //                     </tr>
// //                   </ng-template>

// //                   <ng-template pTemplate="body" let-record>
// //                     <tr class="table-row-hover">
// //                       <td><p-tableCheckbox [value]="record"></p-tableCheckbox></td>
// //                       <td class="font-medium text-secondary">{{ record.date | date:'dd MMM yyyy' }}</td>
// //                       <td>
// //                         <div class="flex-col gap-1">
// //                           <span class="font-bold text-primary-color">{{ record.user?.name || 'Unknown' }}</span>
// //                           <span class="text-xs text-secondary">{{ record.user?.employeeProfile?.employeeId || record.user?._id | slice:0:8 }}</span>
// //                         </div>
// //                       </td>
// //                       <td class="font-mono text-sm">
// //                         {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }} - {{ record.lastOut ? (record.lastOut | date:'HH:mm') : '--:--' }}
// //                       </td>
// //                       <td class="text-center font-bold text-lg" [ngClass]="{'text-error': record.totalWorkHours === 0}">
// //                         {{ record.netWorkHours | number:'1.1-1' }}
// //                       </td>
// //                       <td>
// //                         <p-tag [severity]="getStatusSeverity(record.status)" [value]="record.status | uppercase"></p-tag>
// //                       </td>
// //                       <td class="text-right">
// //                         <p-button icon="pi pi-search" [text]="true" [rounded]="true" severity="secondary" pTooltip="Deep Dive" (onClick)="inspectDailyRecord(record._id)"></p-button>
// //                       </td>
// //                     </tr>
// //                   </ng-template>

// //                   <ng-template pTemplate="emptymessage">
// //                     <tr><td colspan="7" class="text-center py-5 text-secondary">Use the filters above to generate an attendance report.</td></tr>
// //                   </ng-template>
// //                 </p-table>
// //               </div>
// //             </p-tabpanel>

// //             <p-tabpanel value="1">
// //               <div class="panel-inner p-4 bg-surface h-full">
// //                  <div class="filter-bar bg-primary-light p-3 border-radius-md border-1 surface-border mb-4 flex-align gap-4">
// //                   <div class="input-group">
// //                     <label class="info-label text-primary">Financial Year</label>
// //                     <p-select [options]="financialYears" [(ngModel)]="selectedFy" styleClass="premium-select"></p-select>
// //                   </div>
// //                   <p-button label="Fetch Liability Report" icon="pi pi-chart-pie" styleClass="p-button-primary mt-auto" (onClick)="loadLeaveReport()"></p-button>
// //                 </div>

// //                 <p-table 
// //                   [value]="leaveReportData()" 
// //                   [paginator]="true" 
// //                   [rows]="10" 
// //                   styleClass="premium-table border-round-xl border-1 surface-border bg-primary">
// //                   <ng-template pTemplate="header">
// //                     <tr>
// //                       <th>Employee</th>
// //                       <th>Department</th>
// //                       <th class="text-center">CL Remaining</th>
// //                       <th class="text-center">SL Remaining</th>
// //                       <th class="text-center">EL Remaining</th>
// //                       <th class="text-right">Total Liability (Days)</th>
// //                     </tr>
// //                   </ng-template>
// //                   <ng-template pTemplate="body" let-bal>
// //                     <tr class="table-row-hover">
// //                       <td class="font-bold">{{ bal.user?.name }}</td>
// //                       <td class="text-secondary">{{ bal.department?.name || 'N/A' }}</td>
// //                       <td class="text-center font-mono">{{ bal.casualLeave?.total - bal.casualLeave?.used }}</td>
// //                       <td class="text-center font-mono text-error">{{ bal.sickLeave?.total - bal.sickLeave?.used }}</td>
// //                       <td class="text-center font-mono text-warning">{{ bal.earnedLeave?.total - bal.earnedLeave?.used }}</td>
// //                       <td class="text-right font-bold text-lg text-primary">{{ bal.availableLeaves?.total || 0 }}</td>
// //                     </tr>
// //                   </ng-template>
// //                   <ng-template pTemplate="emptymessage">
// //                     <tr><td colspan="6" class="text-center py-5 text-secondary">No leave balance data generated.</td></tr>
// //                   </ng-template>
// //                 </p-table>
// //               </div>
// //             </p-tabpanel>

// //           </p-tabpanels>
// //         </p-tabs>
// //       </p-card>
// //     </div>

// //     <p-dialog header="Bulk Update Attendance Status" [(visible)]="displayBulkDialog" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
// //       <p class="text-sm text-secondary mb-4">You are about to override the daily status for <b>{{ selectedRecords.length }}</b> records.</p>
      
// //       <form [formGroup]="bulkUpdateForm" class="flex-col gap-4">
// //         <div class="input-group">
// //           <label class="info-label">Override Status <span class="text-error">*</span></label>
// //           <p-select formControlName="status" [options]="attendanceStatuses" placeholder="Select New Status" appendTo="body" styleClass="w-full premium-select"></p-select>
// //         </div>
// //         <div class="input-group">
// //           <label class="info-label">Admin Reason <span class="text-error">*</span></label>
// //           <textarea pInputTextarea formControlName="reason" rows="2" class="w-full premium-input" placeholder="e.g. Office closed for maintenance"></textarea>
// //         </div>
// //         <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
// //           <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
// //           <p-button label="Apply to {{ selectedRecords.length }} Records" icon="pi pi-check" type="submit" [disabled]="bulkUpdateForm.invalid" [loading]="isProcessing()" styleClass="p-button-warning" (onClick)="submitBulkUpdate()"></p-button>
// //         </div>
// //       </form>
// //     </p-dialog>

// //     <p-drawer [(visible)]="displayDetails" position="right" styleClass="premium-drawer w-full md:w-30rem">
// //       <ng-template pTemplate="header">
// //         <h2 class="font-heading m-0 flex-align gap-2 text-primary-color"><i class="pi pi-search-plus text-primary"></i> Daily Record Inspector</h2>
// //       </ng-template>
      
// //       @if (isInspecting()) {
// //         <div class="flex-col gap-4 mt-4"><p-skeleton height="100px"></p-skeleton><p-skeleton height="200px"></p-skeleton></div>
// //       } @else if (dailyDetails(); as details) {
// //         <div class="inspection-content flex-col gap-4 mt-2">
          
// //           <div class="bg-surface p-4 border-radius-md border-1 surface-border flex-between">
// //             <div class="flex-col gap-1">
// //               <span class="text-xs text-tertiary uppercase font-bold">{{ details.date | date:'EEEE, dd MMM yyyy' }}</span>
// //               <span class="font-bold text-lg text-primary-color">{{ details.user?.name }}</span>
// //             </div>
// //             <p-tag [severity]="getStatusSeverity(details.status)" [value]="details.status | uppercase"></p-tag>
// //           </div>

// //           <div class="detail-section">
// //             <h4 class="section-title text-sm font-bold text-tertiary uppercase tracking-wide border-bottom pb-2 mb-3"><i class="pi pi-cog mr-2"></i> Calculation Engine Specs</h4>
// //             <div class="grid-2 gap-3">
// //               <div class="flex-col"><span class="text-xs text-tertiary">Shift Expected</span><span class="font-mono font-bold text-secondary">{{ details.scheduledInTime || '--:--' }} to {{ details.scheduledOutTime || '--:--' }}</span></div>
// //               <div class="flex-col"><span class="text-xs text-tertiary">Multiplier Applied</span><span class="font-mono font-bold text-secondary">{{ details.payoutMultiplier }}x</span></div>
// //               <div class="flex-col"><span class="text-xs text-tertiary">System Flags Triggered</span>
// //                 <div class="flex-align flex-wrap gap-1 mt-1">
// //                   <p-tag *ngIf="details.isLate" severity="warn" value="Late In"></p-tag>
// //                   <p-tag *ngIf="details.isEarlyDeparture" severity="warn" value="Early Out"></p-tag>
// //                   <p-tag *ngIf="details.isOvertime" severity="success" value="Overtime"></p-tag>
// //                   <p-tag *ngIf="details.isHalfDay" severity="info" value="Half Day"></p-tag>
// //                   <span *ngIf="!details.isLate && !details.isEarlyDeparture && !details.isOvertime && !details.isHalfDay" class="text-xs text-secondary">None</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="bg-primary-light p-4 border-radius-md mt-2">
// //             <div class="flex-between mb-2">
// //               <span class="text-sm font-bold text-primary">Gross Work Hours</span>
// //               <span class="font-mono font-bold text-primary">{{ details.totalWorkHours }}h</span>
// //             </div>
// //             <div class="flex-between mb-2 text-error">
// //               <span class="text-sm font-bold">- Break Deductions</span>
// //               <span class="font-mono font-bold">{{ details.breakHours }}h</span>
// //             </div>
// //             <div class="divider-subtle border-top my-2"></div>
// //             <div class="flex-between mt-2">
// //               <span class="text-md font-bold text-primary-color">Net Payable Hours</span>
// //               <span class="font-mono font-bold text-lg text-success">{{ details.netWorkHours }}h</span>
// //             </div>
// //           </div>
// //         </div>
// //       }
// //     </p-drawer>
// //   `,
// //   styles: [`
// //     /* Same core UI styles applied to maintain complete consistency */
// //     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
// //     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
// //     .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
// //     .flex-col { display: flex; flex-direction: column; }
// //     .flex-between { display: flex; justify-content: space-between; align-items: center; }
// //     .flex-align { display: flex; align-items: center; }
// //     .justify-end { justify-content: flex-end; }
// //     .flex-wrap { flex-wrap: wrap; }
    
// //     .gap-1 { gap: var(--spacing-xs); }
// //     .gap-2 { gap: var(--spacing-sm); }
// //     .gap-3 { gap: var(--spacing-md); }
// //     .gap-4 { gap: var(--spacing-lg); }
// //     .m-0 { margin: 0; }
// //     .mb-3 { margin-bottom: var(--spacing-md); }
// //     .mb-4 { margin-bottom: var(--spacing-xl); }
// //     .mt-1 { margin-top: var(--spacing-xs); }
// //     .mt-2 { margin-top: var(--spacing-sm); }
// //     .mt-4 { margin-top: var(--spacing-xl); }
// //     .mr-2 { margin-right: var(--spacing-sm); }
// //     .p-0 { padding: 0 !important; }
// //     .p-3 { padding: var(--spacing-lg); }
// //     .p-4 { padding: var(--spacing-xl); }
// //     .pt-4 { padding-top: var(--spacing-xl); }
// //     .pb-2 { padding-bottom: var(--spacing-sm); }
// //     .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
// //     .w-full { width: 100%; }
    
// //     .bg-surface { background: var(--bg-secondary); }
// //     .bg-primary { background: var(--color-primary); color: white; }
// //     .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
// //     .border-top { border-top: 1px solid var(--border-primary); }
// //     .border-bottom { border-bottom: 1px solid var(--border-primary); }
// //     .border-1 { border: 1px solid; }
// //     .surface-border { border-color: var(--border-primary); }
// //     .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
// //     .text-center { text-align: center; }
// //     .text-right { text-align: right; }
// //     .text-sm { font-size: var(--font-size-sm); }
// //     .text-xs { font-size: var(--font-size-xs); }
// //     .text-lg { font-size: var(--font-size-lg); }
// //     .text-secondary { color: var(--text-secondary); }
// //     .text-tertiary { color: var(--text-tertiary); }
// //     .text-primary-color { color: var(--text-primary); }
// //     .text-primary { color: var(--color-primary); }
// //     .text-success { color: var(--color-success); }
// //     .text-error { color: var(--color-error); }
// //     .font-bold { font-weight: var(--font-weight-bold); }
// //     .font-medium { font-weight: var(--font-weight-medium); }
// //     .font-mono { font-family: var(--font-mono); }
// //     .font-heading { font-family: var(--font-heading); }
// //     .tracking-wide { letter-spacing: 0.05em; }

// //     /* Header & Tabs */
// //     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
// //     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
// //     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
// //     .header-titles { display: flex; flex-direction: column; }
// //     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
// //     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

// //     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
// //     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
// //     ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
// //     ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
// //     ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

// //     /* Forms */
// //     .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
// //     .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
// //     ::ng-deep .premium-input, ::ng-deep .premium-select .p-select, ::ng-deep .premium-datepicker .p-datepicker .p-inputtext { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
// //     ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }
// //     ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
// //     ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }
    
// //     /* Table */
// //     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
// //     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
// //     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
// //     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

// //     /* Sidebar */
// //     ::ng-deep .premium-drawer { background: var(--bg-primary); border-left: 1px solid var(--border-primary); }
// //     ::ng-deep .premium-drawer .p-drawer-header { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
// //     ::ng-deep .premium-drawer .p-drawer-content { padding: var(--spacing-xl); }

// //     /* Animations */
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// //     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
// //     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
// //   `]
// // })
// // export class AttendanceReportsComponent implements OnInit {
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);
// //   private fb = inject(FormBuilder);

// //   // Filters
// //   dateRange: Date[] = [];
// //   departments = [{ label: 'Engineering', value: 'dept_eng' }, { label: 'Sales', value: 'dept_sales' }];
// //   selectedDept: string | null = null;
// //   financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
// //   selectedFy = '2024-2025';

// //   // Tab 0 Data
// //   isLoadingReport = signal(false);
// //   attendanceReportData = signal<any[]>([]);
// //   selectedRecords: any[] = [];
  
// //   // Bulk Edit
// //   displayBulkDialog = false;
// //   isProcessing = signal(false);
// //   bulkUpdateForm!: FormGroup;
// //   attendanceStatuses = [
// //     { label: 'Present', value: 'present' },
// //     { label: 'Absent', value: 'absent' },
// //     { label: 'Half Day', value: 'half_day' },
// //     { label: 'On Duty (Site Visit)', value: 'on_duty' },
// //     { label: 'Holiday', value: 'holiday' }
// //   ];

// //   // Tab 1 Data
// //   leaveReportData = signal<any[]>([]);

// //   // Sidebar Inspector
// //   displayDetails = false;
// //   isInspecting = signal(false);
// //   dailyDetails = signal<any>(null);

// //   ngOnInit() {
// //     this.bulkUpdateForm = this.fb.group({
// //       status: [null, Validators.required],
// //       reason: ['', Validators.required]
// //     });

// //     // Set default dates to current month
// //     const date = new Date();
// //     this.dateRange = [new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0)];
    
// //     this.loadAttendanceReport();
// //     this.loadLeaveReport();
// //   }

// //   // --- Tab 0: Attendance Reports ---
// //   loadAttendanceReport() {
// //     if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
// //       this.messageService.showWarn('Please select a valid date range.');
// //       return;
// //     }

// //     this.isLoadingReport.set(true);
// //     this.selectedRecords = [];

// //     const params = {
// //       fromDate: this.dateRange[0],
// //       toDate: this.dateRange[1],
// //       ...(this.selectedDept && { departmentId: this.selectedDept })
// //     };

// //     this.hrmsService.getAttendanceReport(params).pipe(
// //       catchError((err) => {
// //         this.messageService.handleHttpError(err)
// //         return of({ data: [] });
// //       }),
// //       finalize(() => this.isLoadingReport.set(false))
// //     ).subscribe((res: any) => {
// //       // Assuming API returns array of records
// //       this.attendanceReportData.set(res?.data || []);
// //     });
// //   }

// //   openBulkUpdateDialog() {
// //     this.bulkUpdateForm.reset();
// //     this.displayBulkDialog = true;
// //   }

// //   submitBulkUpdate() {
// //     if (this.bulkUpdateForm.invalid || this.selectedRecords.length === 0) return;
    
// //     this.isProcessing.set(true);
// //     const formVal = this.bulkUpdateForm.value;
    
// //     const updates = this.selectedRecords.map(rec => ({
// //       recordId: rec._id,
// //       status: formVal.status,
// //       reason: formVal.reason
// //     }));

// //     this.hrmsService.bulkUpdateAttendance(updates).pipe(
// //       catchError(() => {
// //         // this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Bulk update failed.' });
// //         return of(null);
// //       }),
// //       finalize(() => {
// //         this.isProcessing.set(false);
// //         this.displayBulkDialog = false;
// //       })
// //     ).subscribe(res => {
// //       if (res) {
// //         // this.messageService.add({ severity: 'success', summary: 'Success', detail: `Updated ${updates.length} records.` });
// //         this.loadAttendanceReport(); // Refresh data
// //       }
// //     });
// //   }

// //   // API Call: Deep dive single record
// //   inspectDailyRecord(id: string) {
// //     this.displayDetails = true;
// //     this.isInspecting.set(true);
    
// //     this.hrmsService.getDailyAttendance(id).pipe(
// //       catchError(() => {
// //         // this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load record specs.' });
// //         this.displayDetails = false;
// //         return of(null);
// //       }),
// //       finalize(() => this.isInspecting.set(false))
// //     ).subscribe((res: any) => {
// //       if (res?.data?.daily) {
// //         this.dailyDetails.set(res.data.daily);
// //       }
// //     });
// //   }

// //   // --- Tab 1: Leave Reports ---
// //   loadLeaveReport() {
// //     this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
// //       catchError(() => of({ data: [] }))
// //     ).subscribe((res: any) => {
// //       this.leaveReportData.set(res?.data || []);
// //     });
// //   }

// //   // --- Helpers ---
// //   getStatusSeverity(status: string): any {
// //     switch (status) {
// //       case 'present': case 'on_duty': return 'success';
// //       case 'absent': return 'danger';
// //       case 'late': case 'half_day': return 'warning';
// //       default: return 'secondary';
// //     }
// //   }
// // }