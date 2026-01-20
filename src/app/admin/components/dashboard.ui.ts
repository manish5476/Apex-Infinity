import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

@Component({
  selector: 'app-admin-dashboard-Ui',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, 
    TagModule, TooltipModule, ProgressSpinnerModule, ToastModule,
    AgShareGrid
  ],
  template: `
    <div class="min-h-screen p-4 md:p-6 transition-colors duration-300" 
         [style.background]="'var(--theme-bg-primary)'"
         [style.font-family]="'var(--font-body)'">
         
      <div class="mb-6 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 class="font-bold tracking-tight" 
              [style.color]="'var(--theme-text-primary)'"
              [style.font-family]="'var(--font-heading)'"
              [style.font-size]="'var(--font-size-3xl)'">Executive Overview</h1>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
            Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
            <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold">HEALTH SCORE</span>
            <span class="font-bold text-emerald-500" [style.font-size]="'var(--font-size-md)'">{{ dashboard()?.inventory?.healthScore }}%</span>
          </div>
          <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'" [style.box-shadow]="'var(--shadow-sm)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Total Revenue</span>
              <i class="pi pi-wallet text-indigo-400"></i>
            </div>
            <div class="flex items-end gap-2">
              <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-3xl)'">
                ₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}
              </h2>
              <span class="mb-1 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">
                <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
              </span>
            </div>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">
              Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number:'1.0-0' }}
            </p>
          </div>

          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Net Profit</span>
              <i class="pi pi-chart-line text-emerald-400"></i>
            </div>
            <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-3xl)'">
              ₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}
            </h2>
            <div class="flex gap-2 mt-2 items-center">
              <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
            </div>
          </div>

          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Total Expenses</span>
              <i class="pi pi-minus-circle text-rose-400"></i>
            </div>
            <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-3xl)'">
              ₹{{ dashboard()?.financial?.totalExpense?.value | number }}
            </h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ dashboard()?.financial?.totalExpense?.count }} Transactions recorded</p>
          </div>

          <div class="p-4 border transition-all hover:scale-[1.01]" 
               [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
            <div class="flex justify-between items-start mb-2">
              <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Value</span>
              <i class="pi pi-box text-blue-400"></i>
            </div>
            <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-2xl)'">
              ₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr
            </h2>
            <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-8 space-y-6">
            
            <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="flex items-center gap-2 mb-4">
                <i class="pi pi-sparkles text-indigo-400"></i>
                <h3 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Operational Insights</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (insight of dashboard()?.insights?.insights; track insight.title) {
                  <div class="p-3 border rounded-lg transition-all" 
                       [style.background]="'var(--theme-bg-ternary)'" [style.border-left]="insight.type === 'positive' ? '4px solid var(--theme-success)' : '4px solid var(--theme-info)'">
                    <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ insight.title }}</p>
                    <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">{{ insight.message }}</p>
                  </div>
                }
              </div>
            </div>

            <div class="border overflow-hidden" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Critical Inventory Alerts</h3>
                <span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px]">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
              </div>
              
              <div class="grid-wrapper">
                 <app-ag-share-grid 
                   [columns]="alertColumns" 
                   [data]="dashboard()?.inventory?.lowStockAlerts || []" 
                   [showActions]="false" 
                   style="height: 100%; min-height: 250px; width: 100%; display: block;">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 space-y-6">
            
            <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Top Sellers</h4>
              <div class="space-y-4">
                @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        #{{ $index + 1 }}
                      </div>
                      <div>
                        <p class="font-bold leading-none truncate w-32" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ prod.name }}</p>
                        <p class="mt-1" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Qty: {{ prod.soldQty }}</p>
                      </div>
                    </div>
                    <span class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">₹{{ prod.revenue | number }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="border overflow-hidden" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
                <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Top Customers</h3>
                <span class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">By Revenue</span>
              </div>
              
              <div class="grid-wrapper">
                 <app-ag-share-grid 
                   [columns]="customerColumns" 
                   [data]="dashboard()?.leaders?.topCustomers || []" 
                   [showActions]="false" 
                   style="height: 100%; min-height: 300px; width: 100%; display: block;">
                 </app-ag-share-grid>
              </div>
            </div>

            <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
              <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Sales Leaderboard</h4>
              @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
                <div class="flex items-center justify-between group py-2 border-b border-white/5 last:border-0">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" [style.background]="'var(--theme-accent-gradient)'">
                      {{ staff.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ staff.name }}</p>
                      <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ staff.count }} deals closed</p>
                    </div>
                  </div>
                  <span class="font-bold tabular-nums text-emerald-500" [style.font-size]="'var(--font-size-sm)'">₹{{ staff.revenue | number }}</span>
                </div>
              }
            </div>

          </div>
        </div>
      </ng-container>

      <ng-template #loader>
        <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
          <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Compiling executive data...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: []
})
export class DashboardUI implements OnInit {
  // Signals for Reactive UI
  dashboard = signal<any>(null);
  loading = signal<boolean>(true);
  
  // Grid Columns
  alertColumns: any[] = [];
  customerColumns: any[] = [];

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadDashboard();
  }

  setupColumns(): void {
    // 1. Critical Inventory Alert Columns
    this.alertColumns = [
      {
        field: 'name', 
        headerName: 'Product', 
        sortable: true, 
        flex: 1,
        cellStyle: { 'font-weight': '700' }
      },
      {
        field: 'currentStock', 
        headerName: 'Stock', 
        sortable: true, 
        width: 100,
        cellStyle: { 'color': 'var(--theme-error)', 'font-family': 'monospace' }
      },
      {
        field: 'reorderLevel', 
        headerName: 'Threshold', 
        sortable: true, 
        width: 120,
        cellStyle: { 'font-family': 'monospace' }
      },
      {
        field: 'urgency', 
        headerName: 'Urgency', 
        sortable: true, 
        width: 110,
        cellRenderer: (params: any) => {
          return `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: var(--theme-error); color: #fff;">
                    ${params.value || 'HIGH'}
                  </span>`;
        }
      }
    ];

    // 2. Top Customers Columns (New)
    this.customerColumns = [
      {
        field: 'name',
        headerName: 'Customer',
        sortable: true,
        flex: 1,
        cellRenderer: (params: any) => {
             return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
                        <span style="font-weight: 600; line-height: 1.2;">${params.value}</span>
                        <span style="font-size: 10px; color: var(--theme-text-tertiary);">${params.data.phone || ''}</span>
                     </div>`
        }
      },
      {
        field: 'totalSpent',
        headerName: 'Total Spent',
        sortable: true,
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--theme-success)' }
      },
      {
        field: 'transactions',
        headerName: 'Txns',
        sortable: true,
        width: 70,
        cellStyle: { 'text-align': 'center' }
      }
    ];

    this.cdr.detectChanges();
  }

  loadDashboard() {
    this.loading.set(true);
    this.analyticsService.getDashboardOverview().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.dashboard.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard Error', err);
        this.loading.set(false);
      }
    });
  }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// // Removed TableModule
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ToastModule } from 'primeng/toast';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-admin-dashboard-Ui',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, ButtonModule, 
//     TagModule, TooltipModule, ProgressSpinnerModule, ToastModule,
//     AgShareGrid // Added your custom grid component
//   ],
//   template: `
//     <div class="min-h-screen p-4 md:p-6 transition-colors duration-300" 
//          [style.background]="'var(--theme-bg-primary)'"
//          [style.font-family]="'var(--font-body)'">
         
