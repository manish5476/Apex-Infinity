import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin } from 'rxjs';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-system-audit-alerts',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, TagModule, 
    TooltipModule, ProgressSpinnerModule,
    AgShareGrid
  ],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <div class="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 class="font-bold tracking-tight mb-1" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-2xl)'">System Integrity & Alerts</h2>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Monitoring administrative access and critical business bottlenecks
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
            <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Security Status</span>
            <span class="font-bold tabular-nums" [style.color]="securityData()?.riskyActions > 0 ? 'var(--theme-error)' : 'var(--theme-success)'">
              {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
            </span>
          </div>
          <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Health</span>
              <i class="pi pi-box text-rose-400"></i>
            </div>
            <div class="flex items-baseline gap-2">
              <h2 class="text-2xl font-bold tabular-nums text-rose-500">{{ alertsData()?.lowStockCount }}</h2>
              <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Low Stock Items</span>
            </div>
            <div class="mt-2 p-1.5 rounded bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
               <span class="text-[10px] font-bold text-rose-400 uppercase">Top Priority:</span>
               <span class="text-[10px] font-bold text-white truncate max-w-[120px]">{{ alertsData()?.itemsToReorder[0] || 'None' }}</span>
            </div>
          </div>

          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Financial Exposure</span>
              <i class="pi pi-exclamation-triangle text-amber-400"></i>
            </div>
            <div class="flex items-baseline gap-2">
              <h2 class="text-2xl font-bold tabular-nums text-amber-500">{{ alertsData()?.highRiskDebtCount }}</h2>
              <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">High Risk Debts</span>
            </div>
            <p class="mt-2 text-[10px] leading-tight opacity-70" [style.color]="'var(--theme-text-secondary)'">Action: Immediate payment follow-up recommended.</p>
          </div>

          <div class="p-4 border text-white shadow-lg flex flex-col justify-between" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div>
              <p class="uppercase font-black tracking-tighter opacity-80 mb-1" [style.font-size]="'var(--font-size-xs)'">Audit Trail</p>
              <h2 class="text-2xl font-bold leading-none">{{ securityData()?.recentEvents?.length }} Events</h2>
              <p class="text-[10px] font-bold opacity-90 uppercase italic mt-1">Logged in last 72 hours</p>
            </div>
            <div class="mt-2 flex gap-2">
               <p-button label="Review Logs" severity="secondary" [text]="true" size="small" styleClass="bg-white/10 text-white border-white/20 py-1 text-xs"></p-button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="shrink-0 p-3 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Administrative Access Log</h3>
                <span class="text-[9px] font-mono opacity-50" [style.color]="'var(--theme-text-label)'">IP TRAFFIC: MONITORING</span>
              </div>

              <div class="grid-wrapper flex-1 relative min-h-[350px]">
                 <app-ag-share-grid 
                   [columns]="auditColumns" 
                   [data]="securityData()?.recentEvents || []" 
                   [showActions]="false" 
                   style="height: 100%; width: 100%; display: block; position: absolute; inset: 0;">
                 </app-ag-share-grid>
              </div>

            </div>
          </div>

          <div class="lg:col-span-4 space-y-4">
            
            <div class="p-4 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
               <h4 class="font-bold mb-3 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Re-order Checklist</h4>
               <div class="space-y-2">
                 @for (item of alertsData()?.itemsToReorder; track item) {
                   <div class="flex items-center justify-between p-2 border rounded-lg transition-colors hover:bg-white/5" 
                        [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
                     <span class="font-bold text-white truncate max-w-[150px]" [style.font-size]="'var(--font-size-xs)'">{{ item }}</span>
                     <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small" styleClass="p-0 h-6 w-6"></p-button>
                   </div>
                 }
                 @if (!alertsData()?.itemsToReorder?.length) {
                   <p class="text-center py-2 text-[10px]" [style.color]="'var(--theme-text-tertiary)'">No immediate stock-outs detected.</p>
                 }
               </div>
            </div>

            <div class="p-4 border border-dashed flex flex-col items-center text-center" 
                 [style.background]="'rgba(16, 185, 129, 0.03)'" 
                 [style.border-color]="'var(--theme-success)'" 
                 [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                 <i class="pi pi-check-circle text-sm"></i>
              </div>
              <h4 class="font-bold text-white mb-0.5 text-sm">Environment Secure</h4>
              <p class="text-[10px] leading-relaxed" [style.color]="'var(--theme-text-secondary)'">
                Zero unauthorized requests. Checked at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
              </p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Fetching Security Tokens...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: []
})
export class SystemAuditAlertsComponent implements OnInit {
  alertsData = signal<any>(null);
  securityData = signal<any>(null);
  loading = signal<boolean>(true);
  
  auditColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.refreshAll();
  }

  setupColumns(): void {
    this.auditColumns = [
      {
        field: 'userId.name', 
        headerName: 'Administrator', 
        sortable: true, 
        flex: 1,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const user = params.data?.userId || {};
          const name = user.name || 'Unknown';
          const email = user.email || '';
          const initials = this.commonService.getInitials(name);

          return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="width: 24px; height: 24px; border-radius: 4px; background: rgba(99, 102, 241, 0.1); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 9px;">
                      ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 700; color: #fff; line-height: 1; font-size: 11px;">${name}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'userId.name', 
        headerName: 'Administrator', 
        sortable: true, 
        flex: 1,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const user = params.data?.userId || {};
          const name = user.name || 'Unknown';
          const email = user.email || '';
          const initials = this.commonService.getInitials(name);
          return `<div style="display: flex; align-items: center; gap: 8px; height: 100%;">
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 9px; opacity: 0.5; margin-top: 1px;">${email}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'action', 
        headerName: 'Action performed', 
        sortable: true, 
        width: 160,
        cellRenderer: (params: any) => {
          const fullAction = params.value || '';
          const parts = fullAction.split(':');
          const category = parts[0] ? parts[0].trim() : '';
          const actionName = parts[1] ? parts[1].trim() : fullAction;
          const entity = params.data?.entityType || 'system';

          return `<div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="padding: 1px 4px; width: fit-content; border-radius: 3px; font-weight: 700; font-size: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: #a5b4fc; text-transform: uppercase;">
                      ${actionName}
                    </span>
                    <span style="font-size: 9px; color: var(--theme-text-label);">Entity: ${entity}</span>
                  </div>`;
        }
      },
      {
        field: 'ip', 
        headerName: 'Trace (IP)', 
        sortable: true, 
        width: 120,
        cellRenderer: (params: any) => {
          const ip = params.value === '::1' ? 'Localhost' : params.value;
          return `<span style="font-family: monospace; font-size: 9px; background: rgba(30, 41, 59, 0.5); padding: 1px 4px; border-radius: 3px; border: 1px solid rgba(51, 65, 85, 0.5); color: var(--theme-text-tertiary);">
                    ${ip}
                  </span>`;
        }
      },
      {
        field: 'createdAt', 
        headerName: 'Timestamp', 
        sortable: true, 
        width: 110,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM, HH:mm'),
        cellStyle: { 'font-family': 'monospace', 'font-weight': '700', 'font-size': '10px', 'color': '#fff' }
      }
    ];
    this.cdr.detectChanges();
  }

  refreshAll() {
    this.loading.set(true);
    forkJoin({
      alerts: this.analyticsService.getCriticalAlerts(),
      security: this.analyticsService.getSecurityAuditLog()
    }).subscribe({
      next: (results) => {
        if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
        if (results.security.status === 'success') this.securityData.set(results.security.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { forkJoin } from 'rxjs';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-system-audit-alerts',
//   standalone: true,
//   imports: [
//     CommonModule, ButtonModule, TagModule, 
//     TooltipModule, ProgressSpinnerModule,
//     AgShareGrid // Added Custom Grid
//   ],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <div class="mb-8 flex flex-wrap justify-between items-center gap-4">
//         <div>
//           <h2 class="font-bold tracking-tight mb-1" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-2xl)'">System Integrity & Alerts</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//             Monitoring administrative access and critical business bottlenecks
//           </p>
//         </div>
//         <div class="flex items-center gap-3">
//           <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
//             <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Security Status</span>
//             <span class="font-bold tabular-nums" [style.color]="securityData()?.riskyActions > 0 ? 'var(--theme-error)' : 'var(--theme-success)'">
//               {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
//             </span>
//           </div>
//           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div class="p-6 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-start mb-4">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Health</span>
//               <i class="pi pi-box text-rose-400"></i>
//             </div>
//             <div class="flex items-baseline gap-2">
//               <h2 class="text-3xl font-bold tabular-nums text-rose-500">{{ alertsData()?.lowStockCount }}</h2>
//               <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Low Stock Items</span>
//             </div>
//             <div class="mt-4 p-2 rounded bg-rose-500/5 border border-rose-500/10">
//                <p class="text-[10px] font-bold text-rose-400 uppercase mb-1">To Reorder:</p>
//                <p class="text-[11px] font-bold text-white truncate">{{ alertsData()?.itemsToReorder[0] }}</p>
//             </div>
//           </div>

//           <div class="p-6 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-start mb-4">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Financial Exposure</span>
//               <i class="pi pi-exclamation-triangle text-amber-400"></i>
//             </div>
//             <div class="flex items-baseline gap-2">
//               <h2 class="text-3xl font-bold tabular-nums text-amber-500">{{ alertsData()?.highRiskDebtCount }}</h2>
//               <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">High Risk Debts</span>
//             </div>
//             <p class="mt-4 text-[11px]" [style.color]="'var(--theme-text-secondary)'">Action: Immediate payment follow-up recommended for overdue segments.</p>
//           </div>

//           <div class="p-6 border text-white shadow-lg" 
//                [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-black tracking-tighter opacity-80 mb-2" [style.font-size]="'var(--font-size-xs)'">Audit Trail</p>
//             <h2 class="text-2xl font-bold mb-1">{{ securityData()?.recentEvents?.length }} Events</h2>
//             <p class="text-[11px] font-bold opacity-90 uppercase italic">Logged in last 72 hours</p>
//             <div class="mt-6 flex gap-2">
//                <p-button label="Review Logs" severity="secondary" [text]="true" size="small" styleClass="bg-white/10 text-white border-white/20"></p-button>
//             </div>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-8">
//             <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="shrink-0 p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Administrative Access Log</h3>
//                 <span class="text-[9px] font-mono opacity-50" [style.color]="'var(--theme-text-label)'">IP TRAFFIC: MONITORING</span>
//               </div>

//               <div class="grid-wrapper flex-1 relative min-h-[400px]">
//                  <app-ag-share-grid 
//                    [columns]="auditColumns" 
//                    [data]="securityData()?.recentEvents || []" 
//                    [showActions]="false" 
//                    style="height: 100%; width: 100%; display: block; position: absolute; inset: 0;">
//                  </app-ag-share-grid>
//               </div>

//             </div>
//           </div>

//           <div class="lg:col-span-4 space-y-6">
            
//             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Re-order Checklist</h4>
//                <div class="space-y-3">
//                  @for (item of alertsData()?.itemsToReorder; track item) {
//                    <div class="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-white/5" 
//                         [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
//                      <span class="font-bold text-white" [style.font-size]="'var(--font-size-xs)'">{{ item }}</span>
//                      <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small"></p-button>
//                    </div>
//                  }
//                  @if (!alertsData()?.itemsToReorder?.length) {
//                    <p class="text-center py-4 text-[11px]" [style.color]="'var(--theme-text-tertiary)'">No immediate stock-outs detected.</p>
//                  }
//                </div>
//             </div>

//             <div class="p-5 border border-dashed flex flex-col items-center text-center" 
//                  [style.background]="'rgba(16, 185, 129, 0.03)'" 
//                  [style.border-color]="'var(--theme-success)'" 
//                  [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
//                  <i class="pi pi-check-circle text-xl"></i>
//               </div>
//               <h4 class="font-bold text-white mb-1">Environment Secure</h4>
//               <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
//                 Audit logs show zero unauthorized requests. Last integrity check completed at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
//               </p>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Fetching Security Tokens...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: []
// })
// export class SystemAuditAlertsComponent implements OnInit {
//   alertsData = signal<any>(null);
//   securityData = signal<any>(null);
//   loading = signal<boolean>(true);
  
//   auditColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.refreshAll();
//   }

//   setupColumns(): void {
//     this.auditColumns = [
//       {
//         field: 'userId.name', 
//         headerName: 'Administrator', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           const user = params.data?.userId || {};
//           const name = user.name || 'Unknown';
//           const email = user.email || '';
//           const initials = this.commonService.getInitials(name);

//           return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
//                     <div style="width: 28px; height: 28px; border-radius: 4px; background: rgba(99, 102, 241, 0.1); color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">
//                       ${initials}
//                     </div>
//                     <div style="display: flex; flex-direction: column;">
//                       <span style="font-weight: 700; color: #fff; line-height: 1;">${name}</span>
//                       <span style="font-size: 10px; opacity: 0.5; margin-top: 2px;">${email}</span>
//                     </div>
//                   </div>`;
//         }
//       },
//       {
//         field: 'action', 
//         headerName: 'Action performed', 
//         sortable: true, 
//         width: 180,
//         cellRenderer: (params: any) => {
//           const fullAction = params.value || '';
//           const parts = fullAction.split(':');
//           const category = parts[0] ? parts[0].trim() : '';
//           const actionName = parts[1] ? parts[1].trim() : fullAction;
//           const entity = params.data?.entityType || 'system';

//           return `<div style="display: flex; flex-direction: column; gap: 4px;">
//                     <span style="padding: 2px 6px; width: fit-content; border-radius: 4px; font-weight: 700; font-size: 9px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: #a5b4fc; text-transform: uppercase;">
//                       ${actionName}
//                     </span>
//                     <span style="font-size: 9px; color: var(--theme-text-label);">Entity: ${entity}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'ip', 
//         headerName: 'Trace (IP)', 
//         sortable: true, 
//         width: 140,
//         cellRenderer: (params: any) => {
//           const ip = params.value === '::1' ? 'Localhost' : params.value;
//           return `<span style="font-family: monospace; font-size: 10px; background: rgba(30, 41, 59, 0.5); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(51, 65, 85, 0.5); color: var(--theme-text-tertiary);">
//                     ${ip}
//                   </span>`;
//         }
//       },
//       {
//         field: 'createdAt', 
//         headerName: 'Timestamp', 
//         sortable: true, 
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM, HH:mm'),
//         cellStyle: { 'font-family': 'monospace', 'font-weight': '700', 'font-size': '10px', 'color': '#fff' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   refreshAll() {
//     this.loading.set(true);
//     forkJoin({
//       alerts: this.analyticsService.getCriticalAlerts(),
//       security: this.analyticsService.getSecurityAuditLog()
//     }).subscribe({
//       next: (results) => {
//         if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
//         if (results.security.status === 'success') this.securityData.set(results.security.data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
// // import { Component, OnInit, signal, computed } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { TableModule } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { forkJoin } from 'rxjs';
// // import { CommonMethodService } from '../../core/utils/common-method.service';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // @Component({
// //   selector: 'app-system-audit-alerts',
// //   standalone: true,
// //   imports: [CommonModule, TableModule, ButtonModule, TagModule, TooltipModule, ProgressSpinnerModule],
// //   template: `
// //     <div class="p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">

// //       <div class="mb-8 flex flex-wrap justify-between items-center gap-4">
// //         <div>
// //           <h2 class="font-bold tracking-tight mb-1" 
// //               [style.color]="'var(--theme-text-primary)'"
// //               [style.font-family]="'var(--font-heading)'"
// //               [style.font-size]="'var(--font-size-2xl)'">System Integrity & Alerts</h2>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
// //             Monitoring administrative access and critical business bottlenecks
// //           </p>
// //         </div>
// //         <div class="flex items-center gap-3">
// //           <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
// //             <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase">Security Status</span>
// //             <span class="font-bold tabular-nums" [style.color]="securityData()?.riskyActions > 0 ? 'var(--theme-error)' : 'var(--theme-success)'">
// //               {{ securityData()?.riskyActions > 0 ? 'Action Required' : 'Secure' }}
// //             </span>
// //           </div>
// //           <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="refreshAll()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
// //           <div class="p-6 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-start mb-4">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Health</span>
// //               <i class="pi pi-box text-rose-400"></i>
// //             </div>
// //             <div class="flex items-baseline gap-2">
// //               <h2 class="text-3xl font-bold tabular-nums text-rose-500">{{ alertsData()?.lowStockCount }}</h2>
// //               <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Low Stock Items</span>
// //             </div>
// //             <div class="mt-4 p-2 rounded bg-rose-500/5 border border-rose-500/10">
// //                <p class="text-[10px] font-bold text-rose-400 uppercase mb-1">To Reorder:</p>
// //                <p class="text-[11px] font-bold text-white truncate">{{ alertsData()?.itemsToReorder[0] }}</p>
// //             </div>
// //           </div>

// //           <div class="p-6 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-start mb-4">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Financial Exposure</span>
// //               <i class="pi pi-exclamation-triangle text-amber-400"></i>
// //             </div>
// //             <div class="flex items-baseline gap-2">
// //               <h2 class="text-3xl font-bold tabular-nums text-amber-500">{{ alertsData()?.highRiskDebtCount }}</h2>
// //               <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">High Risk Debts</span>
// //             </div>
// //             <p class="mt-4 text-[11px]" [style.color]="'var(--theme-text-secondary)'">Action: Immediate payment follow-up recommended for overdue segments.</p>
// //           </div>

// //           <div class="p-6 border text-white shadow-lg" 
// //                [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <p class="uppercase font-black tracking-tighter opacity-80 mb-2" [style.font-size]="'var(--font-size-xs)'">Audit Trail</p>
// //             <h2 class="text-2xl font-bold mb-1">{{ securityData()?.recentEvents?.length }} Events</h2>
// //             <p class="text-[11px] font-bold opacity-90 uppercase italic">Logged in last 72 hours</p>
// //             <div class="mt-6 flex gap-2">
// //                <p-button label="Review Logs" severity="secondary" [text]="true" size="small" styleClass="bg-white/10 text-white border-white/20"></p-button>
// //             </div>
// //           </div>
// //         </div>

// //         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
// //           <div class="lg:col-span-8">
// //             <div class="border overflow-hidden shadow-sm" 
// //                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
// //                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Administrative Access Log</h3>
// //                 <span class="text-[9px] font-mono opacity-50" [style.color]="'var(--theme-text-label)'">IP TRAFFIC: MONITORING</span>
// //               </div>

// //               <p-table [value]="securityData()?.recentEvents" styleClass="p-datatable-sm no-border-table">
// //                 <ng-template pTemplate="header">
// //                   <tr>
// //                     <th [style.color]="'var(--theme-text-label)'">Administrator</th>
// //                     <th [style.color]="'var(--theme-text-label)'">Action performed</th>
// //                     <th [style.color]="'var(--theme-text-label)'">Trace (IP)</th>
// //                     <th [style.color]="'var(--theme-text-label)'" class="text-right">Timestamp</th>
// //                   </tr>
// //                 </ng-template>
// //                 <ng-template pTemplate="body" let-event>
// //                   <tr [style.color]="'var(--theme-text-secondary)'">
// //                     <td>
// //                       <div class="flex items-center gap-3">
// //                         <div class="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
// //                           {{ commonService.getInitials(event.userId?.name) }}
// //                         </div>
// //                         <div class="flex flex-col">
// //                           <span class="font-bold text-white leading-none mb-1">{{ event.userId?.name }}</span>
// //                           <span class="text-[9px] opacity-50">{{ event.userId?.email }}</span>
// //                         </div>
// //                       </div>
// //                     </td>
// //                     <td>
// //                       <div class="flex flex-col gap-1">
// //                         <span class="px-2 py-0.5 w-fit rounded font-bold text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-tighter">
// //                           {{ event.action.split(':')[1] || event.action }}
// //                         </span>
// //                         <span class="text-[9px]" [style.color]="'var(--theme-text-label)'">Entity: {{ event.entityType }}</span>
// //                       </div>
// //                     </td>
// //                     <td>
// //                       <span class="font-mono text-[10px] bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50" [style.color]="'var(--theme-text-tertiary)'">
// //                         {{ event.ip === '::1' ? 'Localhost' : event.ip }}
// //                       </span>
// //                     </td>
// //                     <td class="text-right font-mono text-[10px] font-bold text-white tabular-nums">
// //                       {{ event.createdAt | date:'dd MMM, HH:mm' }}
// //                     </td>
// //                   </tr>
// //                 </ng-template>
// //               </p-table>
// //             </div>
// //           </div>

// //           <div class="lg:col-span-4 space-y-6">
            
// //             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //                <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Re-order Checklist</h4>
// //                <div class="space-y-3">
// //                  @for (item of alertsData()?.itemsToReorder; track item) {
// //                    <div class="flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-white/5" 
// //                         [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
// //                      <span class="font-bold text-white" [style.font-size]="'var(--font-size-xs)'">{{ item }}</span>
// //                      <p-button icon="pi pi-shopping-cart" [text]="true" severity="info" size="small"></p-button>
// //                    </div>
// //                  }
// //                  @if (!alertsData()?.itemsToReorder?.length) {
// //                    <p class="text-center py-4 text-[11px]" [style.color]="'var(--theme-text-tertiary)'">No immediate stock-outs detected.</p>
// //                  }
// //                </div>
// //             </div>

// //             <div class="p-5 border border-dashed flex flex-col items-center text-center" 
// //                  [style.background]="'rgba(16, 185, 129, 0.03)'" 
// //                  [style.border-color]="'var(--theme-success)'" 
// //                  [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
// //                  <i class="pi pi-check-circle text-xl"></i>
// //               </div>
// //               <h4 class="font-bold text-white mb-1">Environment Secure</h4>
// //               <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
// //                 Audit logs show zero unauthorized requests. Last integrity check completed at {{ securityData()?.recentEvents[0]?.createdAt | date:'shortTime' }}.
// //               </p>
// //             </div>
// //           </div>
// //         </div>

// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
// //           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Fetching Security Tokens...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     :host ::ng-deep .no-border-table .p-datatable-tbody > tr {
// //       background: transparent !important;
// //       border-bottom: 1px solid var(--theme-border-primary) !important;
// //     }
// //     :host ::ng-deep .no-border-table .p-datatable-thead > tr > th {
// //       background: transparent !important;
// //       padding: 0.85rem 1rem;
// //       font-size: 10px;
// //       font-weight: 700;
// //       text-transform: uppercase;
// //       border: none !important;
// //     }
// //   `]
// // })
// // export class SystemAuditAlertsComponent implements OnInit {
// //   alertsData = signal<any>(null);
// //   securityData = signal<any>(null);
// //   loading = signal<boolean>(true);

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService
// //   ) {}

// //   ngOnInit() {
// //     this.refreshAll();
// //   }

// //   refreshAll() {
// //     this.loading.set(true);
// //     // Fetch both API endpoints simultaneously
// //     forkJoin({
// //       alerts: this.analyticsService.getCriticalAlerts(),
// //       security: this.analyticsService.getSecurityAuditLog()
// //     }).subscribe({
// //       next: (results) => {
// //         if (results.alerts.status === 'success') this.alertsData.set(results.alerts.data);
// //         if (results.security.status === 'success') this.securityData.set(results.security.data);
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }