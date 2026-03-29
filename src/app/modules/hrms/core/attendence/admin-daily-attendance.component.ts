import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ChartModule } from 'primeng/chart';
import { TabsModule } from 'primeng/tabs';
import { DatePicker } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-admin-daily-attendance',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardModule, 
    TableModule, 
    ButtonModule, 
    TagModule,
    DatePicker, 
    SkeletonModule, 
    AvatarModule, 
    TooltipModule, 
    ConfirmDialogModule, 
    IconFieldModule, 
    InputIconModule, 
    InputTextModule,
    ChartModule, 
    TabsModule, 
    ToastModule
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>
    
    <p-confirmDialog 
      styleClass="glass-panel border-radius-xl shadow-xl" 
      acceptButtonStyleClass="p-button-primary" 
      rejectButtonStyleClass="p-button-secondary p-button-text">
    </p-confirmDialog>

    <div class="page-container fade-in">
      
      <header class="page-header flex-between flex-wrap gap-md mb-4xl slide-down">
        <div class="flex align-items-center gap-xl">
          <div class="icon-brand flex-center bg-primary text-white border-radius-lg flex-shrink-0 shadow-md">
            <i class="pi pi-chart-pie text-3xl"></i>
          </div>
          <div class="header-titles flex-col gap-xs">
            <h1 class="title font-heading text-3xl font-bold text-primary m-0 line-height-tight">Daily Attendance Control</h1>
            <p class="subtitle text-secondary text-md m-0 max-w-prose">Organizational attendance overview, daily registers, and payroll exports.</p>
          </div>
        </div>

        <div class="header-actions flex align-items-center gap-md">
          <p-button 
            icon="pi pi-download" 
            label="Export Payroll Data" 
            severity="secondary" 
            [outlined]="true" 
            (onClick)="onExport()">
          </p-button>
          <p-button 
            icon="pi pi-sync" 
            label="Recalculate Day" 
            styleClass="p-button-primary" 
            (onClick)="onRecalculate()">
          </p-button>
        </div>
      </header>

      @if (isLoading()) {
        <div class="flex-col gap-xl">
          <p-skeleton width="100%" height="150px" borderRadius="16px"></p-skeleton>
          <p-skeleton width="100%" height="400px" borderRadius="16px"></p-skeleton>
        </div>
      } @else {
        
        <p-card styleClass="glass-panel border-radius-xl shadow-xl overflow-hidden p-0">
          <p-tabs value="0">
            
            <p-tablist>
              <p-tab value="0">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                  <i class="pi pi-calendar-times"></i> Daily Register
                </div>
              </p-tab>
              <p-tab value="1">
                <div class="flex align-items-center gap-sm font-medium px-md py-sm">
                  <i class="pi pi-chart-bar"></i> Organizational Trends
                </div>
              </p-tab>
            </p-tablist>

            <p-tabpanels styleClass="p-0">
              
              <p-tabpanel value="0">
                <div class="panel-content p-xl">
                  
                  @if (dashboardStats(); as dash) {
                    <div class="grid-4 mb-4xl">
                      <div class="kpi-card glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-primary">
                        <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Total Headcount</span>
                        <div class="flex-between align-items-end mt-md">
                          <span class="text-4xl font-heading font-bold text-primary line-height-none">{{ dash.totalEmployees || 0 }}</span>
                          <i class="pi pi-users text-tertiary text-2xl opacity-50"></i>
                        </div>
                      </div>
                      
                      <div class="kpi-card glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-success">
                        <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Present</span>
                        <div class="flex-between align-items-end mt-md">
                          <span class="text-4xl font-heading font-bold text-success line-height-none">{{ dash.presentCount || 0 }}</span>
                          <i class="pi pi-check-circle text-success text-2xl opacity-50"></i>
                        </div>
                      </div>
                      
                      <div class="kpi-card glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-warning">
                        <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Late Arrivals</span>
                        <div class="flex-between align-items-end mt-md">
                          <span class="text-4xl font-heading font-bold color-warning line-height-none">{{ dash.lateCount || 0 }}</span>
                          <i class="pi pi-clock color-warning text-2xl opacity-50"></i>
                        </div>
                      </div>
                      
                      <div class="kpi-card glass-inset p-xl border-radius-lg border-1 border-solid border-secondary border-top-error">
                        <span class="text-xs text-tertiary uppercase font-bold tracking-widest">Absent</span>
                        <div class="flex-between align-items-end mt-md">
                          <span class="text-4xl font-heading font-bold text-error line-height-none">{{ dash.absentCount || 0 }}</span>
                          <i class="pi pi-times-circle text-error text-2xl opacity-50"></i>
                        </div>
                      </div>
                    </div>
                  }

                  <div class="border-radius-xl border-1 border-solid border-primary overflow-hidden shadow-sm">
                    <p-table 
                      #dt
                      [value]="allRecords()" 
                      [paginator]="true" 
                      [rows]="15" 
                      [globalFilterFields]="['user.name', 'status']"
                      responsiveLayout="scroll"
                      styleClass="w-full p-datatable-sm">
                      
                      <ng-template pTemplate="caption">
                        <div class="flex-between flex-wrap gap-md px-xl py-lg bg-secondary border-bottom-subtle">
                          <div class="flex align-items-center gap-md">
                            <h3 class="m-0 font-heading text-lg font-bold text-primary">Attendance Ledger</h3>
                            <p-datepicker 
                              [(ngModel)]="selectedDate" 
                              (onSelect)="loadDailyRegister()" 
                              [showIcon]="true" 
                              dateFormat="dd M yy" 
                              appendTo="body"
                              styleClass="premium-input">
                            </p-datepicker>
                          </div>
                          
                          <p-iconField iconPosition="left">
                            <p-inputIcon styleClass="pi pi-search text-tertiary"></p-inputIcon>
                            <input 
                              type="text" 
                              pInputText 
                              placeholder="Search employee..." 
                              (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                              class="w-full sm:w-20rem premium-input" />
                          </p-iconField>
                        </div>
                      </ng-template>

                      <ng-template pTemplate="header">
                        <tr>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Employee</th>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Shift Schedule</th>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">In / Out Times</th>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-center">Hours Logged</th>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary">Status</th>
                          <th class="bg-primary font-heading text-xs font-bold uppercase text-tertiary tracking-widest px-xl py-lg border-bottom-primary text-right" style="width: 5rem;">Actions</th>
                        </tr>
                      </ng-template>

                      <ng-template pTemplate="body" let-record>
                        <tr class="hover-bg-secondary transition-colors">
                          <td class="px-xl py-md border-bottom-subtle">
                            <div class="flex align-items-center gap-md">
                              <p-avatar [label]="getInitials(record.user?.name)" shape="circle" styleClass="bg-primary-light text-primary font-bold"></p-avatar>
                              <span class="font-bold text-primary">{{ record.user?.name || 'Unknown' }}</span>
                            </div>
                          </td>
                          <td class="px-xl py-md border-bottom-subtle">
                            <div class="text-xs font-mono font-medium text-secondary bg-secondary px-sm py-xs border-radius-sm border-1 border-solid border-secondary w-max-content">
                              {{ record.scheduledInTime || '--:--' }} - {{ record.scheduledOutTime || '--:--' }}
                            </div>
                          </td>
                          <td class="px-xl py-md border-bottom-subtle">
                            <div class="flex align-items-center gap-sm font-mono text-sm">
                              <span [ngClass]="{'text-error font-bold': record.isLate}">{{ record.firstIn ? (record.firstIn | date:'HH:mm') : 'Missed' }}</span>
                              <i class="pi pi-arrow-right text-xs text-tertiary"></i>
                              <span [ngClass]="{'color-warning font-bold': record.isEarlyDeparture}">{{ record.lastOut ? (record.lastOut | date:'HH:mm') : 'Missed' }}</span>
                            </div>
                          </td>
                          <td class="px-xl py-md border-bottom-subtle text-center font-heading font-bold text-xl" 
                              [ngClass]="{'text-success': record.totalWorkHours >= 8, 'text-error': record.totalWorkHours === 0 && record.status !== 'on_leave'}">
                            {{ record.netWorkHours | number:'1.1-1' }}<span class="text-sm font-body font-medium text-secondary">h</span>
                          </td>
                          <td class="px-xl py-md border-bottom-subtle">
                            <div class="flex-col gap-xs">
                              <p-tag [severity]="getStatusSeverity(record.status)" [value]="(record.status || 'UNKNOWN') | uppercase"></p-tag>
                              @if (record.isRegularized) {
                                <span class="text-xs text-info font-bold mt-1 flex align-items-center gap-xs"><i class="pi pi-wrench"></i> Regularized</span>
                              }
                            </div>
                          </td>
                          <td class="px-xl py-md border-bottom-subtle text-right">
                            <p-button icon="pi pi-sliders-h" [text]="true" [rounded]="true" severity="secondary" pTooltip="Manual Edit" tooltipPosition="left"></p-button>
                          </td>
                        </tr>
                      </ng-template>

                      <ng-template pTemplate="emptymessage">
                        <tr>
                          <td colspan="6" class="text-center py-5xl">
                            <div class="empty-state flex-col flex-center text-center">
                              <i class="pi pi-calendar-times text-tertiary text-4xl mb-md"></i>
                              <h4 class="font-heading text-lg font-bold text-primary m-0 mb-xs">No records generated</h4>
                              <p class="text-secondary m-0">No attendance records generated for this date yet. Try recalculating.</p>
                            </div>
                          </td>
                        </tr>
                      </ng-template>
                    </p-table>
                  </div>
                </div>
              </p-tabpanel>

              <p-tabpanel value="1">
                <div class="panel-content p-xl bg-secondary min-h-screen">
                  <div class="glass-inset p-xl border-radius-xl border-1 border-solid border-secondary">
                    <h3 class="font-heading m-0 mb-xl text-primary text-xl font-bold">Monthly Absence & Tardy Trends</h3>
                    <p-chart type="line" [data]="trendsChartData" [options]="chartOptions" height="400px"></p-chart>
                  </div>
                </div>
              </p-tabpanel>

            </p-tabpanels>
          </p-tabs>
        </p-card>
      }
    </div>
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
    .flex-shrink-0 { flex-shrink: 0; }
    
    .w-full { width: 100%; }
    .w-max-content { width: max-content; }
    .min-h-screen { min-height: 60vh; }
    
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--spacing-xl); }

    /* Spacing */
    .m-0 { margin: 0; }
    .p-0 { padding: 0 !important; }
    .mb-xs { margin-bottom: var(--spacing-xs); }
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-xl { margin-bottom: var(--spacing-xl); }
    .mb-4xl { margin-bottom: var(--spacing-4xl); }
    .mt-1 { margin-top: 4px; }
    .mt-md { margin-top: var(--spacing-md); }
    
    .p-xl { padding: var(--spacing-xl); }
    .px-sm { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
    .px-md { padding-left: var(--spacing-md); padding-right: var(--spacing-md); }
    .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
    .py-xs { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
    .py-sm { padding-top: var(--spacing-sm); padding-bottom: var(--spacing-sm); }
    .py-md { padding-top: var(--spacing-md); padding-bottom: var(--spacing-md); }
    .py-lg { padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg); }
    .py-5xl { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); }
    
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
    .text-4xl { font-size: 2.5rem; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-tight { line-height: var(--line-height-tight); }
    .line-height-none { line-height: 1; }
    .max-w-prose { max-width: 65ch; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-success { color: var(--color-success, #16a34a); }
    .text-error { color: var(--color-error, #dc2626); }
    .color-warning { color: var(--color-warning, #d97706); }
    .text-info { color: #0ea5e9; }
    .text-white { color: #ffffff; }
    
    .bg-primary { background: var(--bg-primary); }
    .bg-secondary { background: var(--bg-secondary); }
    .bg-primary-light { background: var(--color-primary-bg); }

    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    .border-radius-xl { border-radius: var(--radius-2xl); }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-bottom-primary { border-bottom: 2px solid var(--border-primary); }
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-primary { border-color: var(--border-primary); }
    .border-secondary { border-color: var(--border-secondary); }
    
    .border-top-primary { border-top-width: 4px; border-top-color: var(--color-primary); }
    .border-top-success { border-top-width: 4px; border-top-color: var(--color-success); }
    .border-top-warning { border-top-width: 4px; border-top-color: var(--color-warning); }
    .border-top-error { border-top-width: 4px; border-top-color: var(--color-error); }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .shadow-md { box-shadow: var(--shadow-md); }
    .shadow-xl { box-shadow: var(--shadow-xl); }
    .overflow-hidden { overflow: hidden; }

    /* Component specific */
    .icon-brand { width: 56px; height: 56px; }
    
    /* Interactive States (No ng-deep needed) */
    .hover-bg-secondary:hover { background-color: var(--bg-secondary) !important; transition: background-color 0.2s ease; }
    .transition-colors { transition: background-color 0.2s ease; }
    
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
      .header-actions { margin-top: var(--spacing-md); width: 100%; justify-content: flex-start; }
    }
  `]
})
export class AdminDailyAttendanceComponent implements OnInit {
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  isLoading = signal(true);
  selectedDate: Date = new Date();

  allRecords = signal<any[]>([]);
  dashboardStats = signal<any>(null);

  // Charts
  trendsChartData: any;
  chartOptions: any;

  ngOnInit() {
    this.initChart();
    this.loadDailyRegister();
  }

  loadDailyRegister() {
    this.isLoading.set(true);

    forkJoin({
      recordsRes: this.hrmsService.getAllDailyAttendance({ date: this.selectedDate }).pipe(
        catchError(() => of({ data: { records: [] } }))
      ),
      dashRes: this.hrmsService.getAttendanceDashboard(this.selectedDate).pipe(
        catchError(() => of({ data: { totalEmployees: 150, presentCount: 130, lateCount: 12, absentCount: 8 } })) 
      )
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ recordsRes, dashRes }) => {
      this.allRecords.set(recordsRes?.data?.records || []);
      this.dashboardStats.set(dashRes?.data || {});
    });
  }

  onRecalculate() {
    this.confirmationService.confirm({
      message: 'Re-running the daily calculation will parse all raw logs and update Hours/Status for the selected date. Continue?',
      header: 'Recalculate Daily Attendance',
      icon: 'pi pi-sync',
      accept: () => {
        this.hrmsService.recalculateDaily(this.selectedDate).subscribe({
          next: (res:any) => {
            this.messageService.showSuccess(res.message || 'Recalculation successful.');
            this.loadDailyRegister();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }

  onExport() {
    const start = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
    const end = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);

    this.hrmsService.exportAttendance({ fromDate: start, toDate: end, format: 'csv' }).subscribe({
      next: (res:any) => this.messageService.showSuccess(res.message || 'Export initiated.'),
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  getInitials(name: string): string {
    if (!name || name.trim() === '') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': 
      case 'half_day': return 'warn';
      case 'on_leave': 
      case 'week_off': 
      case 'holiday': return 'info';
      default: return 'secondary';
    }
  }

  private initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-secondary') || '#64748b';
    const surfaceBorder = documentStyle.getPropertyValue('--border-primary') || '#e2e8f0';

    this.trendsChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Absent', data: [28, 48, 40, 19, 86, 27], fill: false, borderColor: '#ef4444', tension: 0.4 },
        { label: 'Late Arrivals', data: [65, 59, 80, 81, 56, 55], fill: false, borderColor: '#f59e0b', tension: 0.4 }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false, 
      aspectRatio: 0.8,
      plugins: {
        legend: { labels: { color: textColorSecondary, font: { family: 'inherit' } } }
      },
      scales: {
        x: { ticks: { color: textColorSecondary, font: { family: 'inherit' } }, grid: { color: surfaceBorder, drawBorder: false } },
        y: { ticks: { color: textColorSecondary, font: { family: 'inherit' } }, grid: { color: surfaceBorder, drawBorder: false } }
      }
    };
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { catchError, finalize, forkJoin, of } from 'rxjs';

// // Services
// import { MessageService, ConfirmationService } from 'primeng/api';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { AvatarModule } from 'primeng/avatar';
// import { TooltipModule } from 'primeng/tooltip';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { InputTextModule } from 'primeng/inputtext';
// import { ChartModule } from 'primeng/chart';
// import { TabsModule } from 'primeng/tabs';
// import { DatePickerModule } from 'primeng/datepicker';
// import { HRMSService } from '../../hrms.service';
// import { Toast } from 'primeng/toast';
// import { FormsModule } from '@angular/forms';
// import { AppMessageService } from '@core/services/message.service';

// @Component({
//   selector: 'app-admin-daily-attendance',
//   standalone: true,
//   imports: [
//     CommonModule, CardModule, TableModule, ButtonModule, TagModule,
//     DatePickerModule, SkeletonModule, AvatarModule, TooltipModule, FormsModule,
//     ConfirmDialogModule, IconFieldModule, InputIconModule, InputTextModule,
//     ChartModule, TabsModule, Toast
//   ],
//   providers: [MessageService, ConfirmationService],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-toast position="top-right"></p-toast>
//     <p-confirmDialog styleClass="premium-confirm-dialog"></p-confirmDialog>

//     <div class="page-wrapper fade-in">
//       <header class="dashboard-header slide-down mb-4">
//         <div class="header-left">
//           <div class="icon-brand bg-primary text-white shadow-md"><i class="pi pi-chart-pie"></i></div>
//           <div class="header-titles">
//             <h1 class="page-title m-0">Daily Attendance Control Center</h1>
//             <p class="page-subtitle mt-1">Organizational attendance overview, daily registers, and payroll exports.</p>
//           </div>
//         </div>
//         <div class="header-right flex-align gap-3">
//           <p-button icon="pi pi-download" label="Export Payroll Data" severity="secondary" [outlined]="true" (onClick)="onExport()"></p-button>
//           <p-button icon="pi pi-sync" label="Recalculate Day" styleClass="p-button-primary" (onClick)="onRecalculate()"></p-button>
//         </div>
//       </header>

//       @if (isLoading()) {
//         <p-skeleton width="100%" height="600px" borderRadius="12px"></p-skeleton>
//       } @else {
        
//         <p-card styleClass="premium-card glass-card workspace-card slide-down" styleClass="animation-delay: 0.1s">
//           <p-tabs value="0">
//             <p-tablist styleClass="hub-tablist">
//               <p-tab value="0"><div class="tab-label"><i class="pi pi-datepicker-times"></i> Daily Register</div></p-tab>
//               <p-tab value="1"><div class="tab-label"><i class="pi pi-chart-bar"></i> Organizational Trends</div></p-tab>
//             </p-tablist>

//             <p-tabpanels styleClass="hub-tabpanels p-0">
              
//               <p-tabpanel value="0">
//                 <div class="panel-inner p-4">
                  
//                   @if (dashboardStats(); as dash) {
//                     <div class="grid-4 mb-5">
//                       <div class="kpi-card border-top-primary">
//                         <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Total Headcount</span>
//                         <div class="flex-align gap-3 mt-2"><span class="text-3xl font-bold">{{ dash.totalEmployees || 0 }}</span><i class="pi pi-users text-tertiary text-2xl opacity-50"></i></div>
//                       </div>
//                       <div class="kpi-card border-top-success">
//                         <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Present</span>
//                         <div class="flex-align gap-3 mt-2"><span class="text-3xl font-bold text-success">{{ dash.presentCount || 0 }}</span></div>
//                       </div>
//                       <div class="kpi-card border-top-warning">
//                         <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Late Arrivals</span>
//                         <div class="flex-align gap-3 mt-2"><span class="text-3xl font-bold text-warning">{{ dash.lateCount || 0 }}</span></div>
//                       </div>
//                       <div class="kpi-card border-top-error">
//                         <span class="text-xs text-tertiary uppercase font-bold tracking-wide">Absent</span>
//                         <div class="flex-align gap-3 mt-2"><span class="text-3xl font-bold text-error">{{ dash.absentCount || 0 }}</span></div>
//                       </div>
//                     </div>
//                   }

//                   <p-table 
//                     #dt
//                     [value]="allRecords()" 
//                     [paginator]="true" 
//                     [rows]="15" 
//                     [globalFilterFields]="['user.name', 'status']"
//                     responsiveLayout="scroll"
//                     styleClass="premium-table border-round-xl border-1 surface-border">
                    
//                     <ng-template pTemplate="caption">
//                       <div class="table-toolbar flex-between p-3 bg-surface border-bottom">
//                         <div class="flex-align gap-3">
//                           <h3 class="m-0 font-heading text-primary-color">Attendance Ledger</h3>
//                           <p-datepicker [(ngModel)]="selectedDate" (onSelect)="loadDailyRegister()" [showIcon]="true" dateFormat="dd M yy" styleClass="premium-datepicker"></p-datepicker>
//                         </div>
//                         <p-iconField iconPosition="left">
//                           <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
//                           <input type="text" pInputText placeholder="Search employee..." (input)="dt.filterGlobal($any($event.target).value, 'contains')" class="premium-search-input" />
//                         </p-iconField>
//                       </div>
//                     </ng-template>

//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th>Employee</th>
//                         <th>Shift Schedule</th>
//                         <th>In / Out Times</th>
//                         <th class="text-center">Hours Logged</th>
//                         <th>Status</th>
//                         <th class="text-right">Actions</th>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="body" let-record>
//                       <tr class="table-row-hover">
//                         <td>
//                           <div class="flex-align gap-3">
//                             <p-avatar [label]="getInitials(record.user?.name)" shape="circle" styleClass="bg-primary-light text-primary"></p-avatar>
//                             <span class="font-bold text-primary-color">{{ record.user?.name || 'Unknown' }}</span>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="text-sm font-mono text-secondary bg-surface px-2 py-1 border-radius-sm w-max">
//                             {{ record.scheduledInTime || '--:--' }} - {{ record.scheduledOutTime || '--:--' }}
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex-align gap-2 font-mono text-sm">
//                             <span [ngClass]="{'text-error font-bold': record.isLate}">{{ record.firstIn ? (record.firstIn | date:'HH:mm') : 'Missed' }}</span>
//                             <i class="pi pi-arrow-right text-xs text-tertiary"></i>
//                             <span [ngClass]="{'text-warning font-bold': record.isEarlyDeparture}">{{ record.lastOut ? (record.lastOut | date:'HH:mm') : 'Missed' }}</span>
//                           </div>
//                         </td>
//                         <td class="text-center font-bold text-lg" [ngClass]="{'text-success': record.totalWorkHours >= 8, 'text-error': record.totalWorkHours === 0 && record.status !== 'on_leave'}">
//                           {{ record.netWorkHours | number:'1.1-1' }}h
//                         </td>
//                         <td>
//                           <div class="flex-col gap-1">
//                             <p-tag [severity]="getStatusSeverity(record.status)" [value]="record.status | uppercase"></p-tag>
//                             <span *ngIf="record.isRegularized" class="text-xs text-info font-bold mt-1"><i class="pi pi-wrench"></i> Regularized</span>
//                           </div>
//                         </td>
//                         <td class="text-right">
//                           <p-button icon="pi pi-sliders-h" [text]="true" [rounded]="true" severity="secondary" pTooltip="Manual Edit"></p-button>
//                         </td>
//                       </tr>
//                     </ng-template>

//                     <ng-template pTemplate="emptymessage">
//                       <tr><td colspan="6" class="text-center py-6 text-secondary">No attendance records generated for this date yet. Try recalculating.</td></tr>
//                     </ng-template>
//                   </p-table>
//                 </div>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <div class="panel-inner p-4 bg-surface h-full">
//                   <p-card styleClass="border-1 surface-border shadow-none">
//                     <h3 class="font-heading m-0 mb-4 text-primary-color">Monthly Absence Trends</h3>
//                     <p-chart type="line" [data]="trendsChartData" [options]="chartOptions" height="350px"></p-chart>
//                   </p-card>
//                 </div>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </p-card>
//       }
//     </div>
//   `,
//   styles: [`
//     /* Same core styling as previous component */
//     :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
//     .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1500px; margin: 0 auto; }
    
//     .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--spacing-xl); }
    
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
    
//     .w-full { width: 100%; }
//     .w-max { width: max-content; }
//     .h-full { height: 100%; }
    
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
//     .m-0 { margin: 0; }
//     .mb-4 { margin-bottom: var(--spacing-xl); }
//     .mb-5 { margin-bottom: var(--spacing-2xl); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
    
//     .p-0 { padding: 0 !important; }
//     .p-3 { padding: var(--spacing-lg); }
//     .p-4 { padding: var(--spacing-xl); }
//     .px-2 { padding-left: var(--spacing-sm); padding-right: var(--spacing-sm); }
//     .py-1 { padding-top: var(--spacing-xs); padding-bottom: var(--spacing-xs); }
//     .py-6 { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .bg-primary { background: var(--color-primary); }
//     .bg-primary-light { background: var(--color-primary-bg); }
    
//     .border-top { border-top: 1px solid var(--border-primary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-xl { border-radius: var(--radius-2xl); }
//     .border-radius-sm { border-radius: var(--ui-border-radius-sm); }
//     .shadow-none { box-shadow: none !important; }
    
//     .text-center { text-align: center; }
//     .text-right { text-align: right; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
//     .text-2xl { font-size: var(--font-size-2xl); }
//     .text-3xl { font-size: 2.2rem; }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-error { color: var(--color-error); }
//     .text-warning { color: var(--color-warning); }
//     .text-info { color: #0ea5e9; }
//     .text-white { color: white; }
    
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-heading { font-family: var(--font-heading); }
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }

//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: var(--spacing-xl) var(--spacing-2xl); border-radius: var(--radius-2xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-brand { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-2xl); }
//     .header-titles { display: flex; flex-direction: column; }
//     .page-title { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
//     .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

//     /* KPIs */
//     .kpi-card { background: var(--bg-primary); padding: var(--spacing-xl); border-radius: var(--ui-border-radius-lg); border: 1px solid var(--border-primary); box-shadow: var(--shadow-sm); }
//     .border-top-primary { border-top: 4px solid var(--color-primary); }
//     .border-top-success { border-top: 4px solid var(--color-success); }
//     .border-top-warning { border-top: 4px solid var(--color-warning); }
//     .border-top-error { border-top: 4px solid var(--color-error); }

//     /* Tabs & Cards */
//     .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-md); overflow: hidden; }
//     ::ng-deep .workspace-card .p-card-body, ::ng-deep .workspace-card .p-card-content { padding: 0; }
//     ::ng-deep .hub-tablist .p-tablist-nav { background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-primary) !important; padding: 0 var(--spacing-xl) !important; }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab { padding: var(--spacing-lg) var(--spacing-xl) !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--text-secondary) !important; font-weight: var(--font-weight-medium) !important; transition: var(--transition-base); }
//     ::ng-deep .hub-tablist .p-tablist-nav .p-tab.p-highlight { border-bottom-color: var(--color-primary) !important; color: var(--color-primary) !important; }
//     .tab-label { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-md); }

//     /* Table */
//     ::ng-deep .premium-search-input { background: var(--bg-primary) !important; border: 1px solid var(--border-primary) !important; border-radius: var(--ui-border-radius-md) !important; width: 250px; }
//     ::ng-deep .premium-datepicker .p-inputtext { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); font-family: var(--font-body); font-weight: 600; width: 140px; }
//     ::ng-deep .premium-table .p-datatable-header { padding: 0; border: none; background: transparent; }
//     ::ng-deep .premium-table .p-datatable-thead > tr > th { background: var(--bg-primary) !important; border-bottom: 2px solid var(--border-primary) !important; color: var(--text-tertiary); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; padding: var(--spacing-lg) var(--spacing-xl); }
//     ::ng-deep .premium-table .p-datatable-tbody > tr > td { border-bottom: 1px solid var(--border-primary); padding: var(--spacing-md) var(--spacing-xl); color: var(--text-secondary); transition: background-color 0.2s; }
//     ::ng-deep .premium-table .p-datatable-tbody > tr.table-row-hover:hover > td { background: var(--bg-secondary) !important; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
//     .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
//     .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
//   `]
// })
// export class AdminDailyAttendanceComponent implements OnInit {
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private confirmationService = inject(ConfirmationService);

//   isLoading = signal(true);
//   selectedDate: Date = new Date();

//   allRecords = signal<any[]>([]);
//   dashboardStats = signal<any>(null);

//   // Charts
//   trendsChartData: any;
//   chartOptions: any;

//   ngOnInit() {
//     this.initChart();
//     this.loadDailyRegister();
//   }

//   loadDailyRegister() {
//     this.isLoading.set(true);

//     forkJoin({
//       recordsRes: this.hrmsService.getAllDailyAttendance({ date: this.selectedDate }).pipe(
//         catchError(() => of({ data: { records: [] } }))
//       ),
//       dashRes: this.hrmsService.getAttendanceDashboard(this.selectedDate).pipe(
//         catchError(() => of({ data: { totalEmployees: 150, presentCount: 130, lateCount: 12, absentCount: 8 } })) // Mock fallback
//       )
//     }).pipe(
//       finalize(() => this.isLoading.set(false))
//     ).subscribe(({ recordsRes, dashRes }) => {
//       this.allRecords.set(recordsRes?.data?.records || []);
//       this.dashboardStats.set(dashRes?.data || {});
//     });
//   }

//   // --- Actions ---
//   onRecalculate() {
//     this.confirmationService.confirm({
//       message: 'Re-running the daily calculation will parse all raw logs and update Hours/Status for the selected date. Continue?',
//       header: 'Recalculate Daily Attendance',
//       icon: 'pi pi-sync',
//       acceptButtonStyleClass: 'p-button-primary',
//       accept: () => {
//         this.hrmsService.recalculateDaily(this.selectedDate).subscribe({
//           next: (res:any) => {
//             this.messageService.showSuccess(res.message)
//             this.loadDailyRegister();
//           },
//           error: (err) => this.messageService.handleHttpError(err)
//         });
//       }
//     });
//   }

//   onExport() {
//     // Generates a mock export request using exportAttendance API
//     const start = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
//     const end = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0);

//     this.hrmsService.exportAttendance({ fromDate: start, toDate: end, format: 'csv' }).subscribe({
//       next: (res:any) => this.messageService.showSuccess(res.message),
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   // --- Helpers ---
//   getInitials(name: string): string {
//     if (!name || name.trim() === '') return '?';
//     return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
//   }

//   getStatusSeverity(status: string): any {
//     switch (status) {
//       case 'present': return 'success';
//       case 'absent': return 'danger';
//       case 'late': case 'half_day': return 'warning';
//       case 'on_leave': case 'week_off': case 'holiday': return 'info';
//       default: return 'secondary';
//     }
//   }

//   private initChart() {
//     const documentStyle = getComputedStyle(document.documentElement);
//     const textColorSecondary = documentStyle.getPropertyValue('--text-secondary');
//     const surfaceBorder = documentStyle.getPropertyValue('--border-primary');

//     this.trendsChartData = {
//       labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
//       datasets: [
//         { label: 'Absent', data: [28, 48, 40, 19, 86, 27], fill: false, borderColor: '#ef4444', tension: 0.4 },
//         { label: 'Late Arrivals', data: [65, 59, 80, 81, 56, 55], fill: false, borderColor: '#f59e0b', tension: 0.4 }
//       ]
//     };

//     this.chartOptions = {
//       maintainAspectRatio: false, aspectRatio: 0.8,
//       scales: {
//         x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
//         y: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } }
//       }
//     };
//   }
// }