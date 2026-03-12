import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-today-attendance-widget',
  standalone: true,
  imports: [
    CommonModule, 
    CardModule, 
    ButtonModule, 
    TagModule, 
    SkeletonModule, 
    ProgressBarModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fade-in">
      <p-card styleClass="glass-panel border-radius-xl shadow-sm p-0 overflow-hidden w-full">
        
        <div class="p-xl flex-col h-full">
          
          <div class="flex-between mb-lg border-bottom-subtle pb-md">
            <h3 class="font-heading m-0 text-primary flex align-items-center gap-sm text-lg font-bold">
              <i class="pi pi-sun text-warning text-xl"></i> Today's Status
            </h3>
            <p-button icon="pi pi-arrow-right" [text]="true" [rounded]="true" size="small" severity="secondary" pTooltip="Go to Timesheet" tooltipPosition="left"></p-button>
          </div>

          @if (isLoading()) {
            <div class="flex-col gap-md mt-sm">
              <p-skeleton height="2rem" borderRadius="8px"></p-skeleton>
              <p-skeleton height="5rem" borderRadius="8px"></p-skeleton>
            </div>
          } @else if (todayData(); as data) {
            
            <div class="flex-col gap-md">
              <div class="flex-between align-items-center">
                <span class="text-xs font-bold text-tertiary uppercase tracking-widest">Status</span>
                <p-tag [severity]="getStatusSeverity(data.status)" [value]="(data.status || 'UNKNOWN') | uppercase"></p-tag>
              </div>

              <div class="grid-2 glass-inset border-radius-md p-md border-1 border-solid border-secondary">
                <div class="flex-col border-right-subtle pr-md">
                  <span class="text-xs text-tertiary font-medium">First In</span>
                  <div class="flex align-items-baseline gap-xs mt-1">
                    <span class="font-mono font-bold text-primary text-xl line-height-none">{{ data.firstIn ? (data.firstIn | date:'HH:mm') : '--:--' }}</span>
                    @if (data.isLate) {
                      <span class="text-xs text-error font-bold">LATE</span>
                    }
                  </div>
                </div>
                <div class="flex-col pl-md">
                  <span class="text-xs text-tertiary font-medium">Last Out</span>
                  <div class="flex align-items-baseline gap-xs mt-1">
                    <span class="font-mono font-bold text-primary text-xl line-height-none">{{ data.lastOut ? (data.lastOut | date:'HH:mm') : '--:--' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex-col gap-xs mt-xs">
                <div class="flex-between text-xs mb-1">
                  <span class="font-medium text-secondary">Total Logged</span>
                  <span class="font-mono font-bold text-primary">{{ data.netWorkHours | number:'1.1-1' }}h <span class="text-tertiary font-normal">/ 8.0h</span></span>
                </div>
                <p-progressBar [value]="getPercentage(data.netWorkHours, 8)" [showValue]="false" styleClass="h-2"></p-progressBar>
              </div>
              
              @if (data.todaysLogs?.length > 0) {
                <div class="text-xs font-medium text-tertiary text-center mt-sm border-top-subtle pt-md">
                  <i class="pi pi-check-circle mr-1"></i> {{ data.todaysLogs.length }} punches recorded today.
                </div>
              }
            </div>
            
          } @else {
            <div class="flex-col flex-center text-center py-3xl text-tertiary border-1 border-dashed border-secondary border-radius-md mt-sm">
              <i class="pi pi-inbox text-3xl mb-sm"></i>
              <span class="text-sm font-medium">No records for today.</span>
            </div>
          }
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE & LAYOUT UTILITIES
       ========================================================================== */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    
    .flex { display: flex; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .align-items-center { align-items: center; }
    .align-items-baseline { align-items: baseline; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .h-2 { height: 0.5rem; }

    /* Spacing */
    .m-0 { margin: 0 !important; }
    .p-0 { padding: 0 !important; }
    
    .mb-sm { margin-bottom: var(--spacing-sm); }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mb-lg { margin-bottom: var(--spacing-lg); }
    .mt-1 { margin-top: 4px; }
    .mt-xs { margin-top: var(--spacing-xs); }
    .mt-sm { margin-top: var(--spacing-sm); }
    
    .p-md { padding: var(--spacing-md); }
    .p-xl { padding: var(--spacing-xl); }
    .pb-sm { padding-bottom: var(--spacing-sm); }
    .pb-md { padding-bottom: var(--spacing-md); }
    .pt-md { padding-top: var(--spacing-md); }
    .pr-md { padding-right: var(--spacing-md); }
    .pl-md { padding-left: var(--spacing-md); }
    .py-3xl { padding-top: var(--spacing-3xl); padding-bottom: var(--spacing-3xl); }
    
    .gap-xs { gap: var(--spacing-xs); }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-md { gap: var(--spacing-md); }

    /* Typography & Colors */
    .font-heading { font-family: var(--font-heading); }
    .font-mono { font-family: var(--font-mono); }
    .font-medium { font-weight: var(--font-weight-medium); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-normal { font-weight: normal; }
    
    .text-xs { font-size: var(--font-size-xs); }
    .text-sm { font-size: var(--font-size-sm); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-xl { font-size: var(--font-size-xl); }
    .text-3xl { font-size: var(--font-size-3xl); }
    .text-center { text-align: center; }
    
    .uppercase { text-transform: uppercase; }
    .tracking-widest { letter-spacing: 0.05em; }
    .line-height-none { line-height: 1; }

    .text-primary { color: var(--text-primary); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-warning { color: var(--color-warning, #d97706); }
    .text-error { color: var(--color-error, #dc2626); }
    
    /* Borders & Glassmorphism */
    .glass-panel { background: var(--glass-bg-c); backdrop-filter: blur(var(--glass-blur-c)); border: 1px solid var(--border-primary); }
    .glass-inset { background: color-mix(in srgb, var(--bg-primary) 40%, transparent); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
    
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-radius-xl { border-radius: var(--ui-border-radius-xl); }
    
    .border-top-subtle { border-top: 1px solid var(--border-secondary); }
    .border-bottom-subtle { border-bottom: 1px solid var(--border-secondary); }
    .border-right-subtle { border-right: 1px solid var(--border-secondary); }
    .border-1 { border-width: 1px; }
    .border-solid { border-style: solid; }
    .border-dashed { border-style: dashed; }
    .border-secondary { border-color: var(--border-secondary); }
    
    .shadow-sm { box-shadow: var(--shadow-sm); }
    .overflow-hidden { overflow: hidden; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
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

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'danger';
      case 'late': 
      case 'half_day': return 'warn';
      case 'on_leave': 
      case 'holiday': return 'info';
      default: return 'secondary';
    }
  }
}


// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { catchError } from 'rxjs/operators';
// import { of } from 'rxjs';

// import { CardModule } from 'primeng/card';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { HRMSService } from '../../hrms.service';

// @Component({
//   selector: 'app-today-attendance-widget',
//   standalone: true,
//   imports: [CommonModule, CardModule, ButtonModule, TagModule, SkeletonModule, ProgressBarModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <p-card styleClass="premium-card glass-card widget-card">
//       <div class="flex-between mb-3 border-bottom pb-2">
//         <h3 class="font-heading m-0 text-primary-color flex-align gap-2"><i class="pi pi-sun text-warning"></i> Today's Status</h3>
//         <p-button icon="pi pi-arrow-right" [text]="true" [rounded]="true" pTooltip="Go to Timesheet"></p-button>
//       </div>

//       @if (isLoading()) {
//         <div class="flex-col gap-3">
//           <p-skeleton height="2rem"></p-skeleton>
//           <p-skeleton height="4rem"></p-skeleton>
//         </div>
//       } @else if (todayData(); as data) {
        
//         <div class="flex-col gap-3">
//           <div class="flex-between">
//             <span class="text-sm font-bold text-secondary uppercase tracking-wide">Status</span>
//             <p-tag [severity]="getStatusSeverity(data.status)" [value]="data.status | uppercase" styleClass="text-xs"></p-tag>
//           </div>

//           <div class="grid-2 bg-surface border-radius-md p-3 border-1 surface-border mt-1">
//             <div class="flex-col border-right pr-2">
//               <span class="text-xs text-tertiary">First In</span>
//               <span class="font-mono font-bold text-primary-color text-lg">{{ data.firstIn ? (data.firstIn | date:'HH:mm') : '--:--' }}</span>
//               <span *ngIf="data.isLate" class="text-xs text-error font-bold mt-1">LATE</span>
//             </div>
//             <div class="flex-col pl-2">
//               <span class="text-xs text-tertiary">Last Out</span>
//               <span class="font-mono font-bold text-primary-color text-lg">{{ data.lastOut ? (data.lastOut | date:'HH:mm') : '--:--' }}</span>
//             </div>
//           </div>

//           <div class="flex-col gap-1 mt-2">
//             <div class="flex-between text-xs text-secondary">
//               <span>Total Logged</span>
//               <span class="font-bold">{{ data.netWorkHours | number:'1.1-1' }}h / 8.0h</span>
//             </div>
//             <p-progressBar [value]="getPercentage(data.netWorkHours, 8)" [showValue]="false" styleClass="h-2"></p-progressBar>
//           </div>
          
//           @if (data.todaysLogs?.length > 0) {
//             <div class="text-xs text-tertiary text-center mt-2 border-top pt-2">
//               {{ data.todaysLogs.length }} punches recorded today.
//             </div>
//           }
//         </div>
//       } @else {
//         <div class="text-center text-secondary py-4 text-sm">No data for today.</div>
//       }
//     </p-card>
//   `,
//   styles: [`
//     .widget-card { border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-primary); background: var(--bg-primary); }
//     ::ng-deep .widget-card .p-card-body { padding: var(--spacing-lg); }
//     ::ng-deep .widget-card .p-card-content { padding: 0; }
    
//     .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-align { display: flex; align-items: center; }
//     .gap-1 { gap: var(--spacing-xs); }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-3 { gap: var(--spacing-md); }
    
//     .m-0 { margin: 0; }
//     .mb-3 { margin-bottom: var(--spacing-md); }
//     .mt-1 { margin-top: var(--spacing-xs); }
//     .mt-2 { margin-top: var(--spacing-sm); }
//     .pb-2 { padding-bottom: var(--spacing-sm); }
//     .pt-2 { padding-top: var(--spacing-sm); }
//     .p-3 { padding: var(--spacing-lg); }
//     .pr-2 { padding-right: var(--spacing-sm); }
//     .pl-2 { padding-left: var(--spacing-sm); }
//     .py-4 { padding-top: var(--spacing-xl); padding-bottom: var(--spacing-xl); }
    
//     .bg-surface { background: var(--bg-secondary); }
//     .border-bottom { border-bottom: 1px solid var(--border-primary); }
//     .border-top { border-top: 1px dashed var(--border-secondary); }
//     .border-right { border-right: 1px solid var(--border-primary); }
//     .border-1 { border: 1px solid; }
//     .surface-border { border-color: var(--border-primary); }
//     .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
//     .h-2 { height: 0.5rem; }
//     .text-center { text-align: center; }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-lg { font-size: var(--font-size-lg); }
    
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-primary-color { color: var(--text-primary); }
//     .text-warning { color: var(--color-warning); }
//     .text-error { color: var(--color-error); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .uppercase { text-transform: uppercase; }
//     .tracking-wide { letter-spacing: 0.05em; }

//     ::ng-deep .p-progressbar { background: rgba(0,0,0,0.05) !important; border-radius: 4px; overflow: hidden; }
//     ::ng-deep .p-progressbar .p-progressbar-value { background: var(--color-primary); border-radius: 4px; }
//   `]
// })
// export class TodayAttendanceWidgetComponent implements OnInit {
//   private hrmsService = inject(HRMSService);

//   isLoading = signal(true);
//   todayData = signal<any>(null);

//   ngOnInit() {
//     this.hrmsService.getTodayAttendance().pipe(
//       catchError(() => of({ data: null }))
//     ).subscribe((res: any) => {
//       this.todayData.set(res?.data || null);
//       this.isLoading.set(false);
//     });
//   }

//   getPercentage(current: number, target: number): number {
//     if (!current || !target) return 0;
//     return Math.min(100, Math.round((current / target) * 100));
//   }

//   getStatusSeverity(status: string): any {
//     switch (status) {
//       case 'present': return 'success';
//       case 'absent': return 'danger';
//       case 'late': case 'half_day': return 'warning';
//       case 'on_leave': case 'holiday': return 'info';
//       default: return 'secondary';
//     }
//   }
// }