//       <div class="mb-6 flex flex-wrap justify-between items-end gap-4">
//         <div>
//           <h1 class="font-bold tracking-tight" 
//               [style.color]="'var(--theme-text-primary)'"
//               [style.font-family]="'var(--font-heading)'"
//               [style.font-size]="'var(--font-size-3xl)'">Executive Overview</h1>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
//             Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
//           </p>
//         </div>
//         <div class="flex items-center gap-2">
//           <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
//             <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold">HEALTH SCORE</span>
//             <span class="font-bold text-emerald-500" [style.font-size]="'var(--font-size-md)'">{{ dashboard()?.inventory?.healthScore }}%</span>
//           </div>
//           <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//           <div class="p-4 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'" [style.box-shadow]="'var(--shadow-sm)'">
//             <div class="flex justify-between items-start mb-2">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Total Revenue</span>
//               <i class="pi pi-wallet text-indigo-400"></i>
//             </div>
//             <div class="flex items-end gap-2">
//               <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-3xl)'">
//                 ₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}
//               </h2>
//               <span class="mb-1 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">
//                 <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
//               </span>
//             </div>
//             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">
//               Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number }}
//             </p>
//           </div>

//           <div class="p-4 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-start mb-2">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Net Profit</span>
//               <i class="pi pi-chart-line text-emerald-400"></i>
//             </div>
//             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-3xl)'">
//               ₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}
//             </h2>
//             <div class="flex gap-2 mt-2 items-center">
//               <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
//             </div>
//           </div>

