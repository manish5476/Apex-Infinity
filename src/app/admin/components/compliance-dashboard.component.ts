import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

interface HealthIssue {
  check: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
}

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, 
    ProgressSpinnerModule, TooltipModule,
    AgShareGrid
  ],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-slow pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h2 class="font-bold tracking-tight mb-1 text-xl text-white flex items-center gap-2">
              <i class="pi pi-shield text-emerald-400"></i>
              Compliance & Governance
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
              Audit logs, Tax compliance tracking, and Data integrity diagnostics
            </p>
          </div>
          <div class="flex gap-2">
             <p-button label="Validation Report" icon="pi pi-check-square" [outlined]="true" severity="secondary" size="small"></p-button>
             <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()" [loading]="loading()"></p-button>
          </div>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            
            <div class="lg:col-span-3 p-6 border flex flex-col items-center justify-center text-center relative overflow-hidden" 
                 style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
              <p class="uppercase font-bold tracking-widest mb-6 text-slate-400 text-[10px]">Data Health Score</p>
              
              <div class="relative flex items-center justify-center mb-4">
                 <svg class="w-32 h-32 transform -rotate-90">
                   <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-800" />
                   <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent"
                     class="text-emerald-500"
                     stroke-dasharray="364.4"
                     [attr.stroke-dashoffset]="364.4 - (364.4 * (complianceData()?.dataHealth?.score || 0) / 100)"
                     stroke-linecap="round" />
                 </svg>
                 <div class="absolute flex flex-col items-center">
                    <span class="text-3xl font-black text-white tabular-nums">{{ complianceData()?.dataHealth?.score }}%</span>
                 </div>
              </div>
              <p class="font-bold text-emerald-400 uppercase tracking-tighter text-xs">System Optimal</p>
            </div>

            <div class="lg:col-span-5 p-6 border" 
                 style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
               <h3 class="font-bold uppercase tracking-tighter mb-4 text-slate-400 text-xs">System Integrity Diagnostics</h3>
               
               <div class="flex flex-col gap-3 h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                 @for (issue of complianceData()?.dataHealth?.issues; track issue.check) {
                   <div class="p-3 border transition-all hover:bg-white/5 flex gap-3 items-start" 
                        [ngStyle]="{
                          'background': 'rgba(255,255,255,0.03)', 
                          'border-color': issue.status === 'healthy' ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.3)',
                          'border-radius': '8px'
                        }">
                      <div class="mt-0.5">
                        <i class="pi" 
                           [ngClass]="issue.status === 'healthy' ? 'pi-check-circle text-emerald-500' : 'pi-exclamation-triangle text-amber-500'"></i>
                      </div>
                      <div>
                        <p class="font-bold text-white text-xs mb-0.5">{{ issue.check }}</p>
                        <p class="text-slate-400 text-[10px] leading-snug">{{ issue.details }}</p>
                      </div>
                   </div>
                 }
               </div>
            </div>

            <div class="lg:col-span-4 p-6 border flex flex-col justify-between" 
                 style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
              <div class="flex justify-between items-start mb-4">
                <h3 class="font-bold uppercase tracking-tight text-slate-400 text-xs">Tax Ledger</h3>
                <span class="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  {{ complianceData()?.tax?.compliance }}
                </span>
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-end border-b border-white/5 pb-2">
                  <span class="text-slate-500 text-xs font-bold uppercase">Input GST</span>
                  <span class="text-lg font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.inputTax | number }}</span>
                </div>
                <div class="flex justify-between items-end border-b border-white/5 pb-2">
                  <span class="text-slate-500 text-xs font-bold uppercase">Output GST</span>
                  <span class="text-lg font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.outputTax | number }}</span>
                </div>
                <div class="flex justify-between items-end pt-1">
                  <span class="text-emerald-500 text-xs font-bold uppercase">Net Payable</span>
                  <span class="text-xl font-bold tabular-nums text-emerald-400">₹{{ complianceData()?.tax?.netPayable | number }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="border overflow-hidden h-full flex flex-col" 
               style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
            <div class="p-4 border-b flex justify-between items-center shrink-0" 
                 style="border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);">
              <h3 class="font-bold uppercase tracking-tight text-white text-xs">Audit Trail (Recent Events)</h3>
              <span class="text-[9px] font-mono opacity-50 uppercase text-slate-400">Immutable Logs</span>
            </div>

            <div class="grid-wrapper flex-1 relative min-h-[400px]">
               <app-ag-share-grid 
                 [columns]="auditColumns" 
                 [data]="complianceData()?.audit?.recentEvents || []" 
                 [showActions]="false" 
                 style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
               </app-ag-share-grid>
            </div>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
            <p class="text-slate-500 text-sm font-bold uppercase tracking-widest">Validating Governance Data...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    /* Custom Scrollbar for the list */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class ComplianceDashboardComponent implements OnInit {
  complianceData = signal<any>(null);
  loading = signal<boolean>(true);
  
  auditColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns(): void {
    this.auditColumns = [
      // 1. Administrator Name
      {
        field: 'userId.name', 
        headerName: 'Administrator', 
        sortable: true, 
        flex: 1, 
        minWidth: 140,
        cellRenderer: (params: any) => {
          const name = params.data.userId?.name || 'System';
          return `<span style="font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${name}
                  </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },
      
      // 2. IP Address
      {
        field: 'ip',
        headerName: 'Source IP',
        width: 110,
        sortable: true,
        cellRenderer: (params: any) => {
           const ip = params.value === '::1' ? 'Localhost' : params.value;
           return `<span style="font-family: monospace; font-size: 10px; color: #94a3b8; background: rgba(148, 163, 184, 0.1); padding: 2px 6px; border-radius: 4px;">
                     ${ip}
                   </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },

      // 3. Action
      {
        field: 'action', 
        headerName: 'Action', 
        width: 130,
        sortable: true, 
        cellRenderer: (params: any) => {
          const raw = params.value || '';
          const displayAction = raw.includes(':') ? raw.split(':')[1] : raw;
          
          return `<span style="text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: #a5b4fc; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 2px 6px; border-radius: 4px;">
                    ${displayAction}
                  </span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },

      // 4. Target Entity
      {
        field: 'entityType',
        headerName: 'Target',
        width: 100,
        cellRenderer: (params: any) => {
           const entity = params.value || 'System';
           return `<span style="font-size: 11px; color: #cbd5e1; text-transform: capitalize;">${entity}</span>`;
        },
        cellStyle: { 'display': 'flex', 'align-items': 'center' }
      },

      // 5. Timestamp
      {
        field: 'createdAt', 
        headerName: 'Time', 
        sortable: true, 
        width: 90,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'HH:mm:ss'),
        cellStyle: { 'font-family': 'monospace', 'font-weight': '600', 'font-size': '11px', 'color': '#64748b', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getComplianceDashboard().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.complianceData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// interface HealthIssue {
//   check: string;
//   status: 'healthy' | 'warning' | 'error';
//   details: string;
// }

// @Component({
//   selector: 'app-compliance-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule, ButtonModule, 
//     ProgressSpinnerModule, TooltipModule,
//     AgShareGrid // Added Custom Grid
//   ],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
//         <div>
//           <h2 class="font-bold tracking-tight mb-1" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-2xl)'">Compliance & Governance</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//             Audit logs, Tax compliance tracking, and Data integrity diagnostics
//           </p>
//         </div>
//         <div class="flex gap-2">
//            <p-button label="Validation Report" icon="pi pi-check-square" [outlined]="true" severity="secondary" size="small"></p-button>
//            <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
//           <div class="lg:col-span-4 p-6 border flex flex-col items-center justify-center text-center" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-bold tracking-widest mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Data Integrity Score</p>
            
//             <div class="relative flex items-center justify-center mb-4">
//                <svg class="w-32 h-32 transform -rotate-90">
//                  <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" [style.color]="'var(--theme-bg-ternary)'" />
//                  <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent"
//                    [style.color]="'var(--theme-success)'"
//                    stroke-dasharray="364.4"
//                    [attr.stroke-dashoffset]="364.4 - (364.4 * (complianceData()?.dataHealth?.score || 0) / 100)"
//                    stroke-linecap="round" />
//                </svg>
//                <span class="absolute text-3xl font-black text-white tabular-nums">{{ complianceData()?.dataHealth?.score }}%</span>
//             </div>
//             <p class="font-bold text-emerald-500 uppercase tracking-tighter" [style.font-size]="'var(--font-size-xs)'">Overall Healthy</p>
//           </div>

//           <div class="lg:col-span-8 p-6 border" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-center mb-8">
//               <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Tax Compliance Ledger</h3>
//               <span class="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
//                 {{ complianceData()?.tax?.compliance }}
//               </span>
//             </div>

//             <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div>
//                 <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Input GST</p>
//                 <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.inputTax | number }}</p>
//               </div>
//               <div>
//                 <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Output GST</p>
//                 <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.outputTax | number }}</p>
//               </div>
//               <div class="p-3 rounded-lg" [style.background]="'var(--theme-bg-ternary)'">
//                 <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Net Payable</p>
//                 <p class="text-2xl font-bold tabular-nums text-emerald-500">₹{{ complianceData()?.tax?.netPayable | number }}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-5 space-y-6">
//             <div class="p-6 border h-full" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//                <h3 class="font-bold uppercase tracking-tighter mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">System Integrity Checks</h3>
               
//                <div class="space-y-4">
//                  @for (issue of complianceData()?.dataHealth?.issues; track issue.check) {
//                    <div class="p-4 border transition-all" 
//                         [style.background]="'var(--theme-bg-ternary)'" 
//                         [style.border-color]="issue.status === 'healthy' ? 'var(--theme-border-secondary)' : 'rgba(251, 191, 36, 0.2)'"
//                         [style.border-radius]="'var(--ui-border-radius-lg)'">
//                       <div class="flex items-center gap-3 mb-2">
//                         <i class="pi" 
//                            [ngClass]="issue.status === 'healthy' ? 'pi-check-circle text-emerald-500' : 'pi-exclamation-triangle text-amber-500'"></i>
//                         <span class="font-bold text-white" [style.font-size]="'var(--font-size-sm)'">{{ issue.check }}</span>
//                       </div>
//                       <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ issue.details }}</p>
//                    </div>
//                  }
//                </div>
//             </div>
//           </div>

//           <div class="lg:col-span-7">
//             <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="p-4 border-b flex justify-between items-center shrink-0" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Audit Trail (Recent Events)</h3>
//                 <span class="text-[9px] font-mono opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">Immutable Logs</span>
//               </div>

//               <div class="grid-wrapper flex-1 relative min-h-[400px]">
//                  <app-ag-share-grid 
//                    [columns]="auditColumns" 
//                    [data]="complianceData()?.audit?.recentEvents || []" 
//                    [showActions]="false" 
//                    style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Validating Governance Data...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: []
// })
// export class ComplianceDashboardComponent implements OnInit {
//   complianceData = signal<any>(null);
//   loading = signal<boolean>(true);
  
//   auditColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

// setupColumns(): void {
//     this.auditColumns = [
//       // 1. Administrator Name (Single Line)
//       {
//         field: 'userId.name', 
//         headerName: 'Administrator', 
//         sortable: true, 
//         flex: 1, // Takes remaining space
//         minWidth: 140,
//         cellRenderer: (params: any) => {
//           const name = params.data.userId?.name || 'System';
//           // Simple, single-line bold text
//           return `<span style="font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
//                     ${name}
//                   </span>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center' }
//       },
      
//       // 2. IP Address (Separate Column)
//       {
//         field: 'ip',
//         headerName: 'Source IP',
//         width: 110,
//         sortable: true,
//         cellRenderer: (params: any) => {
//            const ip = params.value === '::1' ? 'Localhost' : params.value;
//            return `<span style="font-family: monospace; font-size: 10px; color: #94a3b8; background: rgba(148, 163, 184, 0.1); padding: 2px 6px; border-radius: 4px;">
//                      ${ip}
//                    </span>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center' }
//       },

//       // 3. Action (Badge Style)
//       {
//         field: 'action', 
//         headerName: 'Action', 
//         width: 130,
//         sortable: true, 
//         cellRenderer: (params: any) => {
//           const raw = params.value || '';
//           // Extract "transactions" from "read:transactions" for cleaner display
//           const displayAction = raw.includes(':') ? raw.split(':')[1] : raw;
          
//           return `<span style="text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; color: #a5b4fc; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); padding: 2px 6px; border-radius: 4px;">
//                     ${displayAction}
//                   </span>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center' }
//       },

//       // 4. Target Entity (Separate Column)
//       {
//         field: 'entityType',
//         headerName: 'Target',
//         width: 100,
//         cellRenderer: (params: any) => {
//            const entity = params.value || 'System';
//            return `<span style="font-size: 11px; color: #cbd5e1; text-transform: capitalize;">${entity}</span>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center' }
//       },

//       // 5. Timestamp
//       {
//         field: 'createdAt', 
//         headerName: 'Time', 
//         sortable: true, 
//         width: 90,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'HH:mm:ss'),
//         cellStyle: { 'font-family': 'monospace', 'font-weight': '600', 'font-size': '11px', 'color': '#64748b', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getComplianceDashboard().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.complianceData.set(res.data);
//         }
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
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { AdminAnalyticsService } from '../admin-analytics.service';

// // interface HealthIssue {
// //   check: string;
// //   status: 'healthy' | 'warning' | 'error';
// //   details: string;
// // }

// // @Component({
// //   selector: 'app-compliance-dashboard',
// //   standalone: true,
// //   imports: [CommonModule, TableModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
// //   template: `
// //     <div class="p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">

// //       <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
// //         <div>
// //           <h2 class="font-bold tracking-tight mb-1" 
// //               [style.color]="'var(--theme-text-primary)'"
// //               [style.font-family]="'var(--font-heading)'"
// //               [style.font-size]="'var(--font-size-2xl)'">Compliance & Governance</h2>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
// //             Audit logs, Tax compliance tracking, and Data integrity diagnostics
// //           </p>
// //         </div>
// //         <div class="flex gap-2">
// //            <p-button label="Validation Report" icon="pi pi-check-square" [outlined]="true" severity="secondary" size="small"></p-button>
// //            <p-button icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
// //           <div class="lg:col-span-4 p-6 border flex flex-col items-center justify-center text-center" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <p class="uppercase font-bold tracking-widest mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Data Integrity Score</p>
            
// //             <div class="relative flex items-center justify-center mb-4">
// //                <svg class="w-32 h-32 transform -rotate-90">
// //                  <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" [style.color]="'var(--theme-bg-ternary)'" />
// //                  <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent"
// //                    [style.color]="'var(--theme-success)'"
// //                    stroke-dasharray="364.4"
// //                    [attr.stroke-dashoffset]="364.4 - (364.4 * complianceData()?.dataHealth?.score / 100)"
// //                    stroke-linecap="round" />
// //                </svg>
// //                <span class="absolute text-3xl font-black text-white tabular-nums">{{ complianceData()?.dataHealth?.score }}%</span>
// //             </div>
// //             <p class="font-bold text-emerald-500 uppercase tracking-tighter" [style.font-size]="'var(--font-size-xs)'">Overall Healthy</p>
// //           </div>

// //           <div class="lg:col-span-8 p-6 border" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-center mb-8">
// //               <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">Tax Compliance Ledger</h3>
// //               <span class="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
// //                 {{ complianceData()?.tax?.compliance }}
// //               </span>
// //             </div>

// //             <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
// //               <div>
// //                 <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Input GST</p>
// //                 <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.inputTax | number }}</p>
// //               </div>
// //               <div>
// //                 <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Output GST</p>
// //                 <p class="text-2xl font-bold tabular-nums text-white">₹{{ complianceData()?.tax?.outputTax | number }}</p>
// //               </div>
// //               <div class="p-3 rounded-lg" [style.background]="'var(--theme-bg-ternary)'">
// //                 <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="mb-1 uppercase font-bold">Net Payable</p>
// //                 <p class="text-2xl font-bold tabular-nums text-emerald-500">₹{{ complianceData()?.tax?.netPayable | number }}</p>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
// //           <div class="lg:col-span-5 space-y-6">
// //             <div class="p-6 border h-full" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //                <h3 class="font-bold uppercase tracking-tighter mb-6" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">System Integrity Checks</h3>
               
// //                <div class="space-y-4">
// //                  @for (issue of complianceData()?.dataHealth?.issues; track issue.check) {
// //                    <div class="p-4 border transition-all" 
// //                         [style.background]="'var(--theme-bg-ternary)'" 
// //                         [style.border-color]="issue.status === 'healthy' ? 'var(--theme-border-secondary)' : 'rgba(251, 191, 36, 0.2)'"
// //                         [style.border-radius]="'var(--ui-border-radius-lg)'">
// //                       <div class="flex items-center gap-3 mb-2">
// //                         <i class="pi" 
// //                            [ngClass]="issue.status === 'healthy' ? 'pi-check-circle text-emerald-500' : 'pi-exclamation-triangle text-amber-500'"></i>
// //                         <span class="font-bold text-white" [style.font-size]="'var(--font-size-sm)'">{{ issue.check }}</span>
// //                       </div>
// //                       <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ issue.details }}</p>
// //                    </div>
// //                  }
// //                </div>
// //             </div>
// //           </div>

// //           <div class="lg:col-span-7">
// //             <div class="border overflow-hidden shadow-sm" 
// //                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
// //                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Audit Trail (Recent Events)</h3>
// //                 <span class="text-[9px] font-mono opacity-50 uppercase" [style.color]="'var(--theme-text-label)'">Immutable Logs</span>
// //               </div>

// //               <p-table [value]="complianceData()?.audit?.recentEvents" styleClass="p-datatable-sm no-border-table">
// //                 <ng-template pTemplate="header">
// //                   <tr>
// //                     <th [style.color]="'var(--theme-text-label)'">Administrator</th>
// //                     <th [style.color]="'var(--theme-text-label)'">Action</th>
// //                     <th [style.color]="'var(--theme-text-label)'" class="text-right">Time</th>
// //                   </tr>
// //                 </ng-template>
// //                 <ng-template pTemplate="body" let-event>
// //                   <tr [style.color]="'var(--theme-text-secondary)'">
// //                     <td>
// //                       <div class="flex flex-col">
// //                         <span class="font-bold text-white">{{ event.userId?.name }}</span>
// //                         <span class="text-[9px]" [style.color]="'var(--theme-text-label)'">{{ event.ip }}</span>
// //                       </div>
// //                     </td>
// //                     <td>
// //                       <div class="flex flex-col">
// //                          <span class="px-2 py-0.5 w-fit rounded font-bold text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-tighter">
// //                            {{ event.action.split(':')[1] || event.action }}
// //                          </span>
// //                          <span class="text-[9px] mt-1 opacity-50">{{ event.entityType }}</span>
// //                       </div>
// //                     </td>
// //                     <td class="text-right font-mono text-[10px] font-bold text-white tabular-nums">
// //                       {{ event.createdAt | date:'HH:mm:ss' }}
// //                     </td>
// //                   </tr>
// //                 </ng-template>
// //               </p-table>
// //             </div>
// //           </div>
// //         </div>

// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
// //           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Validating Governance Data...</p>
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
// //       padding: 1rem;
// //       font-size: 10px;
// //       font-weight: 700;
// //       text-transform: uppercase;
// //       border: none !important;
// //     }
// //   `]
// // })
// // export class ComplianceDashboardComponent implements OnInit {
// //   complianceData = signal<any>(null);
// //   loading = signal<boolean>(true);

// //   constructor(private analyticsService: AdminAnalyticsService) {}

// //   ngOnInit() {
// //     this.loadData();
// //   }

// //   loadData() {
// //     this.loading.set(true);
// //     this.analyticsService.getComplianceDashboard().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.complianceData.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: () => this.loading.set(false)
// //     });
// //   }
// // }