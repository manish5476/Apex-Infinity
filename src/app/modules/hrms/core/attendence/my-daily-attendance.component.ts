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

// Services
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
      
      <header class="crextio-header mb-5 slide-down">
        <div class="flex-align gap-4">
          <h1 class="page-title">My Attendance</h1>
          
          <div class="nav-pills hidden-mobile">
            <span class="nav-pill active">Timesheet</span>
            <span class="nav-pill">Requests</span>
            <span class="nav-pill">Overtime</span>
          </div>
        </div>
        
        <div class="header-controls">
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
            <div class="stat-group">
              <div class="stat-item text-center">
                <span class="stat-label">Present</span>
                <div class="stat-circle active">{{ s.present || 0 }}</div>
              </div>
              
              <div class="stat-divider"></div>
              
              <div class="stat-item text-center">
                <span class="stat-label">Absent</span>
                <div class="stat-circle">{{ s.absent || 0 }}</div>
              </div>
            </div>

            <div class="stat-group ml-6">
              <div class="stat-item text-center">
                <span class="stat-label">Work Hours</span>
                <div class="stat-pill-wide">{{ s.totalWorkHours || 0 }}h</div>
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
                <th style="width: 4rem"></th>
                <th>DATE</th>
                <th>SCHEDULE</th>
                <th>FIRST IN</th>
                <th>LAST OUT</th>
                <th>NET HOURS</th>
                <th>STATUS</th>
                <th class="text-center">ACTION</th>
              </tr>
            </ng-template>
    
            <ng-template pTemplate="body" let-record let-rowIndex="rowIndex">
              <tr class="table-row-hover" [class.row-highlight]="record.status === 'absent'">
                <td class="text-center">
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
    
                <td [ngClass]="{'text-error font-bold': record.isLate, 'font-bold': record.firstIn}">
                  {{ record.firstIn ? (record.firstIn | date:'HH:mm') : '--:--' }}
                  @if (record.isLate) {
                    <i class="pi pi-exclamation-circle text-xs ml-1 text-error" pTooltip="Late Arrival"></i>
                  }
                </td>
    
                <td [ngClass]="{'text-warning font-bold': record.isEarlyDeparture, 'font-bold': record.lastOut}">
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
    
                <td class="text-center">
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
    
    <p-dialog [modal]="true" header="Request Regularization" [(visible)]="displayRegularize" [modal]="true" [style]="{width: '450px'}" styleClass="crextio-dialog" appendTo="body" [blockScroll]="true" [breakpoints]="{'1199px': '75vw', '575px': '90vw'}" [dismissableMask]="true">
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
      
      --c-status-gray-text: #616161;
      --c-status-gray-dot: #9E9E9E;
      --c-status-red-dot: #F44336;
      
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
      padding: 3rem;
      width: 100%; /* Fully spans the host container */
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      min-height: 80vh;
    }

    /* Radial background gradient mimicking the image */
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
    .ml-6 { margin-left: 3rem; }
    .pt-4 { padding-top: var(--spacing-md); }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-error { color: var(--c-status-red-dot); }
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
      font-size: 32px;
      font-weight: 500;
      color: var(--c-text-main);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .header-controls { display: flex; align-items: center; gap: var(--spacing-md); }
    .nav-pills { display: flex; background: transparent; gap: 8px; margin-left: 1rem; }

    .nav-pill {
      padding: 10px 20px;
      border-radius: var(--radius-pill);
      color: var(--c-text-muted);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-pill.active {
      background: var(--c-text-main);
      color: #FFF;
      font-weight: 500;
    }

    /* =========================================================
       SUMMARY BARS (Matched exactly to image)
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

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .stat-label {
      font-size: 12px;
      color: var(--c-text-muted);
    }

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
      background: var(--c-bg-app); /* Transparent-like */
      color: var(--c-text-muted);
    }

    .stat-circle.active {
      background: var(--c-accent-yellow);
      border-color: var(--c-accent-yellow);
      color: var(--c-text-main);
    }

    .stat-divider {
      width: 60px;
      height: 4px;
      background: var(--c-border);
      border-radius: 4px;
      margin-bottom: 20px; /* Align with circle centers */
    }

    .stat-pill-wide {
      padding: 0 24px;
      height: 44px;
      border-radius: var(--radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      border: 1px dashed var(--c-border);
      background: var(--c-bg-app);
      color: var(--c-text-muted);
    }

    /* =========================================================
       FLOATING DATA TABLE 
       ========================================================= */
    .table-container {
      background: var(--c-bg-card);
      border-radius: var(--radius-card);
      padding: 10px 30px 30px 30px;
      position: relative;
      z-index: 1;
    }

    ::ng-deep .crextio-table table {
      border-collapse: separate !important;
      border-spacing: 0 12px !important; /* Creates the isolated floating rows */
    }
    
    ::ng-deep .crextio-table .p-datatable-thead > tr > th {
      background: transparent !important;
      border: none !important;
      border-bottom: 1px dashed var(--c-border) !important;
      color: var(--c-text-light);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 16px 8px 12px 8px;
    }

    ::ng-deep .crextio-table .p-datatable-tbody > tr {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    ::ng-deep .crextio-table .p-datatable-tbody > tr > td {
      border: none !important;
      padding: 16px 8px;
      color: var(--c-text-main);
      font-size: 14px;
      background: transparent;
    }

    ::ng-deep .crextio-table .p-datatable-tbody > tr > td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; padding-left: 20px;}
    ::ng-deep .crextio-table .p-datatable-tbody > tr > td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; padding-right: 20px;}

    /* Highlighted Row (Yellow matching image) */
    ::ng-deep .crextio-table .p-datatable-tbody > tr.row-highlight > td {
      background: var(--c-accent-yellow) !important;
    }
    
    ::ng-deep .crextio-table .p-datatable-tbody > tr.row-highlight {
      box-shadow: 0 4px 15px rgba(252, 218, 104, 0.3);
    }

    /* Black Checkbox for selected states */
    ::ng-deep .crextio-table p-checkbox .p-checkbox-box {
      border-radius: 4px;
      border: 1px solid var(--c-text-muted);
      width: 20px;
      height: 20px;
      transition: 0.2s;
    }
    ::ng-deep .crextio-table p-checkbox .p-checkbox-box.p-highlight {
      background: var(--c-text-main) !important;
      border-color: var(--c-text-main) !important;
      color: #FFF !important;
    }
    ::ng-deep .crextio-table .row-highlight p-checkbox .p-checkbox-box {
      border-color: var(--c-text-main);
    }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 500;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--c-status-gray-dot);
    }
    
    .status-gray { background: var(--c-bg-app); color: var(--c-status-gray-text); border: 1px solid var(--c-border); }
    
    /* When inside a yellow row, make it white with no border */
    .row-highlight .status-pill {
      background: #FFFFFF;
      border-color: transparent;
      color: var(--c-status-gray-text);
    }

    /* Action Slider Button */
    .action-btn {
      background: transparent;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 8px;
      width: 42px;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--c-text-main);
      cursor: pointer;
      transition: 0.2s;
    }
    .action-btn:hover { background: rgba(0,0,0,0.05); }

    /* =========================================================
       INPUTS & DIALOG 
       ========================================================= */
    ::ng-deep .pill-datepicker .p-inputtext, .pill-input {
      background: var(--c-bg-card);
      border: 1px solid var(--c-border);
      border-radius: var(--radius-pill);
      padding: 12px 20px;
      color: var(--c-text-main);
      font-family: inherit;
      transition: all 0.2s;
      min-width: 200px;
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

    .info-label { font-size: 12px; color: var(--c-text-muted); margin-left: 12px; }

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
    
    @media (max-width: 768px) {
      .hidden-mobile { display: none !important; }
      :host { padding: 1rem; }
      .crextio-theme-wrapper { padding: 1.5rem; }
    }
  `]
})
export class MyDailyAttendanceComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  selectedMonth: Date = new Date('2026-06-01'); // Adjusted based on context
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
      case 'absent': return 'gray'; // Handled via specific styling inside row-highlight
      case 'late': case 'half_day': return 'red';
      default: return 'gray';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