//           <div class="p-4 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-start mb-2">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Receivables</span>
//               <i class="pi pi-info-circle text-amber-400"></i>
//             </div>
//             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-warning)'" [style.font-size]="'var(--font-size-3xl)'">
//               ₹{{ dashboard()?.financial?.outstanding?.receivables | number }}
//             </h2>
//             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Pending from 3 customers</p>
//           </div>

//           <div class="p-4 border transition-all hover:scale-[1.01]" 
//                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//             <div class="flex justify-between items-start mb-2">
//               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Value</span>
//               <i class="pi pi-box text-blue-400"></i>
//             </div>
//             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-2xl)'">
//               ₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr
//             </h2>
//             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
//           </div>
//         </div>

//         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
//           <div class="lg:col-span-8 space-y-6">
            
//             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="flex items-center gap-2 mb-4">
//                 <i class="pi pi-sparkles text-indigo-400"></i>
//                 <h3 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Operational Insights</h3>
//               </div>
//               <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 @for (insight of dashboard()?.insights?.insights; track insight.title) {
//                   <div class="p-3 border rounded-lg transition-all" 
//                        [style.background]="'var(--theme-bg-ternary)'" [style.border-left]="insight.type === 'positive' ? '4px solid var(--theme-success)' : '4px solid var(--theme-info)'">
//                     <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ insight.title }}</p>
//                     <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">{{ insight.message }}</p>
//                   </div>
//                 }
//               </div>
//             </div>

//             <div class="border overflow-hidden" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
//                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Critical Inventory Alerts</h3>
//                 <span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px]">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
//               </div>
              
//               <div class="grid-wrapper">
//                  <app-ag-share-grid 
//                    [columns]="alertColumns" 
//                    [data]="dashboard()?.inventory?.lowStockAlerts || []" 
//                    [showActions]="false" 
//                    style="height: 100%; min-height: 300px; width: 100%; display: block;">
//                  </app-ag-share-grid>
//               </div>

//             </div>
//           </div>

//           <div class="lg:col-span-4 space-y-6">
            
//             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Top Sellers</h4>
//               <div class="space-y-4">
//                 @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
//                   <div class="flex items-center justify-between">
//                     <div class="flex items-center gap-3">
//                       <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
//                         #{{ $index + 1 }}
//                       </div>
//                       <div>
//                         <p class="font-bold leading-none truncate w-32" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ prod.name }}</p>
//                         <p class="mt-1" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Qty: {{ prod.soldQty }}</p>
//                       </div>
//                     </div>
//                     <span class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">₹{{ prod.revenue | number }}</span>
//                   </div>
//                 }
//               </div>
//             </div>

//             <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Sales Leaderboard</h4>
//               @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
//                 <div class="flex items-center justify-between group py-2 border-b border-white/5 last:border-0">
//                   <div class="flex items-center gap-3">
//                     <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" [style.background]="'var(--theme-accent-gradient)'">
//                       {{ staff.name.charAt(0) }}
//                     </div>
//                     <div>
//                       <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ staff.name }}</p>
//                       <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ staff.count }} deals closed</p>
//                     </div>
//                   </div>
//                   <span class="font-bold tabular-nums text-emerald-500" [style.font-size]="'var(--font-size-sm)'">₹{{ staff.revenue | number }}</span>
//                 </div>
//               }
//             </div>

//             <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
//               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Customer Base</h4>
//               <div class="space-y-3">
//                 <div class="flex justify-between items-center">
//                   <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">Total Active</span>
//                   <span class="font-bold" [style.color]="'var(--theme-text-primary)'">{{ dashboard()?.financial?.customers?.active }}</span>
//                 </div>
//                 <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
//                   <div class="h-full bg-indigo-500" [style.width]="'40%'"></div>
//                 </div>
//                 <p class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">New Customers: {{ dashboard()?.customers?.segmentation['New Customer'] }}</p>
//               </div>
//             </div>

//           </div>
//         </div>
//       </ng-container>

