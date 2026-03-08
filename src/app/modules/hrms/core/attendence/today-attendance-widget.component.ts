import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-today-attendance-widget',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, SkeletonModule, ProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-card styleClass="premium-card glass-card widget-card">
      <div class="flex-between mb-3 border-bottom pb-2">
        <h3 class="font-heading m-0 text-primary-color flex-align gap-2"><i class="pi pi-sun text-warning"></i> Today's Status</h3>
        <p-button icon="pi pi-arrow-right" [text]="true" [rounded]="true" pTooltip="Go to Timesheet"></p-button>
      </div>

      @if (isLoading()) {
        <div class="flex-col gap-3">
          <p-skeleton height="2rem"></p-skeleton>
          <p-skeleton height="4rem"></p-skeleton>
        </div>
      } @else if (todayData(); as data) {
        
        <div class="flex-col gap-3">
          <div class="flex-between">
            <span class="text-sm font-bold text-secondary uppercase tracking-wide">Status</span>
            <p-tag [severity]="getStatusSeverity(data.status)" [value]="data.status | uppercase" styleClass="text-xs"></p-tag>
          </div>

          <div class="grid-2 bg-surface border-radius-md p-3 border-1 surface-border mt-1">
            <div class="flex-col border-right pr-2">
              <span class="text-xs text-tertiary">First In</span>
              <span class="font-mono font-bold text-primary-color text-lg">{{ data.firstIn ? (data.firstIn | date:'HH:mm') : '--:--' }}</span>
              <span *ngIf="data.isLate" class="text-xs text-error font-bold mt-1">LATE</span>
            </div>
            <div class="flex-col pl-2">
              <span class="text-xs text-tertiary">Last Out</span>
              <span class="font-mono font-bold text-primary-color text-lg">{{ data.lastOut ? (data.lastOut | date:'HH:mm') : '--:--' }}</span>
            </div>
          </div>

          <div class="flex-col gap-1 mt-2">
            <div class="flex-between text-xs text-secondary">
              <span>Total Logged</span>
              <span class="font-bold">{{ data.netWorkHours | number:'1.1-1' }}h / 8.0h</span>
            </div>
            <p-progressBar [value]="getPercentage(data.netWorkHours, 8)" [showValue]="false" styleClass="h-2"></p-progressBar>
          </div>
          
          @if (data.todaysLogs?.length > 0) {
            <div class="text-xs text-tertiary text-center mt-2 border-top pt-2">
              {{ data.todaysLogs.length }} punches recorded today.
            </div>
          }
        </div>
      } @else {
        <div class="text-center text-secondary py-4 text-sm">No data for today.</div>
      }
    </p-card>
  `,
  styles: [`
    .widget-card { border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); background: var(--bg-primary); }
    ::ng-deep .widget-card .p-card-body { padding: var(--spacing-lg); }
    ::ng-deep .widget-card .p-card-content { padding: 0; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .gap-1 { gap: var(--spacing-xs); }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    
    .m-0 { margin: 0; }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .pb-2 { padding-bottom: var(--spacing-sm); }
    .pt-2 { padding-top: var(--spacing-sm); }
    .p-3 { padding: var(--spacing-lg); }
    .pr-2 { padding-right: var(--spacing-sm); }
    .pl-2 { padding-left: var(--spacing-sm); }
    .py-4 { padding-top: var(--spacing-xl); padding-bottom: var(--spacing-xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-top { border-top: 1px dashed var(--border-secondary); }
    .border-right { border-right: 1px solid var(--border-primary); }
    .border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    .h-2 { height: 0.5rem; }
    .text-center { text-align: center; }
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-warning { color: var(--color-warning); }
    .text-error { color: var(--color-error); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.05em; }

    ::ng-deep .p-progressbar { background: rgba(0,0,0,0.05) !important; border-radius: 4px; overflow: hidden; }
    ::ng-deep .p-progressbar .p-progressbar-value { background: var(--color-primary); border-radius: 4px; }
  `]
})
export class TodayAttendanceWidgetComponent implements OnInit {
  private hrmsService = inject(HRMSService);

  isLoading = signal(true);
  todayData = signal<any>(null);

  ngOnInit() {
    this.hrmsService.getTodayAttendance().pipe(
      catchError(() => of({ data: null }))
    ).subscribe((res: any) => {
      this.todayData.set(res?.data || null);
      this.isLoading.set(false);
    });
  }

  getPercentage(current: number, target: number): number {
    if (!current || !target) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  getStatusSeverity(status: string): any {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': case 'half_day': return 'warning';
      case 'on_leave': case 'holiday': return 'info';
      default: return 'secondary';
    }
  }
}