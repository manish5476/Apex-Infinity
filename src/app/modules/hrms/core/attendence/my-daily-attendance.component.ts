import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
// import { HRMSService } from '../../../hrms.service';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { HRMSService } from '../../hrms.service';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-my-daily-attendance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe, CardModule, TableModule,
    ButtonModule, TagModule, DialogModule, DatePickerModule,FormsModule,
    SkeletonModule, TooltipModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <div class="icon-brand bg-primary-light text-primary"><i class="pi pi-datepicker"></i></div>
          <div class="header-titles">
            <h1 class="page-title">My Timesheet</h1>
            <p class="page-subtitle">Review your daily attendance, hours worked, and request regularizations.</p>
          </div>
        </div>
        <div class="header-right">
          <p-datepicker 
            [(ngModel)]="selectedMonth" 
            view="month" 
            dateFormat="MM yy" 
            [readonlyInput]="true" 
            (onSelect)="loadMyAttendance()"
            styleClass="premium-datepicker w-15rem">
          </p-datepicker>
        </div>
      </header>

      @if (isLoading()) {
        <div class="flex-col gap-4">
          <div class="grid-4"><p-skeleton height="100px" borderRadius="12px"></p-skeleton><p-skeleton height="100px" borderRadius="12px"></p-skeleton><p-skeleton height="100px" borderRadius="12px"></p-skeleton><p-skeleton height="100px" borderRadius="12px"></p-skeleton></div>
          <p-skeleton height="400px" borderRadius="12px"></p-skeleton>
        </div>
      } @else {
        @if (summary(); as s) {
          <div class="grid-4 mb-5 slide-down" styleClass="animation-delay: 0.1s">
            <p-card styleClass="stat-card">
              <span class="stat-label">Days Present</span>
              <div class="stat-val text-primary mt-2">{{ s.presentDays || 0 }}</div>
            </p-card>
            <p-card styleClass="stat-card">
              <span class="stat-label">Total Hours</span>
              <div class="stat-val mt-2">{{ s.totalHours || 0 }}<span class="text-sm font-normal text-secondary">h</span></div>
            </p-card>
            <p-card styleClass="stat-card border-left-warning">
              <span class="stat-label">Late Arrivals</span>
              <div class="stat-val text-warning mt-2">{{ s.lateDays || 0 }}</div>
            </p-card>
            <p-card styleClass="stat-card border-left-error">
              <span class="stat-label">Absences / LWP</span>
              <div class="stat-val text-error mt-2">{{ s.absentDays || 0 }}</div>
            </p-card>
          </div>
        }

        <p-card styleClass="premium-card glass-card slide-down" styleClass="animation-delay: 0.2s">
          <p-table 
            [value]="records()" 
            [rows]="31" 
            responsiveLayout="scroll"
            styleClass="premium-table border-round-xl border-1 surface-border">
            
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>First In</th>
                <th>Last Out</th>
                <th class="text-center">Effective Hours</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-record>
              <tr class="table-row-hover">
                <td>
                  <div class="flex-col gap-1">
                    <span class="font-bold text-primary-color">{{ record.date | date:'EEE, dd MMM' }}</span>
                    <span class="text-xs text-secondary" *ngIf="record.shiftId">Shift: {{ record.scheduledInTime }} - {{ record.scheduledOutTime }}</span>
                  </div>
                </td>
                
                <td [ngClass]="{'text-error font-bold': record.isLate}">
                  {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }}
                  <i *ngIf="record.isLate" class="pi pi-exclamation-circle text-xs ml-1" pTooltip="Late Arrival"></i>
                </td>
                
                <td [ngClass]="{'text-warning font-bold': record.isEarlyDeparture}">
                  {{ record.lastOut ? (record.lastOut | date:'HH:mm') : '--:--' }}
                  <i *ngIf="record.isEarlyDeparture" class="pi pi-info-circle text-xs ml-1" pTooltip="Early Departure"></i>
                </td>
                
                <td class="text-center">
                  <div class="flex-col align-center">
                    <span class="font-bold text-lg" [ngClass]="{'text-success': record.totalWorkHours >= 8}">{{ record.netWorkHours | number:'1.1-1' }}h</span>
                    <span *ngIf="record.overtimeHours > 0" class="text-xs text-primary font-bold">+{{ record.overtimeHours }}h OT</span>
                  </div>
                </td>
                
                <td>
                  <div class="flex-align gap-2 flex-wrap">
                    <p-tag [severity]="getStatusSeverity(record.status)" [value]="record.status | uppercase"></p-tag>
                    <p-tag *ngIf="record.isHalfDay" severity="warn" value="HALF DAY" styleClass="text-xs"></p-tag>
                    <p-tag *ngIf="record.isRegularized" severity="info" value="REGULARIZED" styleClass="text-xs"></p-tag>
                  </div>
                </td>
                
                <td class="text-right">
                  <p-button 
                    *ngIf="canRegularize(record)" 
                    label="Regularize" 
                    icon="pi pi-sliders-h" 
                    [outlined]="true" 
                    size="small"
                    (onClick)="openRegularizeDialog(record)">
                  </p-button>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr><td colspan="6" class="text-center py-6 text-secondary">No attendance records found for this month.</td></tr>
            </ng-template>
          </p-table>
        </p-card>
      }
    </div>

    <p-dialog header="Request Attendance Regularization" [(visible)]="displayRegularize" [modal]="true" [style]="{width: '450px'}" styleClass="premium-dialog">
      <p class="text-sm text-secondary mb-4">Request a manual correction to your attendance record for <b>{{ selectedRecord?.date | date:'dd MMM yyyy' }}</b>.</p>
      
      <form [formGroup]="regForm" class="flex-col gap-4">
        <div class="grid-2 gap-4">
          <div class="input-group">
            <label class="info-label">Corrected In Time</label>
            <p-datepicker formControlName="firstIn" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full premium-datepicker"></p-datepicker>
          </div>
          <div class="input-group">
            <label class="info-label">Corrected Out Time</label>
            <p-datepicker formControlName="lastOut" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full premium-datepicker"></p-datepicker>
          </div>
        </div>

        <div class="input-group">
          <label class="info-label">Reason for Request <span class="text-error">*</span></label>
          <textarea pInputTextarea formControlName="reason" rows="3" class="w-full premium-input" placeholder="e.g. Forgot to punch out, machine error, client meeting..."></textarea>
        </div>

        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top">
          <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="displayRegularize = false"></p-button>
          <p-button label="Submit Request" icon="pi pi-send" type="submit" [loading]="isSubmitting()" [disabled]="regForm.invalid" styleClass="p-button-primary" (onClick)="submitRegularization()"></p-button>
        </div>
      </form>
    </p-dialog>
  `,
  styles: [`
    /* Same comprehensive CSS structure as established previously */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1400px; margin: 0 auto; }
    
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-xl); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .align-center { align-items: center; }
    .flex-wrap { flex-wrap: wrap; }
    
    .w-full { width: 100%; }
    .w-15rem { width: 15rem; }
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-4 { gap: var(--spacing-lg); }
    .m-0 { margin: 0; }
    .ml-1 { margin-left: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-secondary { color: var(--text-secondary); }
    .text-primary-color { color: var(--text-primary); }
    .text-primary { color: var(--color-primary); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-normal { font-weight: normal; }
    .font-heading { font-family: var(--font-heading); }
    
    .border-top { border-top: 1px solid var(--border-primary); }
    
    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); background: var(--color-primary-bg); color: var(--color-primary); }
    .header-titles { display: flex; flex-direction: column; gap: 4px; }
    .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }
    
    /* Stats */
    ::ng-deep .stat-card.p-card { border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); }
    ::ng-deep .stat-card .p-card-body { padding: var(--spacing-xl); }
    .border-left-error { border-left: 4px solid var(--color-error) !important; }
    .border-left-warning { border-left: 4px solid var(--color-warning) !important; }
    .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-val { font-size: 2rem; font-weight: var(--font-weight-bold); line-height: 1; }

    /* Table & Dialog */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); overflow: hidden; }
    ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
    ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-secondary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
    ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
    ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }
    
    ::ng-deep .premium-datepicker .p-inputtext, ::ng-deep .premium-input { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
    ::ng-deep .premium-datepicker .p-inputtext:focus, ::ng-deep .premium-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }
    ::ng-deep .premium-dialog .p-dialog-header { background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary); padding: var(--spacing-xl); }
    ::ng-deep .premium-dialog .p-dialog-content { padding: var(--spacing-xl); }

    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
  `]
})
export class MyDailyAttendanceComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  selectedMonth: Date = new Date();
  records = signal<any[]>([]);
  summary = signal<any>(null);

  // Regularization Dialog
  displayRegularize = false;
  selectedRecord: any = null;
  regForm!: FormGroup;
  isSubmitting = signal(false);

  ngOnInit() {
    this.initForm();
    this.loadMyAttendance();
  }

  private initForm() {
    this.regForm = this.fb.group({
      firstIn: [null],
      lastOut: [null],
      reason: ['', Validators.required]
    });
  }

  loadMyAttendance() {
    this.isLoading.set(true);

    // Calculate start and end of selected month to pass to API
    const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const end = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    this.hrmsService.getMyAttendance({ fromDate: start, toDate: end }).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load timesheet.' });
        return of({ data: { records: [], summary: {} } });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      this.records.set(res?.data?.records || []);
      this.summary.set(res?.data?.summary || { presentDays: 0, totalHours: 0, lateDays: 0, absentDays: 0 });
    });
  }

  // --- Regularization Logic ---

  canRegularize(record: any): boolean {
    // Basic logic: allow if absent, late, or missing an out punch.
    // In production, this might be tied to 'isRegularized' flag or a 'pending_regularization' state.
    if (record.isRegularized || record.status === 'on_leave') return false;
    return record.status === 'absent' || record.isLate || (!record.lastOut && record.firstIn);
  }

  openRegularizeDialog(record: any) {
    this.selectedRecord = record;
    this.regForm.reset({
      firstIn: record.firstIn ? new Date(record.firstIn) : null,
      lastOut: record.lastOut ? new Date(record.lastOut) : null,
      reason: ''
    });
    this.displayRegularize = true;
  }

  submitRegularization() {
    if (this.regForm.invalid || !this.selectedRecord) return;
    
    this.isSubmitting.set(true);
    const payload = this.regForm.value;

    // Call the specific regularization API
    this.hrmsService.regularizeAttendance(this.selectedRecord._id, payload).pipe(
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Failed', detail: err.error?.message || 'Server error' });
        return of(null);
      }),
      finalize(() => {
        this.isSubmitting.set(false);
        this.displayRegularize = false;
      })
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Regularization request sent to manager.' });
        this.loadMyAttendance(); // Reload to show pending status if applicable
      }
    });
  }

  // --- UI Helpers ---
  getStatusSeverity(status: string): any {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': case 'half_day': return 'warning';
      case 'on_leave': case 'week_off': case 'holiday': return 'info';
      default: return 'secondary';
    }
  }
}