import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// PrimeNG
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';

// Services (Mocked paths based on your original code)
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-my-daily-attendance',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe, CardModule, TableModule,
    ButtonModule, DialogModule, DatePickerModule, FormsModule,
    SkeletonModule, TooltipModule, CheckboxModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crextio-theme-wrapper fade-in">
      
      <header class="crextio-header mb-5">
        <h1 class="page-title">My Attendance</h1>
        
        <div class="header-controls">
          <div class="nav-pills hidden-mobile">
            <span class="nav-pill active">Timesheet</span>
            <span class="nav-pill">Requests</span>
            <span class="nav-pill">Overtime</span>
          </div>
          
          <p-datepicker
            [(ngModel)]="selectedMonth"
            view="month"
            dateFormat="MM yy"
            [readonlyInput]="true"
            (onSelect)="loadMyAttendance()"
            styleClass="pill-datepicker w-15rem">
          </p-datepicker>
        </div>
      </header>
    
      @if (isLoading()) {
        <div class="flex-col gap-4 p-4">
          <div class="grid-4"><p-skeleton height="60px" borderRadius="30px"></p-skeleton><p-skeleton height="60px" borderRadius="30px"></p-skeleton></div>
          <p-skeleton height="400px" borderRadius="24px"></p-skeleton>
        </div>
      } @else {
        
        @if (summary(); as s) {
          <div class="summary-bar mb-5 slide-down" style="animation-delay: 0.1s">
            <div class="stat-item">
              <span class="stat-label">Present</span>
              <div class="stat-progress-container">
                <span class="stat-pill bg-yellow text-dark">{{ s.present || 0 }}</span>
                <div class="progress-track"><div class="progress-fill bg-yellow" [style.width.%]="(s.present / s.total) * 100"></div></div>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="stat-label">Absent</span>
              <div class="stat-progress-container">
                <span class="stat-pill bg-light border-dashed">{{ s.absent || 0 }}</span>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-label">Work Hours</span>
              <div class="stat-progress-container">
                <span class="stat-pill bg-light border-dashed">{{ s.totalWorkHours || 0 }}h</span>
              </div>
            </div>
          </div>
        }
    
        <div class="table-container slide-down" style="animation-delay: 0.2s">
          <p-table
            [value]="records()"
            [rows]="31"
            responsiveLayout="scroll"
            styleClass="crextio-table">
    
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 3rem">
                   </th>
                <th>Date</th>
                <th>Schedule</th>
                <th>First In</th>
                <th>Last Out</th>
                <th>Net Hours</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </ng-template>
    
            <ng-template pTemplate="body" let-record let-rowIndex="rowIndex">
              <tr class="table-row-hover" [class.row-highlight]="record.status === 'absent'">
                <td>
                  <p-checkbox [binary]="true" [ngModel]="record.status === 'absent'" [readonly]="true"></p-checkbox>
                </td>
                
                <td>
                  <div class="font-bold">{{ record.date | date:'MMM dd, yyyy' }}</div>
                </td>

                <td class="text-secondary">
                  @if (record.shiftId) {
                    {{ record.scheduledInTime }} - {{ record.scheduledOutTime }}
                  } @else {
                    --
                  }
                </td>
    
                <td [ngClass]="{'text-error font-bold': record.isLate}">
                  {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }}
                  @if (record.isLate) {
                    <i class="pi pi-exclamation-circle text-xs ml-1 text-error" pTooltip="Late Arrival"></i>
                  }
                </td>
    
                <td [ngClass]="{'text-warning font-bold': record.isEarlyDeparture}">
                  {{ record.lastOut ? (record.lastOut | date:'HH:mm') : '--:--' }}
                </td>
    
                <td>
                  <span class="font-bold">{{ record.netWorkHours | number:'1.1-1' }}h</span>
                </td>
    
                <td>
                  <div class="status-pill" [ngClass]="'status-' + getStatusClass(record.status)">
                    <span class="status-dot"></span>
                    {{ record.status | titlecase }}
                  </div>
                </td>
    
                <td class="text-right">
                  @if (canRegularize(record)) {
                    <button class="action-btn" (click)="openRegularizeDialog(record)" pTooltip="Regularize">
                      <i class="pi pi-sliders-h"></i>
                    </button>
                  }
                </td>
              </tr>
            </ng-template>
    
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="8" class="text-center py-6 text-secondary">No attendance records found.</td></tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
    
    <p-dialog header="Request Regularization" [(visible)]="displayRegularize" [modal]="true" [style]="{width: '450px'}" styleClass="crextio-dialog">
      <p class="text-sm text-secondary mb-4">Request correction for <b>{{ selectedRecord?.date | date:'dd MMM yyyy' }}</b>.</p>
    
      <form [formGroup]="regForm" class="flex-col gap-4">
        <div class="grid-2 gap-4">
          <div class="input-group">
            <label class="info-label">Corrected In Time</label>
            <p-datepicker formControlName="firstIn" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full pill-datepicker"></p-datepicker>
          </div>
          <div class="input-group">
            <label class="info-label">Corrected Out Time</label>
            <p-datepicker formControlName="lastOut" [timeOnly]="true" hourFormat="24" appendTo="body" styleClass="w-full pill-datepicker"></p-datepicker>
          </div>
        </div>
    
        <div class="input-group mt-2">
          <label class="info-label">Reason</label>
          <textarea formControlName="reason" rows="3" class="w-full pill-input" placeholder="Enter reason..."></textarea>
        </div>
    
        <div class="flex-align justify-end gap-3 mt-4 pt-4 border-top-dashed">
          <button type="button" class="btn-text" (click)="displayRegularize = false">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="regForm.invalid" (click)="submitRegularization()">
            {{ isSubmitting() ? 'Submitting...' : 'Submit Request' }}
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
      background-color: #9AA3AD; /* Backdrop color outside the app */
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      
      /* Colors */
      --c-bg-app: #F5F6F8;
      --c-bg-card: #FFFFFF;
      --c-text-main: #1A1A1A;
      --c-text-muted: #8E8E93;
      --c-text-light: #BDBDBD;
      --c-accent-yellow: #FCDA68;
      --c-accent-yellow-dark: #D4B447;
      --c-border: #E5E5EA;
      
      /* Status Colors */
      --c-status-green-bg: #E8F5E9;
      --c-status-green-dot: #4CAF50;
      --c-status-green-text: #2E7D32;
      
      --c-status-gray-bg: #F0F0F0;
      --c-status-gray-dot: #9E9E9E;
      --c-status-gray-text: #616161;
      
      --c-status-red-bg: #FFEBEE;
      --c-status-red-dot: #F44336;
      --c-status-red-text: #C62828;

      /* Radii & Spacing */
      --radius-app: 32px;
      --radius-card: 24px;
      --radius-pill: 50px;
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
    }

    /* =========================================================
       LAYOUT & UTILITIES 
       ========================================================= */
    .crextio-theme-wrapper {
      background: var(--c-bg-app);
      border-radius: var(--radius-app);
      padding: var(--spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    }

    /* Soft top-right gradient mimicking the image */
    .crextio-theme-wrapper::before {
      content: '';
      position: absolute;
      top: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(252,218,104,0.3) 0%, rgba(245,246,248,0) 70%);
      z-index: 0;
      pointer-events: none;
    }

    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
    .w-full { width: 100%; }
    .w-15rem { width: 15rem; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: var(--spacing-lg); }
    .mb-4 { margin-bottom: var(--spacing-md); }
    .mb-5 { margin-bottom: var(--spacing-xl); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-md); }
    .pt-4 { padding-top: var(--spacing-md); }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-error { color: var(--c-status-red-dot); }
    .text-warning { color: var(--c-accent-yellow-dark); }
    .text-secondary { color: var(--c-text-muted); }
    .font-bold { font-weight: 600; }
    .border-top-dashed { border-top: 1px dashed var(--c-border); }

    /* =========================================================
       HEADER & NAVIGATION 
       ========================================================= */
    .crextio-header {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-title {
      font-size: 28px;
      font-weight: 400;
      color: var(--c-text-main);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .nav-pills {
      display: flex;
      background: transparent;
      gap: var(--spacing-md);
    }

    .nav-pill {
      padding: 8px 16px;
      border-radius: var(--radius-pill);
      color: var(--c-text-muted);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-pill.active {
      background: var(--c-text-main);
      color: #FFF;
    }

    /* =========================================================
       SUMMARY BARS
       ========================================================= */
    .summary-bar {
      position: relative;
      z-index: 1;
      display: flex;
      gap: var(--spacing-xl);
      align-items: center;
      padding: 0 10px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 150px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--c-text-muted);
    }

    .stat-progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-pill {
      padding: 6px 16px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 600;
    }

    .bg-yellow { background: var(--c-accent-yellow); color: var(--c-text-main); }
    .bg-light { background: transparent; color: var(--c-text-muted); }
    .border-dashed { border: 1px dashed var(--c-border); }

    .progress-track {
      flex-grow: 1;
      height: 6px;
      background: var(--c-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }

    /* =========================================================
       DATA TABLE 
       ========================================================= */
    .table-container {
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      padding: var(--spacing-lg);
      position: relative;
      z-index: 1;
    }

    ::ng-deep .crextio-table .p-datatable-wrapper {
      border-radius: var(--radius-card);
    }
    
    ::ng-deep .crextio-table .p-datatable-thead > tr > th {
      background: transparent !important;
      border: none !important;
      border-bottom: 1px dashed var(--c-border) !important;
      color: var(--c-text-light);
      font-size: 12px;
      font-weight: 400;
      padding: 16px 8px;
    }

    ::ng-deep .crextio-table .p-datatable-tbody > tr > td {
      border: none !important;
      border-bottom: 1px dashed var(--c-border) !important;
      padding: 16px 8px;
      color: var(--c-text-main);
      font-size: 14px;
      transition: background-color 0.2s ease, border-radius 0.2s ease;
    }

    ::ng-deep .crextio-table .p-datatable-tbody > tr:last-child > td {
      border-bottom: none !important;
    }

    /* Highlighted Row (Yellow background mimicking the image selection) */
    .row-highlight > td {
      background-color: var(--c-accent-yellow) !important;
      border-bottom-color: transparent !important;
    }
    .row-highlight > td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
    .row-highlight > td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }

    /* Custom Checkbox */
    ::ng-deep .crextio-table p-checkbox .p-checkbox-box {
      border-radius: 4px;
      border-color: var(--c-border);
      width: 18px;
      height: 18px;
    }
    ::ng-deep .crextio-table .row-highlight p-checkbox .p-checkbox-box {
      background: var(--c-text-main);
      border-color: var(--c-text-main);
    }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 500;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    
    .status-green { background: var(--c-status-green-bg); color: var(--c-status-green-text); }
    .status-green .status-dot { background: var(--c-status-green-dot); }
    
    .status-gray { background: var(--c-bg-card); color: var(--c-status-gray-text); border: 1px solid var(--c-border); }
    .status-gray .status-dot { background: var(--c-status-gray-dot); }
    
    .status-red { background: var(--c-status-red-bg); color: var(--c-status-red-text); }
    .status-red .status-dot { background: var(--c-status-red-dot); }

    .row-highlight .status-pill {
      background: rgba(255, 255, 255, 0.5);
      border-color: transparent;
    }

    /* Action Button */
    .action-btn {
      background: transparent;
      border: 1px solid var(--c-border);
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--c-text-muted);
      cursor: pointer;
      transition: 0.2s;
    }
    .row-highlight .action-btn { border-color: rgba(0,0,0,0.1); color: var(--c-text-main); }
    .action-btn:hover { background: var(--c-border); }

    /* =========================================================
       INPUTS & DIALOG 
       ========================================================= */
    ::ng-deep .pill-datepicker .p-inputtext, .pill-input {
      background: var(--c-bg-card);
      border: 1px solid var(--c-border);
      border-radius: var(--radius-pill);
      padding: 10px 16px;
      color: var(--c-text-main);
      font-family: inherit;
      transition: all 0.2s;
    }
    .pill-input { border-radius: 16px; resize: none; }
    ::ng-deep .pill-datepicker .p-inputtext:focus, .pill-input:focus {
      border-color: var(--c-text-muted);
      outline: none;
      box-shadow: none;
    }

    ::ng-deep .crextio-dialog .p-dialog-header {
      background: var(--c-bg-card);
      border-bottom: 1px dashed var(--c-border);
      border-top-left-radius: var(--radius-card);
      border-top-right-radius: var(--radius-card);
    }
    ::ng-deep .crextio-dialog .p-dialog-content {
      background: var(--c-bg-card);
      border-bottom-left-radius: var(--radius-card);
      border-bottom-right-radius: var(--radius-card);
      padding-top: var(--spacing-md);
    }

    .info-label {
      font-size: 12px;
      color: var(--c-text-muted);
      margin-left: 12px;
    }

    .btn-text {
      background: transparent;
      border: none;
      color: var(--c-text-muted);
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary {
      background: var(--c-text-main);
      color: #FFF;
      border: none;
      border-radius: var(--radius-pill);
      padding: 10px 24px;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .slide-down { animation: slideDown 0.4s ease forwards; opacity: 0; }
  `]
})
export class MyDailyAttendanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  selectedMonth: Date = new Date('2026-06-01'); // Adjusted based on your API response context
  records = signal<any[]>([]);
  summary = signal<any>(null);

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

    const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const end = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    this.hrmsService.getMyAttendance({ fromDate: start, toDate: end }).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        return of({ data: { records: [], summary: {} } });
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      this.records.set(res?.data?.records || []);
      this.summary.set(res?.data?.summary || { present: 0, totalWorkHours: 0, absent: 0, total: 0 });
    });
  }

  canRegularize(record: any): boolean {
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

    this.hrmsService.regularizeAttendance(this.selectedRecord._id, payload).pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => {
        this.isSubmitting.set(false);
        this.displayRegularize = false;
      }), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message || 'Attendance regularization submitted.')
        this.loadMyAttendance();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'present': return 'green';
      case 'absent': return 'gray'; // In the reference, 'absent' has a gray dot
      case 'late': case 'half_day': return 'red';
      default: return 'gray';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