//       <ng-template #loader>
//         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
//           <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Compiling executive data...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [] // Removed p-datatable styles as they are no longer needed
// })
// export class DashboardUI implements OnInit {
//   // Signals for Reactive UI
//   dashboard = signal<any>(null);
//   loading = signal<boolean>(true);
  
//   // Grid Columns
//   alertColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.getAlertColumns();
//     this.loadDashboard();
//   }

//   getAlertColumns(): void {
//     this.alertColumns = [
//       {
//         field: 'name', 
//         headerName: 'Product', 
//         sortable: true, 
//         flex: 1,
//         cellStyle: { 'font-weight': '700' }
//       },
//       {
//         field: 'currentStock', 
//         headerName: 'Stock', 
//         sortable: true, 
//         width: 100,
//         cellStyle: { 'color': 'var(--theme-error)', 'font-family': 'monospace' }
//       },
//       {
//         field: 'reorderLevel', 
//         headerName: 'Threshold', 
//         sortable: true, 
//         width: 120,
//         cellStyle: { 'font-family': 'monospace' }
//       },
//       {
//         field: 'urgency', 
//         headerName: 'Urgency', 
//         sortable: true, 
//         width: 120,
//         cellRenderer: (params: any) => {
//           return `<span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: var(--theme-error); color: #fff;">
//                     ${params.value || 'HIGH'}
//                   </span>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadDashboard() {
//     this.loading.set(true);
//     this.analyticsService.getDashboardOverview().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.dashboard.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Dashboard Error', err);
//         this.loading.set(false);
//       }
//     });
//   }
// }

// // import { Component, OnInit, signal, inject } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { ButtonModule } from 'primeng/button';
// // import { TableModule } from 'primeng/table';
// // import { TagModule } from 'primeng/tag';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { ProgressSpinnerModule } from 'primeng/progressspinner';
// // import { ToastModule } from 'primeng/toast';
// // import { AdminAnalyticsService } from '../admin-analytics.service';
// // import { CommonMethodService } from '../../core/utils/common-method.service';

// // @Component({
// //   selector: 'app-admin-dashboard-Ui',
// //   standalone: true,
// //   imports: [
// //     CommonModule, FormsModule, ButtonModule, TableModule, 
// //     TagModule, TooltipModule, ProgressSpinnerModule, ToastModule
// //   ],
// //   template: `
// //     <div class="min-h-screen p-4 md:p-6 transition-colors duration-300" 
// //          [style.background]="'var(--theme-bg-primary)'"
// //          [style.font-family]="'var(--font-body)'">
         
// //       <div class="mb-6 flex flex-wrap justify-between items-end gap-4">
// //         <div>
// //           <h1 class="font-bold tracking-tight" 
// //               [style.color]="'var(--theme-text-primary)'"
// //               [style.font-family]="'var(--font-heading)'"
// //               [style.font-size]="'var(--font-size-3xl)'">Executive Overview</h1>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">
// //             Analyzing {{ dashboard()?.period?.days }} days of performance for Shivam Electronics
// //           </p>
// //         </div>
// //         <div class="flex items-center gap-2">
// //           <div class="px-3 py-1 border rounded-lg flex items-center gap-2" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
// //             <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold">HEALTH SCORE</span>
// //             <span class="font-bold text-emerald-500" [style.font-size]="'var(--font-size-md)'">{{ dashboard()?.inventory?.healthScore }}%</span>
// //           </div>
// //           <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadDashboard()"></p-button>
// //         </div>
// //       </div>

// //       <ng-container *ngIf="!loading(); else loader">
        
// //         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
// //           <div class="p-4 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'" [style.box-shadow]="'var(--shadow-sm)'">
// //             <div class="flex justify-between items-start mb-2">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Total Revenue</span>
// //               <i class="pi pi-wallet text-indigo-400"></i>
// //             </div>
// //             <div class="flex items-end gap-2">
// //               <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-3xl)'">
// //                 ₹{{ dashboard()?.financial?.totalRevenue?.value | number:'1.0-0' }}
// //               </h2>
// //               <span class="mb-1 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">
// //                 <i class="pi pi-arrow-up-right"></i> {{ dashboard()?.financial?.totalRevenue?.growth }}%
// //               </span>
// //             </div>
// //             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">
// //               Avg Ticket: ₹{{ dashboard()?.financial?.totalRevenue?.avgTicket | number }}
// //             </p>
// //           </div>

