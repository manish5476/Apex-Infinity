import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs'; // Ensure this matches your PrimeNG version (v18+ uses TabsModule, older uses TabViewModule)
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-time-analytics',
  standalone: true,
  imports: [
    CommonModule, TabsModule, ButtonModule, 
    ProgressSpinnerModule, TooltipModule,
    AgShareGrid // Added Custom Grid
  ],
  template: `
    <div class="relative w-full p-1 md:p-2 overflow-hidden rounded-2xl transition-all duration-500" 
         [style.font-family]="'var(--font-body)'">

      <div class="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px] animate-pulse-slow pointer-events-none"></div>

      <div class="relative z-10 p-6 border rounded-2xl transition-all"
           style="background: rgba(15, 23, 42, 0.6); 
                  backdrop-filter: blur(16px); 
                  -webkit-backdrop-filter: blur(16px);
                  border: 1px solid rgba(255, 255, 255, 0.08);
                  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);">

        <div class="mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <h2 class="font-bold tracking-tight mb-1 text-xl text-white flex items-center gap-2">
              <i class="pi pi-calendar-clock text-teal-400"></i>
              Revenue Chronology
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
              Multi-dimensional time analysis of sales volume
            </p>
          </div>
          <p-button label="Refresh Timeline" icon="pi pi-history" [outlined]="true" severity="secondary" size="small" (onClick)="loadData()" [loading]="loading()"></p-button>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
             
             <div class="p-4 border transition-all hover:scale-[1.02]" 
                  style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
               <p class="uppercase font-bold text-[10px] mb-1 text-slate-400">Peak Hour</p>
               <p class="font-bold text-white tabular-nums text-lg">{{ topHour()?.hourLabel || '--' }}</p>
               <p class="text-[10px] text-emerald-400 font-bold mt-1">₹{{ topHour()?.totalRevenue | number }} Revenue</p>
             </div>

             <div class="p-4 border transition-all hover:scale-[1.02]" 
                  style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
               <p class="uppercase font-bold text-[10px] mb-1 text-slate-400">Strongest Day</p>
               <p class="font-bold text-white text-lg">{{ topDay()?.dayLabel || '--' }}</p>
               <p class="text-[10px] text-indigo-400 font-bold mt-1">{{ topDay()?.transactionCount || 0 }} Transactions</p>
             </div>

             <div class="p-4 border transition-all hover:scale-[1.02]" 
                  style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); border-radius: 12px;">
               <p class="uppercase font-bold text-[10px] mb-1 text-slate-400">Avg Ticket (Monthly)</p>
               <p class="font-bold text-white text-lg">₹{{ avgMonthlyTicket() | number:'1.0-0' }}</p>
               <p class="text-[10px] text-amber-500 font-bold mt-1">Based on Jan 2026</p>
             </div>

             <div class="p-4 border flex items-center justify-center relative overflow-hidden" 
                  style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(20, 184, 166, 0.05) 100%); border-color: rgba(20, 184, 166, 0.3); border-radius: 12px;">
               <div class="text-center relative z-10">
                  <p class="text-teal-100 font-black text-xs uppercase tracking-tighter opacity-80">Total Period Rev</p>
                  <p class="text-2xl font-bold text-white tabular-nums">₹{{ totalPeriodRevenue() | number }}</p>
               </div>
               <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-400/20 blur-2xl rounded-full"></div>
             </div>
          </div>

          <div class="card overflow-hidden transition-all" 
               style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;">
               
            <p-tabs [value]="'0'">
              <p-tablist styleClass="custom-tablist">
                <p-tab value="0"><i class="pi pi-clock mr-2 text-sm"></i> <span class="text-sm font-bold">Hourly</span></p-tab>
                <p-tab value="1"><i class="pi pi-calendar mr-2 text-sm"></i> <span class="text-sm font-bold">Daily</span></p-tab>
                <p-tab value="2"><i class="pi pi-calendar-plus mr-2 text-sm"></i> <span class="text-sm font-bold">Weekly</span></p-tab>
                <p-tab value="3"><i class="pi pi-chart-line mr-2 text-sm"></i> <span class="text-sm font-bold">Monthly</span></p-tab>
              </p-tablist>

              <p-tabpanels class="p-0">
                
                <p-tabpanel value="0">
                   <div class="grid-wrapper relative min-h-[350px]">
                      <app-ag-share-grid 
                        [columns]="hourlyColumns" 
                        [data]="timeData()?.hourly || []" 
                        [showActions]="false"
                        style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                      </app-ag-share-grid>
                   </div>
                </p-tabpanel>

                <p-tabpanel value="1">
                   <div class="grid-wrapper relative min-h-[350px]">
                      <app-ag-share-grid 
                        [columns]="dailyColumns" 
                        [data]="timeData()?.daily || []" 
                        [showActions]="false"
                        style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                      </app-ag-share-grid>
                   </div>
                </p-tabpanel>

                <p-tabpanel value="2">
                   <div class="grid-wrapper relative min-h-[350px]">
                      <app-ag-share-grid 
                        [columns]="weeklyColumns" 
                        [data]="timeData()?.weekly || []" 
                        [showActions]="false"
                        style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                      </app-ag-share-grid>
                   </div>
                </p-tabpanel>

                <p-tabpanel value="3">
                   <div class="grid-wrapper relative min-h-[350px]">
                      <app-ag-share-grid 
                        [columns]="monthlyColumns" 
                        [data]="timeData()?.monthly || []" 
                        [showActions]="false"
                        style="width: 100%; height: 100%; display: block; position: absolute; inset: 0;">
                      </app-ag-share-grid>
                   </div>
                </p-tabpanel>

              </p-tabpanels>
            </p-tabs>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
            <p class="text-slate-500 text-sm font-bold uppercase tracking-widest">Compiling Time Series...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    .animate-pulse-slow {
      animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    /* Tab Overrides for Glass Theme */
    :host ::ng-deep .p-tablist {
      background: rgba(255,255,255,0.03) !important;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    :host ::ng-deep .p-tab {
      color: #94a3b8 !important;
      border-color: transparent !important;
      transition: all 0.3s;
    }
    :host ::ng-deep .p-tab-active {
      color: #fff !important;
      border-bottom-color: #14b8a6 !important; /* Teal-500 */
    }
    :host ::ng-deep .p-tabpanels {
      background: transparent !important;
      padding: 0 !important;
    }
  `]
})
export class TimeAnalyticsComponent implements OnInit {
  timeData = signal<any>(null);
  loading = signal<boolean>(true);

