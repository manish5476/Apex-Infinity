import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

interface PeakHour {
  count: number;
  day: number;
  hour: number;
}

@Component({
  selector: 'app-operational-metrics',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, 
    TooltipModule, ProgressSpinnerModule, TagModule,
    AgShareGrid // Added Custom Grid
  ],
  template: `
    <div class="p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="p-5 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Avg Order Value</p>
            <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ opData()?.metrics?.orderEfficiency?.averageOrderValue | number:'1.0-0' }}</h2>
            <div class="flex items-center gap-2 mt-2">
              <i class="pi pi-check-circle text-emerald-500 text-xs"></i>
              <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Cancellation Rate: {{ opData()?.metrics?.orderEfficiency?.cancellationRate }}%</span>
            </div>
          </div>

          <div class="p-5 border transition-all" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Discounts Granted</p>
            <h2 class="text-3xl font-bold tabular-nums text-rose-400">₹{{ opData()?.metrics?.discountMetrics?.totalDiscount | number }}</h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Avg Rate: {{ opData()?.metrics?.discountMetrics?.discountRate }}%</p>
          </div>

          <div class="p-5 border relative overflow-hidden" 
               [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="relative z-10 text-white">
              <p class="uppercase font-black tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Peak Store Traffic</p>
              <h3 class="font-bold text-2xl tabular-nums">{{ getFormattedPeakHour() }}</h3>
              <p class="mt-2 text-[10px] uppercase font-bold opacity-90">Most active timeframe detected</p>
            </div>
            <i class="pi pi-chart-bar absolute right-[-10px] bottom-[-10px] text-7xl text-white opacity-10"></i>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8">
            <div class="border overflow-hidden shadow-sm h-full flex flex-col" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center shrink-0" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Workforce Productivity</h3>
                <p-button icon="pi pi-users" [text]="true" size="small"></p-button>
              </div>
              
              <div class="grid-wrapper flex-1 relative min-h-[400px]">
                 <app-ag-share-grid 
                   [columns]="staffColumns" 
                   [data]="opData()?.productivity?.staff || []" 
                   [showActions]="false" 
                   style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            
            <div class="p-5 border transition-colors shadow-sm" 
                 [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-bolt text-amber-400"></i>
                <h4 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Staffing Recommendations</h4>
              </div>
              <div class="space-y-3">
                @for (rec of opData()?.operations?.recommendations; track rec) {
                  <div class="p-3 border rounded-lg transition-all border-dashed" 
                       [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
                    <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
                      {{ rec }}
                    </p>
                  </div>
                }
              </div>
            </div>

            <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Upcoming Peak Windows</h4>
              <div class="space-y-4">
                @for (peak of opData()?.operations?.peakHours; track peak.hour) {
                  <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                      <div class="w-1.5 h-8 rounded-full bg-indigo-500"></div>
                      <div>
                        <p class="font-bold leading-none" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">
                          {{ getDayName(peak.day) }}, {{ peak.hour }}:00
                        </p>
                        <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="mt-1">Forecasted Volume</p>
                      </div>
                    </div>
                    <span class="font-bold text-indigo-400" [style.font-size]="'var(--font-size-sm)'">{{ peak.count }} Trxn</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Synchronizing operational logs...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: []
})
export class OperationalMetricsComponent implements OnInit {
  opData = signal<any>(null);
  loading = signal<boolean>(true);
  
  staffColumns: any[] = [];

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
    this.staffColumns = [
      {
        field: 'name', 
        headerName: 'Sales Associate', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const email = params.data.email || '';
          const initials = this.commonService.getInitials(name);

          return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--theme-accent-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">
                      ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 700; color: #fff;">${name}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'email', 
        headerName: 'Sales Associate', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const email = params.data.email || '';
          return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 10px; color: var(--theme-text-label);">${email}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Invoices', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'monospace', 'font-weight': '700', 'text-align': 'right' }
      },
      {
        field: 'avgTicketSize', 
        headerName: 'Avg Ticket', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--theme-text-primary)', 'text-align': 'right' }
      },
      {
        field: 'totalSales', 
        headerName: 'Total Contribution', 
        sortable: true, 
        width: 150,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': '#10b981', 'text-align': 'right' } // Emerald color
      }
    ];
    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getOperationalMetrics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.opData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getFormattedPeakHour(): string {
    const peak = this.opData()?.operations?.peakHours[0];
    if (!peak) return 'No Peak Data';
    return `${this.getDayName(peak.day)} at ${peak.hour}:00`;
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || 'Unknown';
  }
}
// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TagModule } from 'primeng/tag';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// interface PeakHour {
//   count: number;
//   day: number;
//   hour: number;
// }

// @Component({
//   selector: 'app-operational-metrics',
//   standalone: true,
//   imports: [CommonModule, TableModule, ButtonModule, TooltipModule, ProgressSpinnerModule, TagModule],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div class="p-5 border transition-all" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Avg Order Value</p>
//             <h2 class="text-3xl font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'">₹{{ opData()?.metrics?.orderEfficiency?.averageOrderValue | number }}</h2>
//             <div class="flex items-center gap-2 mt-2">
//               <i class="pi pi-check-circle text-emerald-500 text-xs"></i>
//               <span [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Cancellation Rate: {{ opData()?.metrics?.orderEfficiency?.cancellationRate }}%</span>
//             </div>
//           </div>

//           <div class="p-5 border transition-all" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <p class="uppercase font-bold tracking-widest mb-1" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Discounts Granted</p>
//             <h2 class="text-3xl font-bold tabular-nums text-rose-400">₹{{ opData()?.metrics?.discountMetrics?.totalDiscount | number }}</h2>
//             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Avg Rate: {{ opData()?.metrics?.discountMetrics?.discountRate }}%</p>
//           </div>

//           <div class="p-5 border relative overflow-hidden" 
//                [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="relative z-10 text-white">
//               <p class="uppercase font-black tracking-tighter opacity-80" [style.font-size]="'var(--font-size-xs)'">Peak Store Traffic</p>
//               <h3 class="font-bold text-2xl tabular-nums">{{ getFormattedPeakHour() }}</h3>
//               <p class="mt-2 text-[10px] uppercase font-bold opacity-90">Most active timeframe detected</p>
//             </div>
//             <i class="pi pi-chart-bar absolute right-[-10px] bottom-[-10px] text-7xl text-white opacity-10"></i>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-8">
//             <div class="border overflow-hidden shadow-sm" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Workforce Productivity</h3>
//                 <p-button icon="pi pi-users" [text]="true" size="small"></p-button>
//               </div>
              
//               <p-table [value]="opData()?.productivity?.staff" styleClass="p-datatable-sm">
//                 <ng-template pTemplate="header">
//                   <tr>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Sales Associate</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Invoices</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Avg Ticket</th>
//                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'" class="text-right">Total Contribution</th>
//                   </tr>
//                 </ng-template>
//                 <ng-template pTemplate="body" let-staff>
//                   <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
//                     <td>
//                       <div class="flex items-center gap-3">
//                         <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" [style.background]="'var(--theme-accent-gradient)'">
//                           {{ commonService.getInitials(staff.name) }}
//                         </div>
//                         <div class="flex flex-col">
//                           <span class="font-bold text-white">{{ staff.name }}</span>
//                           <span class="text-[10px]" [style.color]="'var(--theme-text-label)'">{{ staff.email }}</span>
//                         </div>
//                       </div>
//                     </td>
//                     <td class="text-right font-mono font-bold">{{ staff.invoiceCount }}</td>
//                     <td class="text-right font-bold tabular-nums">₹{{ staff.avgTicketSize | number }}</td>
//                     <td class="text-right">
//                        <span class="font-bold tabular-nums text-emerald-500" [style.font-size]="'var(--font-size-md)'">₹{{ staff.totalSales | number }}</span>
//                     </td>
//                   </tr>
//                 </ng-template>
//               </p-table>
//             </div>
//           </div>

//           <div class="lg:col-span-4 space-y-6">
            
//             <div class="p-5 border transition-colors shadow-sm" 
//                  [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="flex items-center gap-2 mb-4">
//                 <i class="pi pi-bolt text-amber-400"></i>
//                 <h4 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Staffing Recommendations</h4>
//               </div>
//               <div class="space-y-3">
//                 @for (rec of opData()?.operations?.recommendations; track rec) {
//                   <div class="p-3 border rounded-lg transition-all border-dashed" 
//                        [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-secondary)'">
//                     <p [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">
//                       {{ rec }}
//                     </p>
//                   </div>
//                 }
//               </div>
//             </div>

//             <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Upcoming Peak Windows</h4>
//               <div class="space-y-4">
//                 @for (peak of opData()?.operations?.peakHours; track peak.hour) {
//                   <div class="flex items-center justify-between group">
//                     <div class="flex items-center gap-3">
//                       <div class="w-1.5 h-8 rounded-full bg-indigo-500"></div>
//                       <div>
//                         <p class="font-bold leading-none" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">
//                           {{ getDayName(peak.day) }}, {{ peak.hour }}:00
//                         </p>
//                         <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="mt-1">Forecasted Volume</p>
//                       </div>
//                     </div>
//                     <span class="font-bold text-indigo-400" [style.font-size]="'var(--font-size-sm)'">{{ peak.count }} Trxn</span>
//                   </div>
//                 }
//               </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[50vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Synchronizing operational logs...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
//       background: transparent !important;
//       border-bottom: 1px solid var(--theme-border-primary) !important;
//     }
//     :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
//       padding: 0.85rem 1rem;
//       font-size: 10px;
//       font-weight: 700;
//       text-transform: uppercase;
//       border: none !important;
//     }
//   `]
// })
// export class OperationalMetricsComponent implements OnInit {
//   opData = signal<any>(null);
//   loading = signal<boolean>(true);

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService
//   ) {}

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getOperationalMetrics().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.opData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   // Helper to format peak hour from the first entry
//   getFormattedPeakHour(): string {
//     const peak = this.opData()?.operations?.peakHours[0];
//     if (!peak) return 'No Peak Data';
//     return `${this.getDayName(peak.day)} at ${peak.hour}:00`;
//   }

//   getDayName(day: number): string {
//     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//     return days[day] || 'Unknown';
//   }
// }