// //           <div class="p-4 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-start mb-2">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Net Profit</span>
// //               <i class="pi pi-chart-line text-emerald-400"></i>
// //             </div>
// //             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-success)'" [style.font-size]="'var(--font-size-3xl)'">
// //               ₹{{ dashboard()?.financial?.netProfit?.value | number:'1.0-0' }}
// //             </h2>
// //             <div class="flex gap-2 mt-2 items-center">
// //               <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold" [style.font-size]="'var(--font-size-xs)'">Margin {{ dashboard()?.financial?.netProfit?.margin }}%</span>
// //             </div>
// //           </div>

// //           <div class="p-4 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-start mb-2">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Receivables</span>
// //               <i class="pi pi-info-circle text-amber-400"></i>
// //             </div>
// //             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-warning)'" [style.font-size]="'var(--font-size-3xl)'">
// //               ₹{{ dashboard()?.financial?.outstanding?.receivables | number }}
// //             </h2>
// //             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Pending from 3 customers</p>
// //           </div>

// //           <div class="p-4 border transition-all hover:scale-[1.01]" 
// //                [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //             <div class="flex justify-between items-start mb-2">
// //               <span [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'" class="font-bold uppercase tracking-widest">Inventory Value</span>
// //               <i class="pi pi-box text-blue-400"></i>
// //             </div>
// //             <h2 class="font-bold tabular-nums" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-2xl)'">
// //               ₹{{ (dashboard()?.inventory?.summary?.valuation / 10000000) | number:'1.2-2' }} Cr
// //             </h2>
// //             <p class="mt-2" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">{{ dashboard()?.inventory?.inventoryValuation?.totalItems }} Units in Stock</p>
// //           </div>
// //         </div>

// //         <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
// //           <div class="lg:col-span-8 space-y-6">
            
// //             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="flex items-center gap-2 mb-4">
// //                 <i class="pi pi-sparkles text-indigo-400"></i>
// //                 <h3 class="font-bold uppercase tracking-tighter" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-md)'">Operational Insights</h3>
// //               </div>
// //               <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
// //                 @for (insight of dashboard()?.insights?.insights; track insight.title) {
// //                   <div class="p-3 border rounded-lg transition-all" 
// //                        [style.background]="'var(--theme-bg-ternary)'" [style.border-left]="insight.type === 'positive' ? '4px solid var(--theme-success)' : '4px solid var(--theme-info)'">
// //                     <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ insight.title }}</p>
// //                     <p class="mt-1" [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">{{ insight.message }}</p>
// //                   </div>
// //                 }
// //               </div>
// //             </div>

// //             <div class="border overflow-hidden" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <div class="p-4 border-b flex justify-between items-center" [style.border-color]="'var(--theme-border-primary)'" [style.background]="'var(--theme-bg-ternary)'">
// //                 <h3 class="font-bold uppercase tracking-tight" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-xs)'">Critical Inventory Alerts</h3>
// //                 <span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px]">{{ dashboard()?.alerts?.lowStockCount }} ACTIONS REQUIRED</span>
// //               </div>
// //               <p-table [value]="dashboard()?.inventory?.lowStockAlerts" styleClass="p-datatable-sm">
// //                 <ng-template pTemplate="header">
// //                   <tr>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Product</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Stock</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Threshold</th>
// //                     <th [style.background]="'transparent'" [style.color]="'var(--theme-text-label)'">Urgency</th>
// //                   </tr>
// //                 </ng-template>
// //                 <ng-template pTemplate="body" let-item>
// //                   <tr [style.color]="'var(--theme-text-secondary)'" [style.border-color]="'var(--theme-border-primary)'">
// //                     <td class="font-bold">{{ item.name }}</td>
// //                     <td [style.color]="'var(--theme-error)'" class="font-mono">{{ item.currentStock }}</td>
// //                     <td class="font-mono">{{ item.reorderLevel }}</td>
// //                     <td>
// //                       <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
// //                             [style.background]="'var(--theme-error)'" [style.color]="'#fff'">{{ item.urgency }}</span>
// //                     </td>
// //                   </tr>
// //                 </ng-template>
// //               </p-table>
// //             </div>
// //           </div>

// //           <div class="lg:col-span-4 space-y-6">
            