  // Column Definitions
  hourlyColumns: any[] = [];
  dailyColumns: any[] = [];
  weeklyColumns: any[] = [];
  monthlyColumns: any[] = [];

  // Computed Insights
  totalPeriodRevenue = computed(() => {
    return this.timeData()?.monthly?.reduce((acc: number, m: any) => acc + m.totalRevenue, 0) || 0;
  });

  topHour = computed(() => {
    if (!this.timeData()?.hourly?.length) return null;
    return [...this.timeData().hourly].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  });

  topDay = computed(() => {
    if (!this.timeData()?.daily?.length) return null;
    return [...this.timeData().daily].sort((a, b) => b.transactionCount - a.transactionCount)[0];
  });

  avgMonthlyTicket = computed(() => {
    const month = this.timeData()?.monthly?.[0];
    if (!month || !month.transactionCount) return 0;
    return month.totalRevenue / month.transactionCount;
  });

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

  setupColumns() {
    // 1. Hourly Columns
    this.hourlyColumns = [
      { field: 'hourLabel', headerName: 'Time Slot', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': '#fff' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'monospace', 'text-align': 'right' } },
      { field: 'avgTicketSize', headerName: 'Avg Ticket', sortable: true, width: 140, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': '#818cf8', 'font-weight': '700', 'text-align': 'right' } },
      { field: 'totalRevenue', headerName: 'Total Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': '#34d399', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 2. Daily Columns
    this.dailyColumns = [
      { field: 'dayLabel', headerName: 'Day', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': '#fff' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'monospace', 'text-align': 'right' } },
      { field: 'totalRevenue', headerName: 'Daily Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': '#34d399', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 3. Weekly Columns
    this.weeklyColumns = [
      { field: 'week', headerName: 'Week Number', sortable: true, flex: 1, valueFormatter: (p: any) => `Week ${p.value}`, cellStyle: { 'font-weight': '700', 'color': '#fff' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'monospace', 'text-align': 'right' } },
      { field: 'totalRevenue', headerName: 'Weekly Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': '#818cf8', 'font-weight': '700', 'text-align': 'right' } }
    ];

    // 4. Monthly Columns
    this.monthlyColumns = [
      { field: 'monthLabel', headerName: 'Period', sortable: true, flex: 1, cellStyle: { 'font-weight': '700', 'color': '#fff' } },
      { field: 'transactionCount', headerName: 'Transactions', sortable: true, width: 120, type: 'rightAligned', cellStyle: { 'font-family': 'monospace', 'text-align': 'right' } },
      { field: 'totalRevenue', headerName: 'Monthly Revenue', sortable: true, width: 150, type: 'rightAligned', valueFormatter: (p: any) => this.commonService.formatCurrency(p.value), cellStyle: { 'color': '#f59e0b', 'font-weight': '700', 'text-align': 'right' } }
    ];

    this.cdr.detectChanges();
  }

  loadData() {
    this.loading.set(true);
    this.analyticsService.getTimeBasedAnalytics().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.timeData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}

// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';

// import { TableModule } from 'primeng/table';
// import { TabsModule } from 'primeng/tabs';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-time-analytics',
//   standalone: true,
//   imports: [CommonModule, TableModule, TabsModule, ButtonModule, ProgressSpinnerModule, TooltipModule],
//   template: `
//     <div class="p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">

//       <div class="mb-6 flex flex-wrap justify-between items-center gap-4">
//         <div>
//           <h2 class="font-bold tracking-tight mb-1" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-2xl)'">Revenue Chronology</h2>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//             Multi-dimensional time analysis of sales volume and ticket sizes
//           </p>
//         </div>
//         <p-button label="Refresh Timeline" icon="pi pi-history" [outlined]="true" size="small" (onClick)="loadData()"></p-button>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//            <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
//               <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Peak Hour</p>
//               <p class="font-bold text-white tabular-nums">{{ topHour()?.hourLabel }}</p>
//               <p class="text-[10px] text-emerald-500 font-bold mt-1">₹{{ topHour()?.totalRevenue | number }}</p>
//            </div>
//            <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
//               <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Strongest Day</p>
//               <p class="font-bold text-white">{{ topDay()?.dayLabel }}</p>
//               <p class="text-[10px] text-indigo-400 font-bold mt-1">{{ topDay()?.transactionCount }} Transactions</p>
//            </div>
//            <div class="p-4 border transition-all" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
//               <p class="uppercase font-bold text-[10px] mb-1" [style.color]="'var(--theme-text-label)'">Avg Ticket (Monthly)</p>
//               <p class="font-bold text-white">₹{{ (timeData()?.monthly[0]?.totalRevenue / timeData()?.monthly[0]?.transactionCount) | number:'1.0-0' }}</p>
//               <p class="text-[10px] text-amber-500 font-bold mt-1">Jan 2026 Basis</p>
//            </div>
//            <div class="p-4 border flex items-center justify-center" [style.background]="'var(--theme-accent-gradient)'" [style.border-radius]="'var(--ui-border-radius-lg)'">
//               <div class="text-center">
//                  <p class="text-white font-black text-xs uppercase tracking-tighter">Total Period Rev</p>
//                  <p class="text-xl font-bold text-white tabular-nums">₹{{ totalPeriodRevenue() | number }}</p>
//               </div>
//            </div>
//         </div>

//         <div class="card overflow-hidden transition-all" 
//              [style.background]="'var(--theme-bg-secondary)'" 
//              [style.border-color]="'var(--theme-border-primary)'" 
//              [style.border-radius]="'var(--ui-border-radius-xl)'"
//              [style.box-shadow]="'var(--shadow-lg)'">
             
//           <p-tabs [value]="'0'">
//             <p-tablist [style.background]="'var(--theme-bg-ternary)'">
//               <p-tab value="0"><i class="pi pi-clock mr-2"></i> Hourly</p-tab>
//               <p-tab value="1"><i class="pi pi-calendar mr-2"></i> Daily</p-tab>
//               <p-tab value="2"><i class="pi pi-calendar-plus mr-2"></i> Weekly</p-tab>
//               <p-tab value="3"><i class="pi pi-chart-line mr-2"></i> Monthly</p-tab>
//             </p-tablist>

//             <p-tabpanels [style.background]="'transparent'" class="p-0">
              
//               <p-tabpanel value="0">
//                 <p-table [value]="timeData()?.hourly" styleClass="p-datatable-sm no-border-table">
//                   <ng-template pTemplate="header">
//                     <tr>
//                       <th [style.color]="'var(--theme-text-label)'">Time Slot</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Avg Ticket</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Total Revenue</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-h>
//                     <tr [style.color]="'var(--theme-text-secondary)'">
//                       <td class="font-bold">{{ h.hourLabel }}</td>
//                       <td class="text-right font-mono">{{ h.transactionCount }}</td>
//                       <td class="text-right tabular-nums text-indigo-400">₹{{ h.avgTicketSize | number }}</td>
//                       <td class="text-right font-bold tabular-nums text-white">₹{{ h.totalRevenue | number }}</td>
//                     </tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>

//               <p-tabpanel value="1">
//                 <p-table [value]="timeData()?.daily" styleClass="p-datatable-sm no-border-table">
//                   <ng-template pTemplate="header">
//                     <tr>
//                       <th [style.color]="'var(--theme-text-label)'">Day</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Daily Revenue</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-d>
//                     <tr [style.color]="'var(--theme-text-secondary)'">
//                       <td class="font-bold text-white">{{ d.dayLabel }}</td>
//                       <td class="text-right font-mono">{{ d.transactionCount }}</td>
//                       <td class="text-right font-bold tabular-nums text-emerald-500">₹{{ d.totalRevenue | number }}</td>
//                     </tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>

//               <p-tabpanel value="2">
//                 <p-table [value]="timeData()?.weekly" styleClass="p-datatable-sm no-border-table">
//                   <ng-template pTemplate="header">
//                     <tr>
//                       <th [style.color]="'var(--theme-text-label)'">Week Number</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Weekly Revenue</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-w>
//                     <tr [style.color]="'var(--theme-text-secondary)'">
//                       <td class="font-bold">Week {{ w.week }}</td>
//                       <td class="text-right font-mono">{{ w.transactionCount }}</td>
//                       <td class="text-right font-bold tabular-nums text-indigo-400">₹{{ w.totalRevenue | number }}</td>
//                     </tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>

//               <p-tabpanel value="3">
//                 <p-table [value]="timeData()?.monthly" styleClass="p-datatable-sm no-border-table">
//                   <ng-template pTemplate="header">
//                     <tr>
//                       <th [style.color]="'var(--theme-text-label)'">Period</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Transactions</th>
//                       <th [style.color]="'var(--theme-text-label)'" class="text-right">Monthly Revenue</th>
//                     </tr>
//                   </ng-template>
//                   <ng-template pTemplate="body" let-m>
//                     <tr [style.color]="'var(--theme-text-secondary)'">
//                       <td class="font-bold text-white">{{ m.monthLabel }}</td>
//                       <td class="text-right font-mono">{{ m.transactionCount }}</td>
//                       <td class="text-right font-bold tabular-nums text-emerald-500">₹{{ m.totalRevenue | number }}</td>
//                     </tr>
//                   </ng-template>
//                 </p-table>
//               </p-tabpanel>

//             </p-tabpanels>
//           </p-tabs>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'" class="font-bold uppercase tracking-widest">Compiling Time Series...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host ::ng-deep .no-border-table .p-datatable-tbody > tr {
//       background: transparent !important;
//       border-bottom: 1px solid var(--theme-border-primary) !important;
//     }
//     :host ::ng-deep .no-border-table .p-datatable-thead > tr > th {
//       background: transparent !important;
//       padding: 1rem;
//       font-size: 10px;
//       font-weight: 700;
//       text-transform: uppercase;
//       border: none !important;
//     }
//     :host ::ng-deep .p-tablist-tab-list {
//       border-bottom: 1px solid var(--theme-border-primary) !important;
//     }
//   `]
// })
// export class TimeAnalyticsComponent implements OnInit {
//   timeData = signal<any>(null);
//   loading = signal<boolean>(true);

//   // Computed insights
//   totalPeriodRevenue = computed(() => {
//     return this.timeData()?.monthly.reduce((acc: number, m: any) => acc + m.totalRevenue, 0) || 0;
//   });

//   topHour = computed(() => {
//     if (!this.timeData()?.hourly.length) return null;
//     return [...this.timeData().hourly].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
//   });

//   topDay = computed(() => {
//     if (!this.timeData()?.daily.length) return null;
//     return [...this.timeData().daily].sort((a, b) => b.transactionCount - a.transactionCount)[0];
//   });

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getTimeBasedAnalytics().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.timeData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }