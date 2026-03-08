import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule,  } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { HRMSService } from '../../hrms.service';
@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonModule,
    TagModule, SelectModule, DatePickerModule, DrawerModule, DialogModule,
    SkeletonModule, TooltipModule, TabsModule, AvatarModule,FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      <header class="dashboard-header slide-down mb-4">
        <div class="header-left">
          <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-file-excel"></i></div>
          <div class="header-titles">
            <h1 class="page-title m-0">Advanced Reporting & Bulk Actions</h1>
            <p class="page-subtitle mt-1">Generate cross-department reports and override attendance statuses in bulk.</p>
          </div>
        </div>
      </header>

      <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
        <p-tabs value="0">
          <p-tablist styleClass="hub-tablist">
            <p-tab value="0"><div class="tab-label"><i class="pi pi-datepicker-times"></i> Attendance Report</div></p-tab>
            <p-tab value="1"><div class="tab-label"><i class="pi pi-wallet"></i> Leave Liability Report</div></p-tab>
          </p-tablist>

          <p-tabpanels styleClass="hub-tabpanels p-0">
            
            <p-tabpanel value="0">
              <div class="panel-inner p-4">
                
                <div class="filter-bar bg-surface p-3 border-radius-md border-1 surface-border mb-4 flex-align gap-4 flex-wrap">
                  <div class="input-group">
                    <label class="info-label">Date Range</label>
                    <p-datepicker [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" [showIcon]="true" placeholder="Select Range" styleClass="premium-datepicker"></p-datepicker>
                  </div>
                  <div class="input-group">
                    <label class="info-label">Department</label>
                    <p-select [options]="departments" [(ngModel)]="selectedDept" placeholder="All Departments" [showClear]="true" styleClass="premium-select"></p-select>
                  </div>
                  <p-button label="Generate Report" icon="pi pi-bolt" styleClass="p-button-primary mt-auto" [loading]="isLoadingReport()" (onClick)="loadAttendanceReport()"></p-button>
                </div>

                <div class="flex-between mb-3">
                  <h3 class="font-heading m-0 text-primary-color">Generated Results</h3>
                  <div class="flex-align gap-2">
                    <p-button 
                      label="Bulk Update Status ({{ selectedRecords.length }})" 
                      icon="pi pi-pencil" 
                      severity="warn" 
                      [disabled]="selectedRecords.length === 0"
                      (onClick)="openBulkUpdateDialog()">
                    </p-button>
                  </div>
                </div>

                <p-table 
                  [value]="attendanceReportData()" 
                  [(selection)]="selectedRecords" 
                  dataKey="_id"
                  [paginator]="true" 
                  [rows]="10" 
                  responsiveLayout="scroll"
                  styleClass="premium-table border-round-xl border-1 surface-border">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th style="width: 4rem"><p-tableHeaderCheckbox></p-tableHeaderCheckbox></th>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>In / Out</th>
                      <th class="text-center">Calculated Hrs</th>
                      <th>Status</th>
                      <th class="text-right">Inspection</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-record>
                    <tr class="table-row-hover">
                      <td><p-tableCheckbox [value]="record"></p-tableCheckbox></td>
                      <td class="font-medium text-secondary">{{ record.date | date:'dd MMM yyyy' }}</td>
                      <td>
                        <div class="flex-col gap-1">
                          <span class="font-bold text-primary-color">{{ record.user?.name || 'Unknown' }}</span>
                          <span class="text-xs text-secondary">{{ record.user?.employeeProfile?.employeeId || record.user?._id | slice:0:8 }}</span>
                        </div>
                      </td>
                      <td class="font-mono text-sm">
                        {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }} - {{ record.lastOut ? (record.lastOut | date:'HH:mm') : '--:--' }}
                      </td>
                      <td class="text-center font-bold text-lg" [ngClass]="{'text-error': record.totalWorkHours === 0}">
                        {{ record.netWorkHours | number:'1.1-1' }}
                      </td>
                      <td>
                        <p-tag [severity]="getStatusSeverity(record.status)" [value]="record.status | uppercase"></p-tag>
                      </td>
                      <td class="text-right">
                        <p-button icon="pi pi-search" [text]="true" [rounded]="true" severity="secondary" pTooltip="Deep Dive" (onClick)="inspectDailyRecord(record._id)"></p-button>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr><td colspan="7" class="text-center py-5 text-secondary">Use the filters above to generate an attendance report.</td></tr>
                  </ng-template>
                </p-table>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="panel-inner p-4 bg-surface h-full">
                 <div class="filter-bar bg-primary-light p-3 border-radius-md border-1 surface-border mb-4 flex-align gap-4">
                  <div class="input-group">
                    <label class="info-label text-primary">Financial Year</label>
                    <p-select [options]="financialYears" [(ngModel)]="selectedFy" styleClass="premium-select"></p-select>
                  </div>
                  <p-button label="Fetch Liability Report" icon="pi pi-chart-pie" styleClass="p-button-primary mt-auto" (onClick)="loadLeaveReport()"></p-button>
                </div>

                <p-table 
                  [value]="leaveReportData()" 
                  [paginator]="true" 
                  [rows]="10" 
                  styleClass="premium-table border-round-xl border-1 surface-border bg-primary">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th class="text-center">CL Remaining</th>
                      <th class="text-center">SL Remaining</th>
                      <th class="text-center">EL Remaining</th>
                      <th class="text-right">Total Liability (Days)</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-bal>
                    <tr class="table-row-hover">
                      <td class="font-bold">{{ bal.user?.name }}</td>
                      <td class="text-secondary">{{ bal.department?.name || 'N/A' }}</td>
                      <td class="text-center font-mono">{{ bal.casualLeave?.total - bal.casualLeave?.used }}</td>
                      <td class="text-center font-mono text-error">{{ bal.sickLeave?.total - bal.sickLeave?.used }}</td>
                      <td class="text-center font-mono text-warning">{{ bal.earnedLeave?.total - bal.earnedLeave?.used }}</td>
                      <td class="text-right font-bold text-lg text-primary">{{ bal.availableLeaves?.total || 0 }}</td>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="emptymessage">
                    <tr><td colspan="6" class="text-center py-5 text-secondary">No leave balance data generated.</td></tr>
                  </ng-template>
                </p-table>
              </div>
            </p-tabpanel>

          </p-tabpanels>
        </p-tabs>
      </p-card>
    </div>

    <p-dialog header="Bulk Update Attendance Status" [(visible)]="displayBulkDialog" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
      <p class="text-sm text-secondary mb-4">You are about to override the daily status for <b>{{ selectedRecords.length }}</b> records.</p>
      
      <form [formGroup]="bulkUpdateForm" class="flex-col gap-4">
        <div class="input-group">
          <label class="info-label">Override Status <span class="text-error">*</span></label>
          <p-select formControlName="status" [options]="attendanceStatuses" placeholder="Select New Status" appendTo="body" styleClass="w-full premium-select"></p-select>
        </div>
        <div class="input-group">
          <label class="info-label">Admin Reason <span class="text-error">*</span></label>
          <textarea pInputTextarea formControlName="reason" rows="2" class="w-full premium-input" placeholder="e.g. Office closed for maintenance"></textarea>
        </div>
        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayBulkDialog = false"></p-button>
          <p-button label="Apply to {{ selectedRecords.length }} Records" icon="pi pi-check" type="submit" [disabled]="bulkUpdateForm.invalid" [loading]="isProcessing()" styleClass="p-button-warning" (onClick)="submitBulkUpdate()"></p-button>
        </div>
      </form>
    </p-dialog>

    <p-drawer [(visible)]="displayDetails" position="right" styleClass="premium-drawer w-full md:w-30rem">
      <ng-template pTemplate="header">
        <h2 class="font-heading m-0 flex-align gap-2 text-primary-color"><i class="pi pi-search-plus text-primary"></i> Daily Record Inspector</h2>
      </ng-template>
      
      @if (isInspecting()) {
        <div class="flex-col gap-4 mt-4"><p-skeleton height="100px"></p-skeleton><p-skeleton height="200px"></p-skeleton></div>
      } @else if (dailyDetails(); as details) {
        <div class="inspection-content flex-col gap-4 mt-2">
          
          <div class="bg-surface p-4 border-radius-md border-1 surface-border flex-between">
            <div class="flex-col gap-1">
              <span class="text-xs text-tertiary uppercase font-bold">{{ details.date | date:'EEEE, dd MMM yyyy' }}</span>
              <span class="font-bold text-lg text-primary-color">{{ details.user?.name }}</span>
            </div>
            <p-tag [severity]="getStatusSeverity(details.status)" [value]="details.status | uppercase"></p-tag>
          </div>

          <div class="detail-section">
            <h4 class="section-title text-sm font-bold text-tertiary uppercase tracking-wide border-bottom pb-2 mb-3"><i class="pi pi-cog mr-2"></i> Calculation Engine Specs</h4>
            <div class="grid-2 gap-3">
              <div class="flex-col"><span class="text-xs text-tertiary">Shift Expected</span><span class="font-mono font-bold text-secondary">{{ details.scheduledInTime || '--:--' }} to {{ details.scheduledOutTime || '--:--' }}</span></div>
              <div class="flex-col"><span class="text-xs text-tertiary">Multiplier Applied</span><span class="font-mono font-bold text-secondary">{{ details.payoutMultiplier }}x</span></div>
              <div class="flex-col"><span class="text-xs text-tertiary">System Flags Triggered</span>
                <div class="flex-align flex-wrap gap-1 mt-1">
                  <p-tag *ngIf="details.isLate" severity="warn" value="Late In"></p-tag>
                  <p-tag *ngIf="details.isEarlyDeparture" severity="warn" value="Early Out"></p-tag>
                  <p-tag *ngIf="details.isOvertime" severity="success" value="Overtime"></p-tag>
                  <p-tag *ngIf="details.isHalfDay" severity="info" value="Half Day"></p-tag>
                  <span *ngIf="!details.isLate && !details.isEarlyDeparture && !details.isOvertime && !details.isHalfDay" class="text-xs text-secondary">None</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-primary-light p-4 border-radius-md mt-2">
            <div class="flex-between mb-2">
              <span class="text-sm font-bold text-primary">Gross Work Hours</span>
              <span class="font-mono font-bold text-primary">{{ details.totalWorkHours }}h</span>
            </div>
            <div class="flex-between mb-2 text-error">
              <span class="text-sm font-bold">- Break Deductions</span>
              <span class="font-mono font-bold">{{ details.breakHours }}h</span>
            </div>
            <div class="divider-subtle border-top my-2"></div>
            <div class="flex-between mt-2">
              <span class="text-md font-bold text-primary-color">Net Payable Hours</span>
              <span class="font-mono font-bold text-lg text-success">{{ details.netWorkHours }}h</span>
            </div>
          </div>
        </div>
      }
    </p-drawer>
  `,
  styles: [`
    /* Same core UI styles applied to maintain complete consistency */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .flex-wrap { flex-wrap: wrap; }
    
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .m-0 { margin: 0; }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mr-2 { margin-right: var(--spacing-sm); }
    .p-0 { padding: 0 !important; }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    .pb-2 { padding-bottom: var(--spacing-sm); }
    .py-5 { padding-top: var(--spacing-2xl); padding-bottom: var(--spacing-2xl); }
    .w-full { width: 100%; }
    
    .bg-surface { background: var(--bg-secondary); }
    .bg-primary { background: var(--color-primary); color: white; }
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-mono { font-family: var(--font-mono); }
    .font-heading { font-family: var(--font-heading); }
    .tracking-wide { letter-spacing: 0.05em; }

    /* Header & Tabs */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
    .header-titles { display: flex; flex-direction: column; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
    ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
    ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }

    /* Forms */
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    ::ng-deep .premium-input, ::ng-deep .premium-select .p-select, ::ng-deep .premium-datepicker .p-datepicker .p-inputtext { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }
    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }
    
    /* Table */
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

    /* Sidebar */
    ::ng-deep .premium-drawer { background: var(--bg-primary); border-left: 1px solid var(--border-primary); }
    ::ng-deep .premium-drawer .p-drawer-header { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-drawer .p-drawer-content { padding: var(--spacing-xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class AttendanceReportsComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  // Filters
  dateRange: Date[] = [];
  departments = [{ label: 'Engineering', value: 'dept_eng' }, { label: 'Sales', value: 'dept_sales' }];
  selectedDept: string | null = null;
  financialYears = [{ label: '2023-2024', value: '2023-2024' }, { label: '2024-2025', value: '2024-2025' }];
  selectedFy = '2024-2025';

  // Tab 0 Data
  isLoadingReport = signal(false);
  attendanceReportData = signal<any[]>([]);
  selectedRecords: any[] = [];
  
  // Bulk Edit
  displayBulkDialog = false;
  isProcessing = signal(false);
  bulkUpdateForm!: FormGroup;
  attendanceStatuses = [
    { label: 'Present', value: 'present' },
    { label: 'Absent', value: 'absent' },
    { label: 'Half Day', value: 'half_day' },
    { label: 'On Duty (Site Visit)', value: 'on_duty' },
    { label: 'Holiday', value: 'holiday' }
  ];

  // Tab 1 Data
  leaveReportData = signal<any[]>([]);

  // Sidebar Inspector
  displayDetails = false;
  isInspecting = signal(false);
  dailyDetails = signal<any>(null);

  ngOnInit() {
    this.bulkUpdateForm = this.fb.group({
      status: [null, Validators.required],
      reason: ['', Validators.required]
    });

    // Set default dates to current month
    const date = new Date();
    this.dateRange = [new Date(date.getFullYear(), date.getMonth(), 1), new Date(date.getFullYear(), date.getMonth() + 1, 0)];
    
    this.loadAttendanceReport();
    this.loadLeaveReport();
  }

  // --- Tab 0: Attendance Reports ---
  loadAttendanceReport() {
    if (!this.dateRange || !this.dateRange[0] || !this.dateRange[1]) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Input', detail: 'Please select a valid date range.' });
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
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate attendance report.' });
        return of({ data: [] });
      }),
      finalize(() => this.isLoadingReport.set(false))
    ).subscribe((res: any) => {
      // Assuming API returns array of records
      this.attendanceReportData.set(res?.data || []);
    });
  }

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
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Bulk update failed.' });
        return of(null);
      }),
      finalize(() => {
        this.isProcessing.set(false);
        this.displayBulkDialog = false;
      })
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Updated ${updates.length} records.` });
        this.loadAttendanceReport(); // Refresh data
      }
    });
  }

  // API Call: Deep dive single record
  inspectDailyRecord(id: string) {
    this.displayDetails = true;
    this.isInspecting.set(true);
    
    this.hrmsService.getDailyAttendance(id).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load record specs.' });
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

  // --- Tab 1: Leave Reports ---
  loadLeaveReport() {
    this.hrmsService.getLeaveBalanceReport(this.selectedFy).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((res: any) => {
      this.leaveReportData.set(res?.data || []);
    });
  }

  // --- Helpers ---
  getStatusSeverity(status: string): any {
    switch (status) {
      case 'present': case 'on_duty': return 'success';
      case 'absent': return 'danger';
      case 'late': case 'half_day': return 'warning';
      default: return 'secondary';
    }
  }
}