// //             <div class="p-5 border" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Top Sellers</h4>
// //               <div class="space-y-4">
// //                 @for (prod of dashboard()?.leaders?.topProducts; track prod._id) {
// //                   <div class="flex items-center justify-between">
// //                     <div class="flex items-center gap-3">
// //                       <div class="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
// //                         #{{ $index + 1 }}
// //                       </div>
// //                       <div>
// //                         <p class="font-bold leading-none truncate w-32" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ prod.name }}</p>
// //                         <p class="mt-1" [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-xs)'">Qty: {{ prod.soldQty }}</p>
// //                       </div>
// //                     </div>
// //                     <span class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">₹{{ prod.revenue | number }}</span>
// //                   </div>
// //                 }
// //               </div>
// //             </div>

// //             <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-secondary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Sales Leaderboard</h4>
// //               @for (staff of dashboard()?.operations?.topStaff; track staff._id) {
// //                 <div class="flex items-center justify-between group py-2 border-b border-white/5 last:border-0">
// //                   <div class="flex items-center gap-3">
// //                     <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px]" [style.background]="'var(--theme-accent-gradient)'">
// //                       {{ staff.name.charAt(0) }}
// //                     </div>
// //                     <div>
// //                       <p class="font-bold" [style.color]="'var(--theme-text-primary)'" [style.font-size]="'var(--font-size-sm)'">{{ staff.name }}</p>
// //                       <p [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">{{ staff.count }} deals closed</p>
// //                     </div>
// //                   </div>
// //                   <span class="font-bold tabular-nums text-emerald-500" [style.font-size]="'var(--font-size-sm)'">₹{{ staff.revenue | number }}</span>
// //                 </div>
// //               }
// //             </div>

// //             <div class="p-5 border transition-colors" [style.background]="'var(--theme-bg-ternary)'" [style.border-color]="'var(--theme-border-primary)'" [style.border-radius]="'var(--ui-border-radius-xl)'">
// //               <h4 class="font-bold mb-4 uppercase tracking-tighter" [style.color]="'var(--theme-text-label)'" [style.font-size]="'var(--font-size-xs)'">Customer Base</h4>
// //               <div class="space-y-3">
// //                 <div class="flex justify-between items-center">
// //                   <span [style.color]="'var(--theme-text-secondary)'" [style.font-size]="'var(--font-size-xs)'">Total Active</span>
// //                   <span class="font-bold" [style.color]="'var(--theme-text-primary)'">{{ dashboard()?.financial?.customers?.active }}</span>
// //                 </div>
// //                 <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
// //                   <div class="h-full bg-indigo-500" [style.width]="'40%'"></div>
// //                 </div>
// //                 <p class="text-[10px]" [style.color]="'var(--theme-text-tertiary)'">New Customers: {{ dashboard()?.customers?.segmentation['New Customer'] }}</p>
// //               </div>
// //             </div>

// //           </div>
// //         </div>
// //       </ng-container>

// //       <ng-template #loader>
// //         <div class="h-[60vh] flex flex-col items-center justify-center gap-4">
// //           <p-progressSpinner strokeWidth="4" fill="transparent" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
// //           <p [style.color]="'var(--theme-text-tertiary)'" [style.font-size]="'var(--font-size-sm)'">Compiling executive data...</p>
// //         </div>
// //       </ng-template>

// //     </div>
// //   `,
// //   styles: [`
// //     :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
// //       background: transparent !important;
// //       border-bottom: 1px solid var(--theme-border-primary) !important;
// //     }
// //     :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
// //       padding: 0.75rem 1rem;
// //       font-size: var(--font-size-xs);
// //       font-weight: 700;
// //       text-transform: uppercase;
// //       letter-spacing: 0.05em;
// //     }
// //   `]
// // })
// // export class DashboardUI implements OnInit {
// //   // Signals for Reactive UI
// //   dashboard = signal<any>(null);
// //   loading = signal<boolean>(true);

// //   constructor(
// //     private analyticsService: AdminAnalyticsService,
// //     public commonService: CommonMethodService
// //   ) {}

// //   ngOnInit() {
// //     this.loadDashboard();
// //   }

// //   loadDashboard() {
// //     this.loading.set(true);
// //     this.analyticsService.getDashboardOverview().subscribe({
// //       next: (res) => {
// //         if (res.status === 'success') {
// //           this.dashboard.set(res.data);
// //         }
// //         this.loading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Dashboard Error', err);
// //         this.loading.set(false);
// //       }
// //     });
// //   }
// // }